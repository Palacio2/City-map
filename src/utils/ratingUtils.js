export const getRatingColor = (rating) => {
  if (!rating && rating !== 0) return '';
  if (rating >= 8) return 'highRating';
  if (rating >= 5) return 'mediumRating';
  return 'lowRating';
};

export const getRatingColorClass = (rating) => {
  const color = getRatingColor(rating);
  return color ? ` ${color}` : '';
};