import React from 'react';

export const getCurrencyInfo = (countryName) => {
  if (!countryName) return { code: 'UAH', locale: 'uk-UA', symbol: '₴' };
  
  const normalized = countryName.toLowerCase().trim();
  
  if (normalized.includes('poland') || normalized.includes('polska') || normalized.includes('польща')) {
    return { code: 'PLN', locale: 'pl-PL', symbol: 'zł' };
  }
  if (normalized.includes('germany') || normalized.includes('deutschland') || normalized.includes('німеччина') || 
      normalized.includes('france') || normalized.includes('italy') || normalized.includes('spain')) {
    return { code: 'EUR', locale: 'de-DE', symbol: '€' };
  }
  if (normalized.includes('usa') || normalized.includes('america') || normalized.includes('сша')) {
    return { code: 'USD', locale: 'en-US', symbol: '$' };
  }
  if (normalized.includes('uk') || normalized.includes('britain') || normalized.includes('британія')) {
    return { code: 'GBP', locale: 'en-GB', symbol: '£' };
  }

  return { code: 'UAH', locale: 'uk-UA', symbol: '₴' };
};

export const formatNumber = (num, locale = 'uk-UA') => {
  if (num === null || num === undefined) return 'н/д';
  return new Intl.NumberFormat(locale).format(num);
};

export const formatPrice = (price, currency = 'UAH', locale = 'uk-UA') => {
  if (price === null || price === undefined) return 'н/д';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

export const formatBoolean = (value) => {
  return value ? '✅' : '❌';
};

export const getFrequencyText = (frequency) => {
  if (!frequency) return null;
  return `enums.frequency.${frequency.toLowerCase()}`;
};

export const getDensityText = (density) => {
  if (!density) return null;
  return `enums.density.${density.toLowerCase()}`;
};

// Логіка тексту (повертає ключ перекладу)
export const getCrimeLevelText = (crimeLevel) => {
  if (crimeLevel === null || crimeLevel === undefined) return null;
  // Якщо 0-3: Низька злочинність (Добре)
  if (crimeLevel <= 3) return 'enums.crime.low';
  // Якщо 3-6: Середня
  if (crimeLevel <= 6) return 'enums.crime.medium';
  // Якщо > 6: Висока (Погано)
  return 'enums.crime.high';
};

// 🔥 ВИПРАВЛЕНО ТУТ: Функція тепер приймає styles
export const getCrimeLevelClass = (crimeLevel, styles = {}) => {
  if (crimeLevel === null || crimeLevel === undefined) return '';
  
  // Повертаємо клас з об'єкта styles, або рядок як запасний варіант
  if (crimeLevel <= 3) return styles.lowCrime || 'lowCrime';
  if (crimeLevel <= 6) return styles.mediumCrime || 'mediumCrime';
  return styles.highCrime || 'highCrime';
};

export const renderRating = (rating) => {
  if (rating === null || rating === undefined) return 'н/д';
  
  const numericRating = parseFloat(rating);
  const fullStars = Math.floor(numericRating / 2);
  const halfStar = numericRating % 2 >= 1;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <div className="ratingStars" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ color: '#fbbf24' }}>
        {'★'.repeat(Math.max(0, fullStars))}
      </span>
      {halfStar && <span style={{ color: '#fbbf24' }}>½</span>}
      <span style={{ color: '#d1d5db' }}>
        {'★'.repeat(Math.max(0, emptyStars))}
      </span>
      <span style={{ marginLeft: '4px', fontSize: '0.9em', color: '#666' }}>
        ({numericRating.toFixed(1)})
      </span>
    </div>
  );
};