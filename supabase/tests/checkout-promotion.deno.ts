import type Stripe from 'npm:stripe@22.6.0';
import { resolvePromotion } from '../functions/process-payment/promotion.ts';

function fixture() {
  const coupon = { id: 'coupon_city', metadata: { app: 'city-map' }, valid: true,
    applies_to: { products: ['prod_city'] }, percent_off: 100 };
  const promo = { id: 'promo_city', code: 'CITY100', active: true, metadata: { app: 'city-map' },
    promotion: { type: 'coupon', coupon }, customer: null as string | null,
    expires_at: null as number | null, max_redemptions: null as number | null, times_redeemed: 0 };
  const page = { data: [promo], has_more: false };
  const price = { active: true, product: 'prod_city' };
  const calls: string[] = [];
  const stripe = { promotionCodes: { list: () => { calls.push('list'); return Promise.resolve(page); } },
    prices: { retrieve: () => { calls.push('price'); return Promise.resolve(price); } },
  } as unknown as Stripe;
  return { coupon, promo, page, price, calls, run: (code: unknown = 'CITY100', products = 'prod_city') =>
    resolvePromotion(stripe, code, 'price_city', products) };
}
async function rejects(fn: () => Promise<unknown>) {
  try { await fn(); } catch { return; }
  throw new Error('Expected rejected promotion');
}
Deno.test('only server-resolved City-map promotion is returned, including a full discount', async () => {
  const f = fixture();
  if (await f.run('city100') !== 'promo_city') throw new Error('Wrong promotion');
  if (f.calls.join() !== 'list,price') throw new Error('Product not verified');
});
Deno.test('absent codes need no Stripe lookup; malformed codes and missing configuration fail closed', async () => {
  const f = fixture();
  if (await f.run('') !== null) throw new Error('Unexpected discount');
  for (const input of [null, {}, [], 'A B', 'a'.repeat(65)]) await rejects(() => f.run(input));
  await rejects(() => f.run('CITY100', ''));
  if (f.calls.length) throw new Error('Unexpected Stripe request');
});
Deno.test('foreign, untagged, broad and mixed product coupons cannot be used', async () => {
  for (const mutate of [
    (f: ReturnType<typeof fixture>) => { f.promo.metadata.app = 'other'; },
    (f: ReturnType<typeof fixture>) => { f.coupon.metadata.app = ''; },
    (f: ReturnType<typeof fixture>) => { f.coupon.applies_to.products = []; },
    (f: ReturnType<typeof fixture>) => { f.coupon.applies_to.products.push('prod_other'); },
    (f: ReturnType<typeof fixture>) => { f.price.product = 'prod_other'; },
    (f: ReturnType<typeof fixture>) => { f.price.active = false; },
  ]) { const f = fixture(); mutate(f); await rejects(() => f.run()); }
});
Deno.test('invalid, exhausted, expired, customer-bound and ambiguous promotions are rejected', async () => {
  for (const mutate of [
    (f: ReturnType<typeof fixture>) => { f.coupon.valid = false; },
    (f: ReturnType<typeof fixture>) => { f.promo.active = false; },
    (f: ReturnType<typeof fixture>) => { f.promo.expires_at = 1; },
    (f: ReturnType<typeof fixture>) => { f.promo.max_redemptions = 1; f.promo.times_redeemed = 1; },
    (f: ReturnType<typeof fixture>) => { f.promo.customer = 'cus_other'; },
    (f: ReturnType<typeof fixture>) => { f.promo.code = 'OTHER'; },
    (f: ReturnType<typeof fixture>) => { f.page.data = []; },
    (f: ReturnType<typeof fixture>) => { f.page.data.push(f.promo); },
    (f: ReturnType<typeof fixture>) => { f.page.has_more = true; },
  ]) { const f = fixture(); mutate(f); await rejects(() => f.run()); }
});
