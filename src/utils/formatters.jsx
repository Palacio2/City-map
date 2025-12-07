export const formatNumber = (num) => {
  if (!num && num !== 0) return 'н/д';
  return new Intl.NumberFormat('uk-UA').format(num);
};

export const formatPrice = (price) => {
  if (!price && price !== 0) return 'н/д';
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 0
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