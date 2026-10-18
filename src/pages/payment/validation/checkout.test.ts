import { expect, it } from 'vitest';
import { PaymentResponseSchema } from './index';
it.each([
  'http://checkout.stripe.com/pay',
  'https://checkout.stripe.com.evil.example/pay',
  'https://evil.example',
  'javascript:alert(1)',
  'https://user@checkout.stripe.com/pay',
])('rejects redirect %s', (url) => {
  expect(
    PaymentResponseSchema.safeParse({ sessionId: 'cs_test_one', completed: false, url }).success,
  ).toBe(false);
});
it('accepts only a Stripe URL or a completed session without URL', () => {
  expect(
    PaymentResponseSchema.safeParse({
      sessionId: 'cs_test_one',
      completed: false,
      url: 'https://checkout.stripe.com/c/pay/one',
    }).success,
  ).toBe(true);
  expect(
    PaymentResponseSchema.safeParse({ sessionId: 'cs_test_one', completed: true, url: null })
      .success,
  ).toBe(true);
  expect(
    PaymentResponseSchema.safeParse({ sessionId: 'cs_test_one', completed: false, url: null })
      .success,
  ).toBe(false);
});
