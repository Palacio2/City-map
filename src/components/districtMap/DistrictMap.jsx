import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './DistrictMap.module.css';
import CountrySelect from '@cityCountrySelect/CountrySelect';
import CitySelect from '@cityCountrySelect/CitySelect';
import FiltersPanel from '@filtersPanel/FiltersPanel';
import DistrictsMap from './DistrictsMap';
import DistrictDetailsModal from './DistrictDetailsModal';  
import Loader from '@components/loader/Loader';
import { fetchDistrictsWithFilters } from '@api/districtsApi';
import { filterDistrictsByCriteria } from '@filtersPanel/filterLogic';
import { transformDistrictsForDisplay } from '@utils/dataTransformers';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { useSubscription } from '@subscription/SubscriptionContext';
import SeoMeta from '@components/seo/SeoMeta'; // ДОДАНО: Імпорт нашого SEO компонента

const FREE_ALLOWED_CATEGORIES = Object.values(DISTRICT_CATEGORIES)
  .filter(cat => !cat.isPremium)
  .map(cat => cat.key);

const ErrorDisplay = ({ error, onRetry }) => {
  const { t } = useTranslation('districts');
  return (
    <div className={styles.error}>
      <p>{error}</p>
      <button onClick={onRetry} className={styles.retryButton}>
        {t('retry')}
      </button>
    </div>
  );
};

export default function DistrictMap() {
  const { country, city } = useParams();
  const { t } = useTranslation('districts');
  const { isFree } = useSubscription(); 
  
  const [allDistricts, setAllDistricts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});
  
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allowedCategories = useMemo(() => {
    return isFree ? FREE_ALLOWED_CATEGORIES : null;
  }, [isFree]);

  const loadData = useCallback(async () => {
    if (!country || !city) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchDistrictsWithFilters(country, city);
      const transformed = transformDistrictsForDisplay(data);
      setAllDistricts(transformed);
    } catch {
      setError(t('load_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [country, city, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  
  const handleToggleFavorite = useCallback((districtId, isFavorite) => {
    const updateDistrictInList = (list) => 
      list.map(d => d.id === districtId ? { ...d, isFavorite } : d);

    setAllDistricts(prev => updateDistrictInList(prev));
  }, []);

  // ДОДАНО: SEO для сторінок без обраного міста
  if (!country) return (
    <>
      <SeoMeta title="Оберіть країну | City Maps" description="Оберіть країну для перегляду карти районів." />
      <CountrySelect />
    </>
  );
  if (!city) return (
    <>
      <SeoMeta title={`Міста: ${country} | City Maps`} description={`Оберіть місто в ${country} для перегляду статистики районів.`} />
      <CitySelect country={country} />
    </>
  );

  const pageTitle = city 
    ? `Інфраструктура та ціни: ${city} | City Maps` 
    : 'Карта районів | City Maps';
    
  const pageDesc = city 
    ? `Детальна статистика, ціни на нерухомість, якість повітря та інфраструктура для міста ${city}. Порівняйте райони.`
    : 'Оберіть місто для перегляду аналітики та статистики районів.';

  return (
    <div className={styles.container}>
      <SeoMeta title={pageTitle} description={pageDesc} />

      <div className={styles.contentWrapper}>
        <FiltersPanel 
          onFiltersChange={handleFiltersChange}
          selectedFilters={selectedFilters}
          allowedCategories={allowedCategories}
        />
        
        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50dvh' }}>
             <Loader size="large" text={t('loading')} />
          </div>
        ) : error ? (
          <ErrorDisplay error={error} onRetry={loadData} />
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
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}