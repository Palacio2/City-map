import type Stripe from 'npm:stripe@22.6.0';
import { couponFor, ownsPromo } from '../_shared/promotionScope.ts';
import type { PromoJournal } from './promos.ts';

export interface PendingPromoOperation {
  operation_key: string;
  action: string;
  payload: Record<string, unknown>;
}
const sameProducts = (actual: unknown, expected: unknown) => Array.isArray(actual) && Array.isArray(expected)
  && actual.every(p => typeof p === 'string') && expected.every(p => typeof p === 'string')
  && JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());

// Reconciliation reads Stripe only. Missing or ambiguous evidence never
// authorizes another create/update, even after Stripe forgets an old key.
export async function reconcilePromoOperations(stripe: Stripe, products: string[],
  jobs: PendingPromoOperation[], complete: PromoJournal['complete']) {
  for (const job of jobs.slice(0,3)) {
    try {
      const expected = job.payload;
      if (job.action === 'delete_promo') {
        if (typeof expected.id !== 'string' || !/^promo_[A-Za-z0-9]+$/.test(expected.id)) continue;
        const promo = await stripe.promotionCodes.retrieve(expected.id);
        const coupon = await couponFor(stripe,promo);
        if (promo.id === expected.id && promo.active === false && ownsPromo(promo,coupon,products)
          && sameProducts(coupon.applies_to?.products,expected.products)) {
          await complete(job.operation_key,{success:true,id:promo.id});
        }
        continue;
      }
      if (job.action !== 'create_promo' || typeof expected.code !== 'string') continue;
      const requestId = job.operation_key.match(/^create:([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$/)?.[1];
      if (!requestId) continue;
      let cursor: string | undefined;
      let exhausted = false;
      const matches: Array<{promo: Stripe.PromotionCode; coupon: Stripe.Coupon}> = [];
      for (let pageNumber=0;pageNumber<3;pageNumber++) {
        const page = await stripe.promotionCodes.list({code:expected.code,limit:100,
          ...(cursor ? {starting_after:cursor} : {}),expand:['data.promotion.coupon']});
        for (const promo of page.data) {
          if (promo.metadata?.app !== 'city-map' || promo.metadata?.request_id !== requestId
            || promo.promotion.type !== 'coupon' || promo.code !== expected.code) continue;
          const coupon = await couponFor(stripe,promo);
          if (ownsPromo(promo,coupon,products) && coupon.metadata?.request_id === requestId
            && sameProducts(coupon.applies_to?.products,expected.products)
            && coupon.percent_off === expected.percentOff && coupon.duration === expected.duration
            && (expected.duration !== 'repeating' || coupon.duration_in_months === 1)
            && (promo.max_redemptions ?? null) === (expected.maxRedemptions ?? null)) matches.push({promo,coupon});
        }
        if (!page.has_more) {exhausted=true;break;}
        const next = page.data.at(-1)?.id;
        if (!next || next === cursor) break;
        cursor = next;
      }
      if (!exhausted || matches.length !== 1) continue;
      const {promo,coupon} = matches[0];
      await complete(job.operation_key,{success:true,promoCode:{id:promo.id,code:promo.code,times_redeemed:promo.times_redeemed,
        coupon:{percent_off:coupon.percent_off,duration:coupon.duration}}});
    } catch {
      // Keep the durable receipt pending on Stripe/DB failure; listing stays usable.
    }
  }
}
