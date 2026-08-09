import { useTranslation } from 'react-i18next';
import CountrySelect from '@cityCountrySelect/CountrySelect';
import CitySelect from '@cityCountrySelect/CitySelect';
import FiltersPanel from '@filtersPanel/FiltersPanel';
import DistrictDetailsModal from './components/DistrictDetailsModal';
import { Button } from '@ui/Button';
import { useDistrictMap } from './hooks/useDistrictMap';
import { DistrictsMap } from './components/DistrictsMap';
import SeoMeta from '@/seo/SeoMeta';

interface ErrorDisplayProps {
  readonly error: Error | null;
  readonly onRetry: () => void;
}

const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => {
  const { t } = useTranslation('db');
  return (
    <div className="flex-1 min-h-[300px] md:min-h-[50dvh] bg-surface rounded-xl border border-borderClient flex flex-col items-center justify-center shadow-glass animate-fadeIn p-4 text-center">
      <p className="text-danger font-medium mb-6">{error?.message || String(error)}</p>
      <Button variant="primary" onClick={onRetry} className="w-auto px-8">
        {t('district.actions.retry')}
      </Button>
    </div>
  );
};

export default function DistrictMap() {
  const { t } = useTranslation('db');
  const {
    country,
    city,
    isLoading,
    error,
    refetch,
    districtsToDisplay,
    totalCount,
    originalTotal,
    selectedFilters,
    allowedCategories,
    listKey,
    isModalOpen,
    selectedDistrict,
    selectedCategory,
    handleFiltersChange,
    handleDistrictClick,
    handleCloseModal
  } = useDistrictMap();

  if (!country) return <CountrySelect />;
  if (!city) return <CitySelect country={country} />;

  return (
    <div className="flex flex-col w-full box-border overflow-x-hidden">
      <SeoMeta title={t('seo.map.title', 'Інтерактивна карта районів')} description={t('seo.map.desc', 'Аналіз та порівняння районів на карті')} />
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-[1440px] mx-auto px-4 md:px-6 xl:px-8 box-border relative items-start">
        <FiltersPanel
          onFiltersChange={handleFiltersChange}
          selectedFilters={selectedFilters}
          allowedCategories={allowedCategories}
        />
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] md:min-h-[50dvh] bg-surface rounded-xl border border-borderClient shadow-glass animate-fadeIn">
            <div className="w-12 h-12 rounded-full border-[3px] border-accent/15 border-t-accent animate-spin mb-6" />
            <p className="text-textSecondary font-heading tracking-widest text-[0.95rem] m-0 font-medium uppercase">
              {t('district.status.loading')}
            </p>
          </div>
        ) : error ? (
          <ErrorDisplay error={error as Error} onRetry={refetch} />
        ) : (
          <DistrictsMap
            key={listKey}
            districts={districtsToDisplay}
            totalCount={totalCount}
            originalTotal={originalTotal}
            onDistrictClick={handleDistrictClick}
            selectedFilters={selectedFilters}
          />
        )}
      </div>
      <DistrictDetailsModal
        district={selectedDistrict}
        selectedCategory={selectedCategory}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}