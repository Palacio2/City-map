import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@subscription/context/SubscriptionContext';
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
  const itemsPerPage = 12; // Ідеально кратно для 2, 3 та 4 колонок
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
    <div
      className="flex-1 w-full min-w-0 h-auto min-h-[500px] lg:h-[calc(100dvh-var(--header-height)-40px)] lg:sticky lg:top-[calc(var(--header-height)+20px)] bg-surface rounded-none sm:rounded-2xl md:rounded-3xl px-0 py-4 sm:p-5 md:p-6 shadow-xs lg:shadow-glass border-y border-x-0 sm:border-x border-borderClient flex flex-col overflow-hidden mb-8 lg:mb-0"
      ref={mapContainerRef}
    >
      {/* Верхня інформаційна панель */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4 shrink-0 pb-2.5 sm:pb-3.5 border-b border-borderClient px-4 sm:px-0">
        <div>
          <h1 className="text-textMain font-heading text-lg sm:text-2xl font-bold tracking-tight m-0">
            {decodeURIComponent(city || '')}, {decodeURIComponent(country || '')}
          </h1>
        </div>
        {districts.length > 0 && (
          <div className="self-start sm:self-auto">
            <span className="inline-flex items-center bg-body py-0.5 sm:py-1 px-2.5 sm:px-3 rounded-full text-[11px] sm:text-xs text-textSecondary border border-borderClient font-medium">
              {t('district.status.stats_shown', { shown: filteredTotal, total: dbTotal, defaultValue: `${filteredTotal} з ${dbTotal}` })}
              {isFree && filteredTotal > shownCount && (
                <span className="ml-1 text-accent font-semibold">
                  (+{filteredTotal - shownCount})
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {districts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center h-full px-4 sm:px-0">
          <div className="text-center text-textSecondary p-6 sm:p-8 flex flex-col items-center gap-3">
            <div className="text-4xl opacity-50 grayscale">{hasActiveFilters ? '🔍' : '🏙️'}</div>
            <h3 className="m-0 font-heading text-base sm:text-lg font-bold text-textMain">
              {hasActiveFilters ? t('district.status.not_found_title') : t('district.status.no_data_title')}
            </h3>
            <p className="m-0 text-xs text-textSecondary max-w-[280px]">
              {hasActiveFilters ? t('district.status.not_found_text') : t('district.status.no_data_text')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-0.5 sm:p-1 custom-scrollbar">
              {/* 2 колонки на мобільних, 2 на планшетах, 3 на десктопі, 4 на широких моніторах */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 pb-4 px-1 sm:px-0">
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

            {/* Пагінація */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 pt-3 mt-1 border-t border-borderClient bg-surface shrink-0 px-4 sm:px-0">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border border-borderClient flex items-center justify-center text-textMain text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:border-accent hover:not-disabled:bg-accent hover:not-disabled:text-white cursor-pointer"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  ←
                </button>
                <span className="font-semibold text-xs text-textSecondary">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border border-borderClient flex items-center justify-center text-textMain text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:border-accent hover:not-disabled:bg-accent hover:not-disabled:text-white cursor-pointer"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};