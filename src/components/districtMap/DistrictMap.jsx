import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './DistrictMap.module.css';
import CountrySelect from '@cityCountrySelect/CountrySelect';
import CitySelect from '@cityCountrySelect/CitySelect';
import FiltersPanel from '@filtersPanel/FiltersPanel';
import { fetchDistrictsWithFilters } from '@api/districtsApi';
import { filterDistrictsByCriteria } from '@utils/filterUtils';
import { transformDistrictsForDisplay } from '@utils/dataTransformers';
import DistrictDetailsModal from './DistrictDetailsModal';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { useSubscription } from '@subscription/SubscriptionContext';

const DistrictsMap = React.lazy(() => import('./DistrictsMap'));

const FREE_ALLOWED_CATEGORIES = Object.values(DISTRICT_CATEGORIES)
  .filter(cat => !cat.isPremium)
  .map(cat => cat.key);

const LoadingIndicator = () => {
  const { t } = useTranslation('districts');
  return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <p>{t('loading')}</p>
    </div>
  );
};

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
    } catch (err) {
      setError(t('errors.fetch_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [country, city, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // КРОК 1: Спочатку отримуємо ПОВНИЙ список відфільтрованих районів
  const allFilteredDistricts = useMemo(() => {
    return filterDistrictsByCriteria(allDistricts, selectedFilters);
  }, [allDistricts, selectedFilters]);

  // Рахуємо справжню кількість
  const totalCount = allFilteredDistricts.length;

  // КРОК 2: Готуємо список для ВІДОБРАЖЕННЯ (ріжемо тільки тут)
  const districtsToDisplay = useMemo(() => {
    if (isFree) {
       return allFilteredDistricts.slice(0, 5);
    }
    return allFilteredDistricts;
  }, [allFilteredDistricts, isFree]);

  const handleFiltersChange = useCallback((newFilters) => {
    setSelectedFilters(newFilters);
  }, []);

  const handleDistrictClick = useCallback((district) => {
    setSelectedDistrict(district);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDistrict(null);
  }, []);
  
  const handleToggleFavorite = useCallback((districtId, isFavorite) => {
    const updateDistrictInList = (list) => 
      list.map(d => d.id === districtId ? { ...d, isFavorite } : d);

    setAllDistricts(prev => updateDistrictInList(prev));
  }, []);

  if (!country) return <CountrySelect />;
  if (!city) return <CitySelect country={country} />;

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <FiltersPanel 
          onFiltersChange={handleFiltersChange}
          selectedFilters={selectedFilters}
          allowedCategories={allowedCategories}
        />
        
        {isLoading ? (
          <LoadingIndicator />
        ) : error ? (
          <ErrorDisplay error={error} onRetry={loadData} />
        ) : (
          <Suspense fallback={<LoadingIndicator />}>
            <DistrictsMap 
                // 👇 Передаємо обрізаний список для рендеру
                districts={districtsToDisplay}
                // 👇 Передаємо ПОВНУ кількість для статистики
                totalCount={totalCount}
                
                onDistrictClick={handleDistrictClick}
                selectedFilters={selectedFilters}
            />
          </Suspense>
        )}
      </div>
      
      <DistrictDetailsModal
        district={selectedDistrict}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
}