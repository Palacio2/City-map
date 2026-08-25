// @ts-nocheck
import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@subscription/contex/SubscriptionContext';
import { DistrictCard } from './DistrictCard';
import type { DistrictsMapProps } from '../types';

export const DistrictsMap = ({
  districts,
  onDistrictClick,
  selectedFilters = {},
  totalCount,
  originalTotal
}: DistrictsMapProps) => {
  const { t } = useTranslation('db');
  const { country, city } = useParams<{ country: string; city: string }>();
  const { isFree } = useSubscription();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const paginatedDistricts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return districts.slice(startIndex, startIndex + itemsPerPage);
  }, [districts, currentPage]);

  const totalPages = Math.ceil(districts.length / itemsPerPage);
  const hasActiveFilters = Object.keys(selectedFilters).length > 0;
  const shownCount = districts.length;
  const filteredTotal = totalCount || shownCount;
  const dbTotal = originalTotal || filteredTotal;

  useEffect(() => {
    if (currentPage > 1 && mapContainerRef.current) {
      const yOffset = -80;
      const y = mapContainerRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [currentPage]);

  return (
    <div className="flex-1 w-full min-w-0 h-auto min-h-[500px] lg:h-[calc(100dvh-var(--header-height)-40px)] lg:sticky lg:top-[calc(var(--header-height)+20px)] bg-surface rounded-xl p-4 md:p-6 shadow-sm lg:shadow-glass border border-borderClient flex flex-col overflow-hidden mb-8 lg:mb-0" ref={mapContainerRef}>
      <div className="text-center mb-4 shrink-0 pb-4 border-b border-borderClient">
        <h1 className="text-textMain mb-1 font-heading text-xl md:text-2xl font-bold tracking-tight">
          {decodeURIComponent(city || '')}, {decodeURIComponent(country || '')}
        </h1>
        <div className="flex justify-center flex-wrap gap-2">
          {districts.length > 0 && (
            <span className="bg-hover py-1 px-3 rounded-full text-[0.8rem] md:text-[0.85rem] text-textSecondary border border-borderClient font-medium">
              {t('district.status.stats_shown', { shown: filteredTotal, total: dbTotal })}
              {isFree && filteredTotal > shownCount && (
                  <span className="ml-1.5 opacity-70 text-[0.9em]">
                    ({t('district.premium.hidden_title', { count: filteredTotal - shownCount })})
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
            <h3 className="m-0 font-heading text-xl font-bold text-textMain">{hasActiveFilters ? t('district.status.not_found_title') : t('district.status.no_data_title')}</h3>
            <p className="m-0 text-[0.95rem] max-w-[300px]">{hasActiveFilters ? t('district.status.not_found_text') : t('district.status.no_data_text')}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 custom-scrollbar">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 md:gap-4 pb-4">
                {paginatedDistricts.map((district, index) => (
                  <DistrictCard
                    key={district.id}
                    district={district}
                    onClick={onDistrictClick}
                    isPriority={index < 4}
                  />
                ))}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-4 mt-2 border-t border-borderClient bg-surface shrink-0">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border border-borderClient flex items-center justify-center text-textMain transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:not(:disabled):border-accent hover:not(:disabled):bg-accent hover:not(:disabled):text-white cursor-pointer"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >←</button>
                <span className="font-medium text-[0.95rem]">{currentPage} / {totalPages}</span>
                <button
                  type="button"
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
};
