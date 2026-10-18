const POLISH_IDENTIFIERS = ['pl', 'poland', 'polska', 'польща'];
const EUROPEAN_IDENTIFIERS = ['eu', 'eur', 'de', 'fr', 'es', 'it', 'germany', 'france'];
const ANGLO_IDENTIFIERS = ['us', 'usa', 'uk', 'gb', 'сша'];
const UK_IDENTIFIERS = ['uk', 'gb'];

const numberFormatCache = new Map<string, Intl.NumberFormat>();
const getNumberFormatter = (locale: string, options?: Intl.NumberFormatOptions) => {
  const cacheKey = `${locale}-${JSON.stringify(options || {})}`;
  if (!numberFormatCache.has(cacheKey)) {
    numberFormatCache.set(cacheKey, new Intl.NumberFormat(locale, options));
  }
  return numberFormatCache.get(cacheKey)!;
};

export interface CurrencyInfo {
  code: string;
  locale: string;
  symbol: string;
}

export const getValue = (obj: Record<string, unknown> | null | undefined, path: string): unknown => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
};

export const getCurrencyInfo = (countryName?: string | null): CurrencyInfo => {
  if (!countryName) return { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
  const normalized = countryName.toLowerCase().trim();
  
  if (['ua', 'uah', 'ukraine', 'ukraina', 'україна'].includes(normalized)) return { code: 'UAH', locale: 'uk-UA', symbol: '₴' };
  if (POLISH_IDENTIFIERS.includes(normalized) || normalized === 'pln') {
    return { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
  }
  if (EUROPEAN_IDENTIFIERS.includes(normalized)) {
    return { code: 'EUR', locale: 'de-DE', symbol: '€' };
  }
  if (ANGLO_IDENTIFIERS.includes(normalized) || ['usd', 'gbp', 'united kingdom', 'united states'].includes(normalized)) {
    if (UK_IDENTIFIERS.includes(normalized) || ['gbp', 'united kingdom'].includes(normalized)) return { code: 'GBP', locale: 'en-GB', symbol: '£' };
    return { code: 'USD', locale: 'en-US', symbol: '$' };
  }
  return { code: 'USD', locale: 'en-US', symbol: '$' };
};

export const formatNumber = (value: unknown, locale: string = 'pl-PL'): string => {
  if (typeof value !== 'number' && typeof value !== 'string') return '';
  const num = Number(value);
  if (!Number.isFinite(num) || String(value).trim() === '') return '';
  if (Number.isNaN(num)) return String(value || '');
  return getNumberFormatter(locale).format(num);
};

export const formatPrice = (value: unknown, info?: CurrencyInfo): string => {
  if (typeof value !== 'number' && typeof value !== 'string') return '';
  const num = Number(value);
  if (!Number.isFinite(num) || String(value).trim() === '') return '';
  if (Number.isNaN(num)) return String(value || '');
  const currency = info || { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
  return getNumberFormatter(currency.locale, {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: 0
  }).format(num);
};

export const formatDate = (
  value: unknown,
  locale: string = 'uk-UA',
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!value) return '';
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, options);
};

export const getCrimeLevelText = (value: number): string => {
  if (value <= 2) return 'common.enums.very_low';
  if (value <= 4) return 'common.enums.low';
  if (value <= 6) return 'common.enums.moderate';
  if (value <= 8) return 'common.enums.high';
  return 'common.enums.very_high';
};

export const formatAirQuality = (value: unknown, t: (key: string) => string): string => {
  if (typeof value !== 'number' && typeof value !== 'string') return '';
  const numValue = Number(value);
  if (!Number.isFinite(numValue) || String(value).trim() === '') return '';
  if (Number.isNaN(numValue)) return String(value);
  let aqiEnum = 'medium';
  if (numValue <= 50) aqiEnum = 'good';
  else if (numValue > 100) aqiEnum = 'bad';
  return t(`common.enums.${aqiEnum}`);
};

export const formatTranslatedText = (value: unknown, t: (key: string) => string): string => {
  if (!['string', 'number', 'boolean'].includes(typeof value)) return '';
  const stringVal = String(value);
  const key = `common.enums.${stringVal.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? stringVal : translated;
};
