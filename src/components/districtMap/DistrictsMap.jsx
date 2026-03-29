import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { useSubscription } from '@subscription/SubscriptionContext';

const DistrictCard = React.memo(({ district, onClick, isFree }) => {
  const { t } = useTranslation(['db', 'common']);
  const [imgError, setImgError] = useState(false);
  const filterData = district.filterData;
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick(district);
    }
  };

  const visibleStats = useMemo(() => {
    if (!filterData) return [];
    
    return Object.values(DISTRICT_CATEGORIES)
      .filter(cat => {
        if (isFree && cat.isPremium) return false;
        const rating = filterData[cat.key]?.rating || filterData[cat.key]?.qualityRating;
        return rating !== undefined && rating !== null;
      })
      .map(cat => ({
        key: cat.key,
        icon: cat.icon,
        rating: filterData[cat.key]?.rating || filterData[cat.key]?.qualityRating
      }));
  }, [filterData, isFree]);

  return (
    <div
      className="relative flex flex-col bg-surface border border-borderClient rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ease-out hover:border-accent hover:-translate-y-0.5 hover:shadow-hover focus:outline-none focus:ring-2 focus:ring-accent md:active:scale-95 group"
      onClick={() => onClick(district)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="w-full aspect-[16/10] overflow-hidden bg-body relative shrink-0">
        {district.photo_url && !imgError ? (
            <img 
              src={district.photo_url} 
              alt={district.photo_description || district.name}
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
            className="bg-body py-1 px-1.5 rounded-[4px] text-[0.7rem] text-textSecondary border border-borderClient flex items-center gap-[3px] cursor-pointer transition-all duration-200 hover:bg-accent hover:text-white hover:border-accent hover:-translate-y-0.5"
            onClick={(e) => {
              e.stopPropagation();
              onClick(district, stat.key);
            }}
            title={t(`common:categories.${stat.key}`)}
          >
            {stat.icon} {Number(stat.rating).toFixed(1)}
          </button>
        ))}
      </div>
    </div>
  );
});

export default function DistrictsMap({ 
  districts, 
  onDistrictClick, 
  selectedFilters = {},
  totalCount
}) {
  const { t } = useTranslation('db');
  const { country, city } = useParams();
  const { isFree } = useSubscription();
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const mapContainerRef = useRef(null);

  const paginatedDistricts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return districts.slice(startIndex, startIndex + itemsPerPage);
  }, [districts, currentPage]);

  const totalPages = Math.ceil(districts.length / itemsPerPage);
  const hasActiveFilters = Object.keys(selectedFilters).length > 0;

  const shownCount = districts.length;
  const realTotal = totalCount || shownCount;

  useEffect(() => {
    if (currentPage > 1 && mapContainerRef.current) {
      const yOffset = -80; 
      const y = mapContainerRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [currentPage]);

  return (
    <div className="flex-1 w-full min-w-0 h-auto min-h-[500px] lg:h-[calc(100dvh-var(--header-height)-40px)] lg:sticky lg:top-[calc(var(--header-height)+20px)] bg-surface rounded-xl p-4 md:p-6 shadow-sm lg:shadow-glass border border-borderClient flex flex-col overflow-hidden mb-8 lg:mb-0" ref={mapContainerRef}>
      <div className="text-center mb-4 shrink-0 pb-4 border-b border-borderClient">
        <h1 className="text-textMain mb-1 font-heading text-xl md:text-2xl font-bold tracking-tight">
          {decodeURIComponent(city)}, {decodeURIComponent(country)}
        </h1>
        <div className="flex justify-center flex-wrap gap-2">
          {districts.length > 0 && (
            <span className="bg-hover py-1 px-3 rounded-full text-[0.8rem] md:text-[0.85rem] text-textSecondary border border-borderClient font-medium">
              {t('districts.stats_shown', { shown: shownCount, total: realTotal, defaultValue: `Показано ${shownCount} з ${realTotal}` })}
              
              {isFree && realTotal > shownCount && (
                  <span className="ml-1.5 opacity-70 text-[0.9em]">
                    ({t('districts.premium.hidden_districts_title', { count: realTotal - shownCount, defaultValue: `+${realTotal - shownCount} прихованих` })})
                  </span>
              )}
            </span>
          )}
        </div>
      </div>
      
      {districts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center h-full">
          <div className="text-center text-textSecondary p-8 flex flex-col items-center gap-3">
            <div className="text-[3rem] opacity-50 grayscale">{hasActiveFilters ? '🔍' : '🏙️'}</div>
            <h3 className="m-0 font-heading text-xl font-bold text-textMain">{hasActiveFilters ? t('districts.not_found_title', { defaultValue: 'Нічого не знайдено' }) : t('districts.no_data_title', { defaultValue: 'Немає даних' })}</h3>
            <p className="m-0 text-[0.95rem] max-w-[300px]">{hasActiveFilters ? t('districts.not_found_text', { defaultValue: 'Змініть фільтри для пошуку.' }) : t('districts.no_data_text', { defaultValue: 'Дані відсутні.' })}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 custom-scrollbar">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 md:gap-4 pb-4">
                {paginatedDistricts.map(district => (
                  <DistrictCard
                    key={district.id}
                    district={district}
                    onClick={onDistrictClick}
                    isFree={isFree}
                  />
                ))}
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4 mt-2 border-t border-borderClient bg-surface shrink-0">
                <button 
                  className="w-8 h-8 rounded-full border border-borderClient flex items-center justify-center text-textMain transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:not(:disabled):border-accent hover:not(:disabled):bg-accent hover:not(:disabled):text-white cursor-pointer"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >←</button>
                <span className="font-medium text-[0.95rem]">{currentPage} / {totalPages}</span>
                <button 
                  className="w-8 h-8 rounded-full border border-borderClient flex items-center justify-center text-textMain transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:not(:disabled):border-accent hover:not(:disabled):bg-accent hover:not(:disabled):text-white cursor-pointer"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >→</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}