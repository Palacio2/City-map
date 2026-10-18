import { describe, it, expect } from 'vitest';
import { formatBillingAmount } from './billingAmount';
describe('invoice currency units', () => {
  it('preserves cents and uses the invoice currency', () => {
    expect(formatBillingAmount(12345,'USD','en-US')).toBe('$123.45');
    expect(formatBillingAmount(12345,'EUR','en-US')).toBe('€123.45');
    expect(formatBillingAmount(0,'USD','en-US')).toBe('$0.00');
  });
  it('handles zero and three decimal currencies and Stripe compatibility units', () => {
    expect(formatBillingAmount(123,'JPY','en-US')).toBe('¥123');
    expect(formatBillingAmount(12345,'KWD','en-US')).toContain('12.345');
    expect(formatBillingAmount(12300,'ISK','en-US')).toContain('123');
    expect(formatBillingAmount(12300,'UGX','en-US')).toContain('123');
  });
  it('never guesses a missing currency or presents malformed amounts as zero', () => {
    expect(formatBillingAmount(12345,'','en-US')).toBe('—');
    expect(formatBillingAmount(NaN,'USD')).toBe('—');
    expect(formatBillingAmount(12.5,'USD')).toBe('—');
  });
});
