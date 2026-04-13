import React from 'react';

interface RatingStarsProps {
  rating?: number | null;
}

export const RatingStars: React.FC<RatingStarsProps> = ({ rating }) => {
  if (rating === null || rating === undefined) return <span>-</span>;
  
  const numericRating = Number(rating);
  const fullStars = Math.floor(numericRating / 2);
  const halfStar = numericRating % 2 >= 1;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <div className="flex items-center gap-1">
      <span className="text-accent font-bold mr-1">
        {numericRating.toFixed(1)}
      </span>
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="text-accent">★</span>
      ))}
      {halfStar && <span className="text-accent/60">★</span>} 
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="text-borderClient">★</span>
      ))}
    </div>
  );
};