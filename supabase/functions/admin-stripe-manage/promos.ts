import type Stripe from 'npm:stripe@22.6.0';

import { PromoError, ownsPromo, couponFor } from '../_shared/promotionScope.ts';
const app = 'city-map';
export interface PromoJournal {
  begin(key: string, action: string, payload: Record<string, unknown>): Promise<Record<string, unknown> | null>;
  complete(key: string, result: Record<string, unknown>): Promise<void>;
}
function dto(promo: Stripe.PromotionCode, coupon: Stripe.Coupon) {
  return { id: promo.id, code: promo.code, times_redeemed: promo.times_redeemed,
    coupon: { percent_off: coupon.percent_off, duration: coupon.duration } };
}
export async function managePromo(stripe: Stripe, action: string, payload: Record<string, unknown>,
  products: string[], journal: PromoJournal) {
  products = [...products].sort();
  if (action === 'list_promos') {
    const cursor = payload.cursor;
    if (cursor !== undefined && (typeof cursor !== 'string' || !/^promo_[A-Za-z0-9]+$/.test(cursor))) {
      throw new PromoError('Invalid cursor');
    }
    const page = await stripe.promotionCodes.list({ active: true, limit: 100,
      ...(cursor ? { starting_after: cursor as string } : {}), expand: ['data.promotion.coupon'] });
    const codes = [];
    for (const promo of page.data) {
      if (promo.metadata?.app !== app || promo.promotion.type !== 'coupon') continue;
      const coupon = await couponFor(stripe, promo);
      if (ownsPromo(promo, coupon, products)) codes.push(dto(promo, coupon));
    }
    return { success: true, codes, nextCursor: page.has_more ? page.data.at(-1)?.id ?? null : null };
  }
  if (action === 'delete_promo') {
    if (typeof payload.id !== 'string' || !/^promo_[A-Za-z0-9]+$/.test(payload.id)) throw new PromoError('Invalid promotion');
    const promo = await stripe.promotionCodes.retrieve(payload.id);
    const coupon = await couponFor(stripe, promo);
    if (!ownsPromo(promo, coupon, products)) throw new PromoError('Promotion not found', 404);
    const operationKey = `disable:${crypto.randomUUID()}`;
    await journal.begin(operationKey, action, { id: promo.id, products: [...products].sort() });
    await stripe.promotionCodes.update(promo.id, { active: false });
    await journal.complete(operationKey, { success: true, id: promo.id });
    return { success: true };
  }
  if (action !== 'create_promo') throw new PromoError('Invalid action');
  const { code, percentOff, duration, maxRedemptions, requestId } = payload;
  if (typeof code !== 'string' || !/^[A-Z0-9]{1,64}$/.test(code)
    || typeof percentOff !== 'number' || !Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100
    || typeof duration !== 'string' || !['once', 'repeating', 'forever'].includes(duration)
    || (maxRedemptions !== undefined && (typeof maxRedemptions !== 'number' || !Number.isSafeInteger(maxRedemptions) || maxRedemptions < 1))
    || typeof requestId !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(requestId)) {
    throw new PromoError('Invalid promotion parameters');
  }
  const operationKey = `create:${requestId.toLowerCase()}`;
  const previous = await journal.begin(operationKey, action, { code, percentOff, duration,
    maxRedemptions: maxRedemptions ?? null, products: [...products].sort() });
  if (previous) return previous;
  const metadata = { app, request_id: requestId.toLowerCase() };
  const coupon = await stripe.coupons.create({ percent_off: percentOff,
    duration: duration as Stripe.CouponCreateParams.Duration,
    ...(duration === 'repeating' ? { duration_in_months: 1 } : {}),
    applies_to: { products }, metadata,
  }, { idempotencyKey: `${app}:coupon:${requestId.toLowerCase()}` });
  // Keep the coupon on ambiguous failures: retrying the same request reuses both Stripe objects.
  const promo = await stripe.promotionCodes.create({ promotion: { type: 'coupon', coupon: coupon.id },
    code, metadata, ...(maxRedemptions !== undefined ? { max_redemptions: maxRedemptions as number } : {}),
  }, { idempotencyKey: `${app}:promo:${requestId.toLowerCase()}` });
  const result = { success: true, promoCode: dto(promo, coupon) };
  await journal.complete(operationKey, result);
  return result;
}
