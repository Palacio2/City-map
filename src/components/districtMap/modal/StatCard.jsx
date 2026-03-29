import React from 'react';
import { useTranslation } from 'react-i18next';
import { getRatingColor } from '@utils/ratingUtils';

export default function StatCard({
  title,
  icon,
  rating,
  children
}) {
  const { t } = useTranslation('districts');

  // Мапимо класи з getRatingColor на Tailwind
  const ratingClass = getRatingColor(rating);
  const colorClasses = {
    highRating: 'text-success bg-success/10 border-success/20',
    mediumRating: 'text-warning bg-warning/10 border-warning/20',
    lowRating: 'text-danger bg-danger/10 border-danger/20'
  };
  
  const appliedClass = rating 
    ? (colorClasses[ratingClass] || 'text-textSecondary bg-hover border-borderClient') 
    : 'text-textSecondary bg-hover border-borderClient';

  return (
    <div className="bg-surface border border-borderClient rounded-xl p-5 md:p-6 transition-all duration-200 shadow-sm w-full box-border overflow-hidden relative flex flex-col hover:border-accent hover:-translate-y-1 hover:shadow-hover dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-accent dark:hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-borderClient gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-[1.25rem] w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center shrink-0 border border-accent/20">
            {icon}
          </span>
          <h3 className="m-0 font-heading text-base font-semibold text-textMain leading-[1.3] tracking-[0.01em]">{title}</h3>
        </div>
        <div className={`font-body text-[0.9rem] font-bold py-1 px-2.5 rounded-md min-w-[36px] text-center border shrink-0 ${appliedClass}`}>
          {rating?.toFixed(1) || t('na')}
        </div>
      </div>
      <div className="flex flex-col gap-0">
        {children}
      </div>
    </div>
  );
}