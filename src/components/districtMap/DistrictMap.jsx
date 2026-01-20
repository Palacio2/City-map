import React, { useState, useEffect, useCallback, Suspense } from 'react';
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

const DistrictsMap = React.lazy(() => import('./DistrictsMap'));

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
      <p>{t('error_prefix', { error })}</p>
      <button onClick={onRetry} className={styles.retryButton}>{t('retry')}</button>
    </div>
  );
};

export default function DistrictMap() {
  const { country, city } = useParams();
  const { t } = useTranslation('districts');
  
  const [allDistricts, setAllDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!country || !city) return;

    try {
      setIsLoading(true);
      setError(null);
      const rawData = await fetchDistrictsWithFilters(country, city);
      const transformedData = transformDistrictsForDisplay(rawData);
      setAllDistricts(transformedData);
      setFilteredDistricts(transformedData);
    } catch (err) {
      setError(err.message || t('load_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [country, city, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFiltersChange = useCallback((filters) => {
    setSelectedFilters(filters);
    const filtered = filterDistrictsByCriteria(allDistricts, filters);
    setFilteredDistricts(filtered);
  }, [allDistricts]);

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
    setFilteredDistricts(prev => updateDistrictInList(prev));
  }, []);

  if (!country) return <CountrySelect />;
  if (!city) return <CitySelect country={country} />;

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <FiltersPanel 
          onFiltersChange={handleFiltersChange}
          selectedFilters={selectedFilters}
        />
        
        {isLoading ? (
          <LoadingIndicator />
        ) : error ? (
          <ErrorDisplay error={error} onRetry={loadData} />
        ) : (
          <Suspense fallback={<LoadingIndicator />}>
            <DistrictsMap 
                districts={filteredDistricts}
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