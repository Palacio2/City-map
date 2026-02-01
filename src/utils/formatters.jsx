import React from 'react';
import { FaCheck, FaTimes, FaMinus } from 'react-icons/fa';

// === Currency & Numbers ===

export const getCurrencyInfo = (countryName) => {
  if (!countryName) return { code: 'UAH', locale: 'uk-UA', symbol: '₴' };
  
  const normalized = countryName.toLowerCase().trim();
  
  if (normalized === 'pl' || normalized.includes('poland') || normalized.includes('polska') || normalized.includes('польща')) {
    return { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
  }
  if (['de', 'fr', 'es', 'it'].includes(normalized) || 
      normalized.includes('germany') || normalized.includes('france') || normalized.includes('italy') || normalized.includes('spain')) {
    return { code: 'EUR', locale: 'de-DE', symbol: '€' };
  }
  if (['us', 'usa', 'uk', 'gb'].some(k => normalized.includes(k)) || normalized.includes('america') || normalized.includes('сша')) {
    if (normalized.includes('uk') || normalized.includes('gb')) return { code: 'GBP', locale: 'en-GB', symbol: '£' };
    return { code: 'USD', locale: 'en-US', symbol: '$' };
  }

  return { code: 'UAH', locale: 'uk-UA', symbol: '₴' };
};

export const formatNumber = (val, unit = '') => {
  if (val === null || val === undefined) return '-';
  const safeUnit = typeof unit === 'string' ? unit : ''; 
  return new Intl.NumberFormat('uk-UA').format(val) + safeUnit;
};

export const formatPrice = (price, currencyInfoOrCountry) => {
  if (price === null || price === undefined) return 'n/a';
  
  let info = currencyInfoOrCountry;
  if (typeof currencyInfoOrCountry === 'string') {
     info = getCurrencyInfo(currencyInfoOrCountry);
  }
  
  const code = info?.code || 'UAH';
  const locale = info?.locale || 'uk-UA';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0
    }).format(price);
  } catch (e) {
    return `${price}`;
  }
};

// === Boolean & Levels ===

export const formatBoolean = (val, t = null, useIcons = false, styles = {}) => {
  if (useIcons) {
    if (val === true) return <FaCheck className={styles.check || 'icon-check'} style={{ color: 'green' }} />;
    if (val === false) return <FaTimes className={styles.cross || 'icon-cross'} style={{ color: 'red' }} />;
    return <FaMinus className={styles.dash || 'icon-dash'} style={{ color: '#ccc' }} />;
  }
  
  if (t) {
    return val === true ? t('common:enums.yes') : (val === false ? t('common:enums.no') : '-');
  }
  
  return val === true ? 'Yes' : (val === false ? 'No' : '-');
};

// Аліас для сумісності, якщо десь використовується formatBool
export const formatBool = formatBoolean;

export const formatLevel = (val, t) => {
  return val ? t(`common:enums.${val.toLowerCase()}`, { defaultValue: val }) : '-';
};

export const getCrimeLevelText = (crimeLevel) => {
  if (crimeLevel === null || crimeLevel === undefined) return 'common:enums.crime_medium';
  if (crimeLevel <= 3) return 'common:enums.crime_low';
  if (crimeLevel <= 6) return 'common:enums.crime_medium';
  return 'common:enums.crime_high';
};

export const getCrimeLevelClass = (crimeLevel, styles = {}) => {
  if (crimeLevel === null || crimeLevel === undefined) return '';
  if (crimeLevel <= 3) return styles.lowCrime || 'lowCrime';
  if (crimeLevel <= 6) return styles.mediumCrime || 'mediumCrime';
  return styles.highCrime || 'highCrime';
};

// === Components ===

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