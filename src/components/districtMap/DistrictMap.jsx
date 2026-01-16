import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './DistrictMap.module.css';
import CountrySelect from '../cityCountrySelect/CountrySelect';
import CitySelect from '../cityCountrySelect/CitySelect';
import FiltersPanel from '../filtersPanel/FiltersPanel';
import { fetchDistrictsWithFilters } from '../api/districtsApi';
import { filterDistrictsByCriteria } from '../../utils/filterUtils';
import { transformDistrictsForDisplay } from '../../utils/dataTransformers';
import { trackActivity, trackDistrictVisit } from '../../components/api/statsApi';

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
  const { t } = useTranslation('districts');
  const { country, city } = useParams();
  const [searchParams] = useSearchParams();
  
  const [allDistricts, setAllDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});

  const trackedSearchRef = useRef(null);
  
  const districtToOpen = searchParams.get('district');

  const loadData = useCallback(async () => {
    if (!country || !city) return;

    const currentSearchKey = `${country}-${city}`;
    
    if (trackedSearchRef.current !== currentSearchKey) {
      trackActivity('search');
      trackedSearchRef.current = currentSearchKey;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const decodedCountry = decodeURIComponent(country);
      const decodedCity = decodeURIComponent(city);
      
      const rawData = await fetchDistrictsWithFilters(decodedCountry, decodedCity);
      const transformedData = transformDistrictsForDisplay(rawData);
      
      setAllDistricts(transformedData);
      setFilteredDistricts(transformedData);
    } catch (err) {
      console.error(err);
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
    if (district?.id) {
      trackDistrictVisit(district.id);
    }
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
                initialSelectedDistrict={districtToOpen}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}