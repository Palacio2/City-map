import type Stripe from 'npm:stripe@22.6.0';

export class PromoError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function promoProducts(value: string | undefined): string[] {
  const products = [...new Set((value ?? '').split(',').map(v => v.trim()).filter(Boolean))];
  if (!products.length || products.length > 20 || products.some(id => !/^prod_[A-Za-z0-9]+$/.test(id))) {
    throw new PromoError('City-map promotion products are not configured', 503);
  }
  return products;
}
export function ownsPromo(promo: Stripe.PromotionCode, coupon: Stripe.Coupon, products: string[]) {
  const scope = coupon.applies_to?.products;
  return promo.metadata?.app === 'city-map' && coupon.metadata?.app === 'city-map'
    && !!scope?.length && scope.every(id => products.includes(id));
}
export async function couponFor(stripe: Stripe, promo: Stripe.PromotionCode): Promise<Stripe.Coupon> {
  const coupon = promo.promotion.coupon;
  if (promo.promotion.type !== 'coupon' || !coupon) throw new PromoError('Unsupported promotion', 404);
  return typeof coupon === 'string' ? await stripe.coupons.retrieve(coupon) : coupon;
}
