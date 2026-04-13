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
  if (!countryName) return { code: 'UAH', locale: 'uk-UA', symbol: '₴' };
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
  return { code: 'UAH', locale: 'uk-UA', symbol: '₴' };
};

export const formatNumber = (val: number | string | null | undefined, unit: string = ''): string => {
  if (val === null || val === undefined) return '-';
  const safeUnit = typeof unit === 'string' ? unit : ''; 
  return new Intl.NumberFormat('uk-UA').format(Number(val)) + safeUnit;
};

export const formatPrice = (price: number | string | null | undefined, currencyInfoOrCountry?: string | CurrencyInfo): string => {
  if (price === null || price === undefined) return '-';
  
  const info = typeof currencyInfoOrCountry === 'string' 
    ? getCurrencyInfo(currencyInfoOrCountry) 
    : (currencyInfoOrCountry || { code: 'UAH', locale: 'uk-UA', symbol: '₴' });

  try {
    return new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: info.code,
      maximumFractionDigits: 0
    }).format(Number(price));
  } catch {
    return String(price);
  }
};

export const getCrimeLevelText = (crimeLevel: number | null | undefined): string => {
  if (crimeLevel === null || crimeLevel === undefined) return 'enums.crime_medium';
  if (crimeLevel <= 3) return 'enums.crime_low';
  if (crimeLevel <= 6) return 'enums.crime_medium';
  return 'enums.crime_high';
};

export const getCrimeLevelClass = (crimeLevel: number | null | undefined, styles: Record<string, string> = {}): string => {
  if (crimeLevel === null || crimeLevel === undefined) return '';
  if (crimeLevel <= 3) return styles.lowCrime || 'lowCrime';
  if (crimeLevel <= 6) return styles.mediumCrime || 'mediumCrime';
  return styles.highCrime || 'highCrime';
};

export const getRatingColor = (rating: number | string | null | undefined): string => {
  if (rating === null || rating === undefined) return '';
  const num = parseFloat(String(rating));
  if (num >= 8) return 'highRating';
  if (num >= 5) return 'mediumRating';
  return 'lowRating';
};

export const getRatingColorClass = (rating: number | string | null | undefined): string => {
  const color = getRatingColor(rating);
  return color ? ` ${color}` : '';
};

export const formatAirQuality = (value: any, t: (key: string) => string): string => {
  const numValue = Number.parseFloat(String(value));
  if (Number.isNaN(numValue)) return String(value);
  let aqiEnum = 'medium';
  if (numValue <= 50) aqiEnum = 'good';
  else if (numValue > 100) aqiEnum = 'bad';
  return t(`enums.${aqiEnum}`);
};

export const formatTranslatedText = (value: any, t: (key: string) => string): string => {
  const stringVal = String(value);
  const key = `enums.${stringVal.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? stringVal : translated;
};

export const formatNumericField = (value: any, fieldKey: string, t: (key: string) => string): string => {
  const formatted = formatNumber(value);
  const units = {
    sqm: ['avgParkSize', 'propertyPricePerSqm', 'costPerSqm', 'average_park_size_sqm', 'average_sale_price_sqm', 'utilities_cost_per_sqm'],
    m: ['transportAvgDistance', 'transport_average_distance_m'],
    km: ['bikeLanes', 'bike_lanes_km'],
    percent: ['greenSpaces', 'unemploymentRate', 'green_spaces_percent', 'unemployment_rate']
  };

  if (units.sqm.includes(fieldKey)) return `${formatted} ${t('units.sqm')}`;
  if (units.m.includes(fieldKey)) return `${formatted} ${t('units.m')}`;
  if (units.km.includes(fieldKey)) return `${formatted} ${t('units.km')}`;
  if (units.percent.includes(fieldKey)) return `${formatted}%`;
  
  return formatted;
};