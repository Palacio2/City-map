// Invoice amounts use Stripe charge units, including its ISK/UGX two-digit
// compatibility representation (which differs from ISO display precision).
import { stripeCurrencyDivisor } from '../../../../shared/billingCurrency';
export function formatBillingAmount(amount: number, currency: string, locale = 'en'): string {
  if (!Number.isSafeInteger(amount) || amount < 0 || typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) return '—';
  const divisor = stripeCurrencyDivisor(currency);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount / divisor);
}
