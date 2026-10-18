const ZERO_DECIMAL = new Set(['BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA','PYG','RWF','VND','VUV','XAF','XOF','XPF']);
const THREE_DECIMAL = new Set(['BHD','JOD','KWD','OMR','TND']);
// Stripe retains two-digit charge units for ISK and UGX.
export function stripeCurrencyDivisor(currency: string): number {
  return ZERO_DECIMAL.has(currency) ? 1 : THREE_DECIMAL.has(currency) ? 1000 : 100;
}
