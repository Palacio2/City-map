export interface CurrencyInfo {
  code: string;
  locale: string;
  symbol: string;
}

export const getValue = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const getCurrencyInfo = (countryName?: string | null): CurrencyInfo => {
  if (!countryName) return { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
  const normalized = countryName.toLowerCase().trim();
  
  if (['pl', 'poland', 'polska', 'польща'].some(k => normalized.includes(k))) {
    return { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
  }
  if (['de', 'fr', 'es', 'it', 'germany', 'france'].some(k => normalized.includes(k))) {
    return { code: 'EUR', locale: 'de-DE', symbol: '€' };
  }
  if (['us', 'usa', 'uk', 'gb', 'сша'].some(k => normalized.includes(k))) {
    if (['uk', 'gb'].some(k => normalized.includes(k))) return { code: 'GBP', locale: 'en-GB', symbol: '£' };
    return { code: 'USD', locale: 'en-US', symbol: '$' };
  }
  return { code: 'USD', locale: 'en-US', symbol: '$' };
};

export const formatNumber = (value: any): string => {
  const num = Number.parseFloat(String(value));
  if (Number.isNaN(num)) return String(value || '');
  return new Intl.NumberFormat('pl-PL').format(num);
};

export const formatPrice = (value: any, info?: CurrencyInfo): string => {
  const num = Number.parseFloat(String(value));
  if (Number.isNaN(num)) return String(value || '');
  const currency = info || { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: 0
  }).format(num);
};

export const getCrimeLevelText = (value: number): string => {
  if (value <= 2) return 'common.enums.very_low';
  if (value <= 4) return 'common.enums.low';
  if (value <= 6) return 'common.enums.moderate';
  if (value <= 8) return 'common.enums.high';
  return 'common.enums.very_high';
};

export const formatAirQuality = (value: any, t: (key: string) => string): string => {
  const numValue = Number.parseFloat(String(value));
  if (Number.isNaN(numValue)) return String(value);
  let aqiEnum = 'medium';
  if (numValue <= 50) aqiEnum = 'good';
  else if (numValue > 100) aqiEnum = 'bad';
  return t(`common.enums.${aqiEnum}`);
};

export const formatTranslatedText = (value: any, t: (key: string) => string): string => {
  const stringVal = String(value);
  const key = `common.enums.${stringVal.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? stringVal : translated;
};

export const formatNumericField = (value: any, fieldKey: string, t: (key: string) => string): string => {
  const formatted = formatNumber(value);
  const units: Record<string, string[]> = {
    sqm: ['avgParkSize', 'propertyPricePerSqm', 'costPerSqm', 'average_park_size_sqm', 'average_sale_price_sqm', 'utilities_cost_per_sqm'],
    m: ['transportAvgDistance', 'transport_average_distance_m'],
    km: ['bikeLanes', 'bike_lanes_km'],
    percent: ['greenSpaces', 'unemploymentRate', 'green_spaces_percent', 'unemployment_rate']
  };

  for (const [unit, keys] of Object.entries(units)) {
    if (keys.includes(fieldKey)) {
      return `${formatted} ${t(`common.units.${unit}`)}`;
    }
  }

  return formatted;
};