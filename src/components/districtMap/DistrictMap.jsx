import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styles from './DistrictMap.module.css';
import CountrySelect from '../cityCountrySelect/CountrySelect';
import CitySelect from '../cityCountrySelect/CitySelect';
import FiltersPanel from '../filtersPanel/FiltersPanel';
import DistrictsMap from './DistrictsMap';
import { fetchDistrictsWithFilters } from '../api/districtsApi';
import { filterDistrictsByCriteria } from '../../utils/filterUtils';
import { transformDistrictsForDisplay } from '../../utils/dataTransformers';

const LoadingIndicator = () => (
  <div className={styles.loading}>
    <div className={styles.spinner}></div>
    <p>Завантаження районів...</p>
  </div>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <div className={styles.error}>
    <p>Помилка завантаження районів: {error}</p>
    <button onClick={onRetry} className={styles.retryButton}>
      Спробувати знову
    </button>
  </div>
);

export default function DistrictMap() {
  const { country, city } = useParams();
  const [allDistricts, setAllDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});

  const fetchDistricts = useCallback(async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    const decodedCountry = decodeURIComponent(country);
    const decodedCity = decodeURIComponent(city);
    
    const districtsData = await fetchDistrictsWithFilters(decodedCountry, decodedCity);
    
    // Трансформуємо всі дані один раз
    const transformedDistricts = transformDistrictsForDisplay(districtsData);
    
    setAllDistricts(transformedDistricts);
    setFilteredDistricts(transformedDistricts);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
}, [country, city]);

  useEffect(() => {
    if (country && city) {
      fetchDistricts();
    }
  }, [country, city, fetchDistricts]);

  const handleDistrictClick = useCallback((district) => {
    console.log('Обраний район:', district.name);
  }, []);

  const handleFiltersChange = useCallback((filters) => {
    setSelectedFilters(filters);
    const filtered = filterDistrictsByCriteria(allDistricts, filters);
    setFilteredDistricts(filtered);
  }, [allDistricts]);

  const handleRetry = useCallback(() => {
    fetchDistricts();
  }, [fetchDistricts]);

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
          <ErrorDisplay error={error} onRetry={handleRetry} />
        ) : (
          <DistrictsMap 
            districts={filteredDistricts}
            onDistrictClick={handleDistrictClick}
            selectedFilters={selectedFilters}
          />
        )}
      </div>
    </div>
  );
}
