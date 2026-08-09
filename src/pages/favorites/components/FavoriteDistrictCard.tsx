import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTrashAlt } from 'react-icons/fa';
import { useFormat } from '@hooks/useFormat';
import { extractBaseVal, extractRating } from '@utils/dataTransformers';
import { STATS_CONFIG } from '@config/districtFields';
import type { FavoriteDistrictCardProps } from '../types';

export const FavoriteDistrictCard = React.memo(({ district, onClick, onCategoryClick, onRemove }: FavoriteDistrictCardProps) => {
  const { t } = useTranslation('db');
  const { getCurrencyInfo, formatPrice } = useFormat();

  const currencyInfo = useMemo(() => {
    const countryName = district.country || (district as unknown as { cities?: { countries?: { name?: string } } })?.cities?.countries?.name || '';
    return getCurrencyInfo(String(countryName));
  }, [district, getCurrencyInfo]);

  const price = extractBaseVal(district, 'average_sale_price_sqm');

  return (
    <div
      className="bg-surface rounded-2xl overflow-hidden border border-borderClient flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-accent relative w-full cursor-pointer group"
      onClick={() => onClick(district)}
    >
      <div className="relative h-[160px] overflow-hidden bg-body transform-gpu">
        {district.photo_url ? (
          <img
            src={district.photo_url}
            alt={district.name || ''}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[2.5rem] bg-hover text-textSecondary">🏙️</div>
        )}
        <button
          type="button"
          className="absolute top-3 right-3 w-8 h-8 rounded-full border-none bg-black/50 backdrop-blur-sm text-white cursor-pointer z-20 transition-all duration-200 flex items-center justify-center hover:bg-danger hover:scale-110"
          onClick={(e) => {
            e.stopPropagation();
            if (district.id !== undefined) onRemove(district.id);
          }}
          title={t('favorites.actions.remove')}
        >
          <FaTrashAlt className="text-sm" />
        </button>
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-black/95 via-black/40 to-transparent p-4 flex items-end z-10 pointer-events-none">
          <h3 className="text-white text-[1.15rem] font-bold drop-shadow-md font-heading m-0">{district.name}</h3>
        </div>
      </div>
      <div className="relative z-20 p-4 flex flex-col gap-4 grow">
        <div className="flex justify-between items-center pb-3 border-b border-dashed border-borderClient">
          <span className="text-xs uppercase tracking-[0.5px] text-textSecondary font-semibold">
            {t('favorites.labels.price')}
          </span>
          <span className="text-[1.2rem] font-extrabold text-accent font-heading">
            {price !== null ? formatPrice(price, currencyInfo) : t('favorites.status.na')}
          </span>
        </div>
        {district.filterData && (
          <div className="grid gap-1.5 grid-cols-3 sm:grid-cols-4">
            {STATS_CONFIG.map(([key, icon]) => {
              const ratingVal = extractRating(district, key);
              const displayRating = ratingVal !== null ? ratingVal.toFixed(1) : t('favorites.status.na');
              return (
                <button
                  key={key}
                  type="button"
                  className="bg-hover rounded-[10px] p-2 flex flex-col items-center justify-center border border-borderClient text-textMain transition-all duration-200 cursor-pointer outline-none font-body hover:-translate-y-[2px] hover:border-accent hover:bg-accent hover:text-white hover:shadow-[0_4px_10px_rgba(197,164,126,0.2)] focus-visible:ring focus-visible:ring-accent focus-visible:outline-none"
                  title={t(`favorites.categories.${key}`)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCategoryClick(district, key);
                  }}
                >
                  <span className="text-base mb-1 drop-shadow-sm">{icon}</span>
                  <span className="font-bold text-[0.85rem]">{displayRating}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

FavoriteDistrictCard.displayName = 'FavoriteDistrictCard';