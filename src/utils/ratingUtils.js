export const getRatingColor = (rating) => {
  if (rating === null || rating === undefined) return '';
  const num = parseFloat(rating);
  if (num >= 8) return 'highRating';
  if (num >= 5) return 'mediumRating';
  return 'lowRating';
};
export const getRatingColorClass = (rating) => {
  const color = getRatingColor(rating);
  return color ? ` ${color}` : '';
};