import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { VirtualItem } from '@tanstack/react-virtual';
import Loader from '@components/loader/Loader';
import { useFavoritesPage } from './hooks/useFavoritesPage';
import { FavoriteDistrictCard } from './components/FavoriteDistrictCard';

const DistrictDetailsModal = React.lazy(() => import('@pages/districtMap/components/DistrictDetailsModal'));

export default function FavoritesPage() {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  
  const {
    favorites,
    isLoading,
    rows,
    selectedDistrict,
    selectedCategory,
    handleDistrictClick,
    handleCategoryClick,
    handleRemove,
    closeModal,
  } = useFavoritesPage();

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 380,
    overscan: 2,
  });

  if (isLoading) {
    return <Loader fullScreen text={t('common.loading')} />;
  }

  return (
    <div className="min-h-[100dvh] py-10 px-4 sm:px-8 max-w-[1440px] mx-auto w-full animate-fadeIn">
      <header className="mb-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-textMain m-0 tracking-tight">
            {t('favorites.page_title')}
          </h1>
          <p className="text-textSecondary mt-2 m-0 text-base">
            {t('favorites.status.empty_desc')}
          </p>
        </div>
        {favorites.length > 0 && (
          <div className="bg-surface border border-borderClient px-4 py-2 rounded-xl shadow-sm text-sm font-semibold text-textSecondary">
            {favorites.length} {t('stats.labels.selected_count')}
          </div>
        )}
      </header>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface border border-borderClient rounded-3xl shadow-sm">
          <span className="text-6xl mb-6 grayscale opacity-40">🏙️</span>
          <h2 className="font-heading text-2xl font-bold text-textMain mb-3">
            {t('favorites.status.empty_title')}
          </h2>
          <p className="text-textSecondary max-w-md mx-auto mb-8">
            {t('favorites.status.empty_desc')}
          </p>
          <button
            type="button"
            className="bg-textMain text-surface px-8 py-3.5 rounded-xl font-heading font-bold uppercase tracking-widest text-sm hover:bg-accent hover:-translate-y-0.5 transition-all shadow-md"
            onClick={() => navigate('/')}
          >
            {t('favorites.actions.go_to_map')}
          </button>
        </div>
      ) : (
        <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
            const rowItems = rows[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                  {rowItems.map((district) => (
                    <FavoriteDistrictCard
                      key={district.id}
                      district={district}
                      onClick={handleDistrictClick}
                      onCategoryClick={handleCategoryClick}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDistrict && (
        <Suspense fallback={<Loader fullScreen />}>
          <DistrictDetailsModal
            isOpen={!!selectedDistrict}
            onClose={closeModal}
            district={selectedDistrict}
            selectedCategory={selectedCategory}
          />
        </Suspense>
      )}
    </div>
  );
}