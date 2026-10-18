import type Stripe from 'npm:stripe@22.6.0';
import { couponFor, ownsPromo, promoProducts } from '../_shared/promotionScope.ts';
import { CheckoutError } from './checkout.ts';

export async function resolvePromotion(stripe: Stripe, input: unknown, priceId: string,
  configuredProducts: string | undefined): Promise<string | null> {
  if (input === undefined || input === '') return null;
  const invalid = () => new CheckoutError('payment.errors.invalid_promo', 400);
  if (typeof input !== 'string' || !/^[A-Za-z0-9]{1,64}$/.test(input)) throw invalid();
  const products = promoProducts(configuredProducts);
  const page = await stripe.promotionCodes.list({ code: input, active: true, limit: 2,
    expand: ['data.promotion.coupon'] });
  // Customer-specific duplicate codes are deliberately unsupported in this checkout.
  if (page.has_more || page.data.length !== 1) throw invalid();
  const promo = page.data[0];
  if (!promo.active || promo.code.toUpperCase() !== input.toUpperCase()
    || promo.promotion.type !== 'coupon' || promo.customer
    || (promo.expires_at !== null && promo.expires_at <= Date.now() / 1000)
    || (promo.max_redemptions !== null && promo.times_redeemed >= promo.max_redemptions)) throw invalid();
  const coupon = await couponFor(stripe, promo);
  if (!coupon.valid || !ownsPromo(promo, coupon, products)) throw invalid();
  const price = await stripe.prices.retrieve(priceId);
  const product = typeof price.product === 'string' ? price.product : price.product.id;
  if (!price.active || !products.includes(product) || !coupon.applies_to?.products.includes(product)) throw invalid();
  return promo.id;
}
