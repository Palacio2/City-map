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

export const formatNumber = (num) => {
  if (!num && num !== 0) return 'н/д';
  return new Intl.NumberFormat('uk-UA').format(num);
};

export const formatPrice = (price, currency = 'UAH', locale = 'uk-UA') => {
  if (!price && price !== 0) return 'н/д';
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
  if (!frequency) return 'н/д';
  switch (frequency) {
    case 'high': return 'Висока';
    case 'medium': return 'Середня';
    case 'low': return 'Низька';
    default: return frequency;
  }
};

export const getDensityText = (density) => {
  if (!density) return 'н/д';
  switch (density) {
    case 'high': return 'Висока';
    case 'medium': return 'Середня';
    case 'low': return 'Низька';
    default: return density;
  }
};

export const getCrimeLevelText = (crimeLevel) => {
  if (!crimeLevel && crimeLevel !== 0) return 'н/д';
  if (crimeLevel <= 3) return 'Низький';
  if (crimeLevel <= 6) return 'Середній';
  return 'Високий';
};

export const getCrimeLevelClass = (crimeLevel) => {
  if (!crimeLevel && crimeLevel !== 0) return '';
  if (crimeLevel <= 3) return 'lowCrime';
  if (crimeLevel <= 6) return 'mediumCrime';
  return 'highCrime';
};

export const renderRating = (rating) => {
  if (!rating && rating !== 0) return 'н/д';
  const fullStars = Math.floor(rating / 2);
  const halfStar = rating % 2 >= 1;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <div className="ratingStars">
      {'★'.repeat(fullStars)}
      {halfStar && '½'}
      {'☆'.repeat(emptyStars)}
      <span className="ratingValue">({rating.toFixed(1)})</span>
    </div>
  );
};