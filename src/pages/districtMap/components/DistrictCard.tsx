import { useState, useMemo, memo } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { DistrictCardProps } from '../types';

export const DistrictCard = memo(({ district, onClick }: DistrictCardProps) => {
  const { t } = useTranslation('db');
  const [imgError, setImgError] = useState(false);
  const filterData = district.filterData;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(district);
    }
  };

  const visibleStats = useMemo(() => {
    if (!filterData) return [];
    return Object.keys(filterData)
      .filter(k => k !== 'general')
      .map(key => {
        const catData = filterData[key] as { key?: string; icon?: string; rating?: number };
        if (!catData || !('rating' in catData)) return null;
        return {
          key: catData.key as string,
          icon: catData.icon || '📌',
          rating: catData.rating || 0
        };
      })
      .filter((item): item is { key: string; icon: string; rating: number } => Boolean(item));
  }, [filterData]);

  return (
    <div
      className="relative flex flex-col bg-surface border border-borderClient rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ease-out hover:border-accent hover:-translate-y-0.5 hover:shadow-hover focus:outline-none focus:ring-2 focus:ring-accent md:active:scale-95 group"
      onClick={() => onClick(district)}
      tabIndex={0}
      role="button"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full aspect-[16/10] overflow-hidden bg-body relative shrink-0">
        {district.photo_url && !imgError ? (
            <img
              src={district.photo_url}
              alt={district.name}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
              width="300"
              height="200"
              onError={() => setImgError(true)}
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-[2rem] bg-hover">🏙️</div>
        )}
      </div>
      <div className="p-3 pb-2 font-heading text-[0.95rem] md:text-[0.85rem] font-semibold text-textMain text-center whitespace-nowrap overflow-hidden text-ellipsis">
        {district.name}
      </div>
      <div className="px-3 pb-3 flex gap-1 justify-center flex-wrap">
        {visibleStats.map(stat => (
          <button
            key={stat.key}
            type="button"
            className="bg-body py-1 px-1.5 rounded-[4px] text-[0.7rem] text-textSecondary border border-borderClient flex items-center gap-[3px] cursor-pointer transition-all duration-200 hover:bg-accent hover:text-white hover:border-accent hover:-translate-y-0.5"
            onClick={(e) => {
              e.stopPropagation();
              onClick(district, stat.key);
            }}
            title={t(`district.categories.${stat.key}`)}
          >
            {stat.icon} {Number(stat.rating).toFixed(1)}
          </button>
        ))}
      </div>
    </div>
  );
});

DistrictCard.displayName = 'DistrictCard';