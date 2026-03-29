import React, { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CountrySelect from '@cityCountrySelect/CountrySelect';
import CitySelect from '@cityCountrySelect/CitySelect';
import FiltersPanel from '@filtersPanel/FiltersPanel';
import DistrictsMap from './DistrictsMap';
import DistrictDetailsModal from './DistrictDetailsModal';  
import { filterDistrictsByCriteria } from '@filtersPanel/filterLogic';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { useSubscription } from '@subscription/SubscriptionContext';
import { useDistrictsQuery } from '@hooks/useDistrictsQuery';

const FREE_ALLOWED_CATEGORIES = Object.values(DISTRICT_CATEGORIES)
  .filter(cat => !cat.isPremium)
  .map(cat => cat.key);

const ErrorDisplay = ({ error, onRetry }) => {
  const { t } = useTranslation('db');
  return (
    <div className="flex-1 min-h-[300px] md:min-h-[50dvh] bg-surface rounded-xl border border-borderClient flex flex-col items-center justify-center shadow-glass animate-fadeIn p-4 text-center">
      <p className="text-danger font-medium mb-6">{error.message || error}</p>
      <button onClick={onRetry} className="py-3 px-8 bg-textMain text-surface border-none rounded-lg font-heading text-[0.85rem] font-bold uppercase tracking-widest cursor-pointer transition-all shadow-sm hover:bg-accent hover:text-white hover:-translate-y-0.5 hover:shadow-hover active:translate-y-0">
        {t('common.actions.retry', { defaultValue: 'Спробувати ще раз' })}
      </button>
    </div>
  );
};

export default function DistrictMap() {
  const { country, city } = useParams();
  const { t } = useTranslation('db');
  const { isFree } = useSubscription(); 
  
  const [selectedFilters, setSelectedFilters] = useState({});
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: allDistricts = [], isLoading, error, refetch } = useDistrictsQuery(country, city);

  const allowedCategories = useMemo(() => {
    return isFree ? FREE_ALLOWED_CATEGORIES : null;
  }, [isFree]);

  const allFilteredDistricts = useMemo(() => {
    return filterDistrictsByCriteria(allDistricts, selectedFilters);
  }, [allDistricts, selectedFilters]);

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

  const handleFiltersChange = useCallback((newFilters) => {
    setSelectedFilters(newFilters);
  }, []);

  const handleDistrictClick = useCallback((district, categoryKey = null) => {
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

  return (
    <div className="flex flex-col w-full box-border overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-[1440px] mx-auto px-4 md:px-6 xl:px-8 box-border relative items-start">
        <FiltersPanel 
          onFiltersChange={handleFiltersChange}
          selectedFilters={selectedFilters}
          allowedCategories={allowedCategories}
        />
        
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] md:min-h-[50dvh] bg-surface rounded-xl border border-borderClient shadow-glass animate-fadeIn">
            <div className="w-12 h-12 rounded-full border-[3px] border-accent/15 border-t-accent animate-spin mb-6"></div>
            <p className="text-textSecondary font-heading tracking-widest text-[0.95rem] m-0 font-medium uppercase">{t('common.loading', { defaultValue: 'Завантаження...' })}</p>
          </div>
        ) : error ? (
          <ErrorDisplay error={error} onRetry={refetch} />
        ) : (
            <DistrictsMap 
                key={listKey}
                districts={districtsToDisplay}
                totalCount={totalCount}
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