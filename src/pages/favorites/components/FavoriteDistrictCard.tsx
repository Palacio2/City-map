import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTrashAlt } from 'react-icons/fa';
import { useFormat } from '@hooks/useFormat';
import { extractBaseVal } from '@utils/dataTransformers';
import type { FavoriteDistrictCardProps } from '../types';

export const FavoriteDistrictCard = React.memo(({ district, onClick, onCategoryClick, onRemove }: FavoriteDistrictCardProps) => {
  const { t } = useTranslation('db');
  const { getCurrencyInfo, formatPrice } = useFormat();

  const currencyInfo = useMemo(() => {
    const countryName = district.country || (district as unknown as { cities?: { countries?: { name?: string } } })?.cities?.countries?.name || '';
    return getCurrencyInfo(String(countryName));
  }, [district, getCurrencyInfo]);

  const price = extractBaseVal(district, 'average_sale_price_sqm');

  const visibleStats = useMemo(() => {
    if (!district.filterData) return [];
    return Object.keys(district.filterData)
      .filter(k => k !== 'general')
      .map(key => {
        const catData = district.filterData![key] as { key?: string; icon?: string; rating?: number };
        if (!catData || !('rating' in catData)) return null;
        return {
          key: catData.key as string,
          icon: catData.icon || '',
          rating: Number(catData.rating) || 0
        };
      })
      .filter((item): item is { key: string; icon: string; rating: number } => Boolean(item));
  }, [district.filterData]);

  const avgScore = useMemo(() => {
    if (!visibleStats.length) return null;
    const sum = visibleStats.reduce((acc, s) => acc + s.rating, 0);
    return (sum / visibleStats.length).toFixed(1);
  }, [visibleStats]);

  const getScoreClasses = (score: number) => {
    if (score >= 8.0) return 'text-teal-700 bg-teal-50 border-teal-200 dark:text-cyan-400 dark:bg-cyan-950/40 dark:border-cyan-500/30';
    if (score >= 5.5) return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-500/30';
    return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/40 dark:border-rose-500/30';
  };

  const getTranslatedLabel = (key: string) => {
    return t([
      `district.categories.${key}`,
      `common.categories.${key}`,
      `groups.${key}`,
      `common.fields.${key}`,
      key
    ], { defaultValue: key });
  };

  return (
    <article
      className="group relative flex flex-col justify-between bg-surface border border-borderClient dark:border-white/10 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-hover hover:border-primary dark:hover:border-primary transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-primary h-full"
      onClick={() => onClick(district)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(district);
        }
      }}
    >
      {/* Media Block */}
      <div className="relative aspect-[16/10] w-full bg-surface overflow-hidden shrink-0">
        {district.photo_url ? (
          <img
            src={district.photo_url}
            alt={district.name}
            className="block w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 origin-center"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl bg-hover text-textSecondary select-none">🏙️</div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20 pointer-events-none" />

        {/* Trash Icon */}
        <button
          type="button"
          className="absolute top-2 left-2 w-8 h-8 rounded-full border-none bg-black/50 backdrop-blur-xs text-white cursor-pointer z-20 transition-all duration-200 flex items-center justify-center hover:bg-danger hover:scale-110"
          onClick={(e) => {
            e.stopPropagation();
            if (district.id !== undefined) onRemove(district.id);
          }}
          title={t('favorites.actions.remove')}
        >
          <FaTrashAlt className="text-[13px]" />
        </button>

        {/* Rating Badge */}
        {avgScore && (
          <div className="absolute top-2 right-2 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg backdrop-blur-md bg-black/60 border border-white/20 text-white font-bold text-[10px] sm:text-xs flex items-center gap-1 shadow-md z-10">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400" />
            <span className="tracking-tight">{avgScore}</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
          <h3 className="text-white text-[1.15rem] font-bold drop-shadow-md font-heading m-0 truncate">
            {district.name}
          </h3>
        </div>
      </div>

      <div className="p-3 sm:p-4 bg-surface flex flex-col flex-1 gap-3">
        {/* Price display */}
        <div className="flex justify-between items-center pb-2 border-b border-borderClient/50">
          <span className="text-[10px] uppercase tracking-wider text-textMuted font-bold">
            {t('favorites.labels.price')}
          </span>
          <span className="text-[1.05rem] font-extrabold text-accent font-heading">
            {price !== null ? formatPrice(price, currencyInfo) : t('favorites.status.na')}
          </span>
        </div>

        {/* Categories Grid or Top stats */}
        <div className="grid gap-2 grid-cols-2 mt-auto">
          {(() => {
            const topStats = [...visibleStats].sort((a, b) => b.rating - a.rating).slice(0, 4);
            if (topStats.length === 0) {
              return (
                <div className="col-span-2 text-xs text-textSecondary text-center italic py-2">
                  {t('district.status.no_data', { defaultValue: '—' })}
                </div>
              );
            }
            return topStats.map((stat) => (
              <button
                key={stat.key}
                type="button"
                className="flex items-center justify-between text-[11px] sm:text-xs bg-hover dark:bg-white/5 px-2 py-1.5 rounded-lg group/item border border-transparent hover:border-accent/30 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryClick(district, stat.key);
                }}
                title={getTranslatedLabel(stat.key)}
              >
                <span className="text-textSecondary flex items-center gap-1.5 truncate group-hover/item:text-textMain transition-colors">
                  <span className="text-accent text-[10px]">{stat.icon || '📌'}</span>
                  <span className="truncate max-w-[50px] sm:max-w-[60px]">{getTranslatedLabel(stat.key)}</span>
                </span>
                <span className={`font-bold shrink-0 ml-1.5 ${getScoreClasses(stat.rating).split(' ')[0]}`}>
                  {stat.rating.toFixed(1)}
                </span>
              </button>
            ));
          })()}
        </div>
      </div>
    </article>
  );
});

FavoriteDistrictCard.displayName = 'FavoriteDistrictCard';