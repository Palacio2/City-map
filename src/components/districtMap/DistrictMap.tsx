import React, { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CountrySelect from '@cityCountrySelect/CountrySelect';
import CitySelect from '@cityCountrySelect/CitySelect';
import FiltersPanel from '@filtersPanel/FiltersPanel';
import DistrictsMap from './DistrictsMap';
import DistrictDetailsModal from './DistrictDetailsModal';  
import { filterDistrictsByCriteria } from '@filtersPanel/filterLogic';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { useSubscription } from '@subscription/SubscriptionContext';
import { useDistrictsQuery } from '@hooks/useDistrictsQuery';
import { Button } from '@ui/Button';
import { TransformedDistrict } from '@utils/dataTransformers';

interface ErrorDisplayProps {
  error: any;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  const { t } = useTranslation('db');
  return (
    <div className="flex-1 min-h-[300px] md:min-h-[50dvh] bg-surface rounded-xl border border-borderClient flex flex-col items-center justify-center shadow-glass animate-fadeIn p-4 text-center">
      <p className="text-danger font-medium mb-6">{error?.message || String(error)}</p>
      <Button variant="primary" onClick={onRetry} className="w-auto px-8">
        {t('actions.retry')}
      </Button>
    </div>
  );
};

export default function DistrictMap() {
  const { country, city } = useParams();
  const { t } = useTranslation('db');
  const { isFree } = useSubscription(); 
  const { config } = useFiltersConfig();
  
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});
  const [selectedDistrict, setSelectedDistrict] = useState<TransformedDistrict | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: allDistricts = [], isLoading, error, refetch } = useDistrictsQuery(country, city);

  const allowedCategories = useMemo(() => {
    if (!isFree || !config) return null;
    return Object.values(config)
      .filter(cat => !cat.isPremium)
      .map(cat => cat.key);
  }, [isFree, config]);

  const allFilteredDistricts = useMemo(() => {
    return filterDistrictsByCriteria(allDistricts, selectedFilters, config);
  }, [allDistricts, selectedFilters, config]);

  const totalCount = allFilteredDistricts.length;

  const districtsToDisplay = useMemo(() => {
    if (isFree) {
       return allFilteredDistricts.slice(0, 5);
    }
    return allFilteredDistricts;
  }, [allFilteredDistricts, isFree]);

  const listKey = useMemo(() => 
    `dist-list-${country}-${city}-${districtsToDisplay.length}-${JSON.stringify(selectedFilters)}`,
  [country, city, districtsToDisplay.length, selectedFilters]);

  const handleFiltersChange = useCallback((newFilters: Record<string, any>) => {
    setSelectedFilters(newFilters);
  }, []);

  const handleDistrictClick = useCallback((district: TransformedDistrict, categoryKey: string | null = null) => {
    setSelectedDistrict(district);
    setSelectedCategory(categoryKey);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
        setSelectedDistrict(null);
        setSelectedCategory(null);
    }, 300);
  }, []);

  if (!country) return <CountrySelect />;
  if (!city) return <CitySelect country={country} />;

  let mapContent;
  if (isLoading) {
    mapContent = (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] md:min-h-[50dvh] bg-surface rounded-xl border border-borderClient shadow-glass animate-fadeIn">
        <div className="w-12 h-12 rounded-full border-[3px] border-accent/15 border-t-accent animate-spin mb-6"></div>
        <p className="text-textSecondary font-heading tracking-widest text-[0.95rem] m-0 font-medium uppercase">{t('loading')}</p>
      </div>
    );
  } else if (error) {
    mapContent = <ErrorDisplay error={error} onRetry={refetch} />;
  } else {
    mapContent = (
      <DistrictsMap 
        key={listKey}
        districts={districtsToDisplay as TransformedDistrict[]}
        totalCount={totalCount}
        onDistrictClick={handleDistrictClick}
        selectedFilters={selectedFilters}
      />
    );
  }

  return (
    <div className="flex flex-col w-full box-border overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-[1440px] mx-auto px-4 md:px-6 xl:px-8 box-border relative items-start">
        <FiltersPanel 
          onFiltersChange={handleFiltersChange}
          selectedFilters={selectedFilters}
          allowedCategories={allowedCategories}
        />
        
        {mapContent}
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