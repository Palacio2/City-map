import { z } from 'zod';
export const PaymentResponseSchema = z.object({
  sessionId: z.string().regex(/^cs_[A-Za-z0-9_]+$/),
  completed: z.boolean(),
  url: z.string().url().nullable(),
}).refine((value) =>
  value.completed ? value.url === null : value.url !== null && isStripeCheckoutUrl(value.url)
);
function isStripeCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com' && !url.port &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}
export const CheckoutStatusSchema = z.object({
  sessionId: z.string(),
  status: z.enum(['open', 'complete', 'expired']),
  paymentStatus: z.enum(['paid', 'unpaid', 'no_payment_required']),
  confirmed: z.boolean(),
});
