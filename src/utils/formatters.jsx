import React from 'react';

export const getCurrencyInfo = (countryName) => {
  if (!countryName) return { code: 'UAH', locale: 'uk-UA', symbol: '₴' };
  
  const normalized = countryName.toLowerCase().trim();
  
  if (normalized === 'pl' || normalized.includes('poland') || normalized.includes('polska') || normalized.includes('польща')) {
    return { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
  }
  if (normalized === 'de' || normalized === 'fr' || normalized === 'es' || normalized === 'it' || 
      normalized.includes('germany') || normalized.includes('deutschland') || normalized.includes('німеччина') || 
      normalized.includes('france') || normalized.includes('italy') || normalized.includes('spain')) {
    return { code: 'EUR', locale: 'de-DE', symbol: '€' };
  }
  if (normalized === 'us' || normalized.includes('usa') || normalized.includes('america') || normalized.includes('сша')) {
    return { code: 'USD', locale: 'en-US', symbol: '$' };
  }
  if (normalized === 'uk' || normalized === 'gb' || normalized.includes('uk') || normalized.includes('britain') || normalized.includes('британія')) {
    return { code: 'GBP', locale: 'en-GB', symbol: '£' };
  }

  return { code: 'UAH', locale: 'uk-UA', symbol: '₴' };
};

export const formatNumber = (num, locale = 'uk-UA') => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat(locale).format(num);
};

export const formatPrice = (price, currencyInfo) => {
  if (price === null || price === undefined) return 'n/a';
  
  const info = currencyInfo || {};
  const code = info.code || 'UAH';
  const locale = info.locale || 'uk-UA';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0
    }).format(price);
  } catch (e) {
    console.error("Error formatting price:", e);
    return `${price}`;
  }
};

export const formatBoolean = (value, t) => {
  if (t) {
    return value ? t('enums.yes') : t('enums.no');
  }
  return value ? 'Yes' : 'No';
};

export const getCrimeLevelText = (crimeLevel) => {
  if (crimeLevel === null || crimeLevel === undefined) return 'enums.crime_medium';
  
  if (crimeLevel <= 3) return 'enums.crime_low';
  if (crimeLevel <= 6) return 'enums.crime_medium';
  return 'enums.crime_high';
};

export const getCrimeLevelLabel = getCrimeLevelText;

export const getCrimeLevelClass = (crimeLevel, styles = {}) => {
  if (crimeLevel === null || crimeLevel === undefined) return '';
  
  if (crimeLevel <= 3) return styles.lowCrime || 'lowCrime';
  if (crimeLevel <= 6) return styles.mediumCrime || 'mediumCrime';
  return styles.highCrime || 'highCrime';
};

export const renderRating = (rating) => {
  if (rating === null || rating === undefined) return 'n/a';
  
  const numericRating = parseFloat(rating);
  const fullStars = Math.floor(numericRating / 2);
  const halfStar = numericRating % 2 >= 1;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <div className="ratingStars" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ color: '#fbb03b', fontWeight: 'bold', marginRight: '4px' }}>{numericRating.toFixed(1)}</span>
      {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} style={{ color: '#fbb03b' }}>★</span>)}
      {halfStar && <span style={{ color: '#fbb03b' }}>★</span>} 
      {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} style={{ color: '#e0e0e0' }}>★</span>)}
    </div>
  );
};