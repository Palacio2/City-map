import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styles from './DistrictMap.module.css';
import CountrySelect from '../cityCountrySelect/CountrySelect';
import CitySelect from '../cityCountrySelect/CitySelect';
import FiltersPanel from '../filtersPanel/FiltersPanel';
import DistrictsMap from './DistrictsMap';
import { fetchDistrictsWithFilters } from '../api/districtsApi';

export default function DistrictMap() {
  const { country, city } = useParams();
  const [districts, setDistricts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({});

  const fetchDistricts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const decodedCountry = decodeURIComponent(country);
      const decodedCity = decodeURIComponent(city);
      
      console.log('Fetching districts with filters for:', decodedCountry, decodedCity);
      
      const districtsData = await fetchDistrictsWithFilters(decodedCountry, decodedCity);
      console.log('Received districts data:', districtsData);
      setDistricts(districtsData);
    } catch (err) {
      console.error('Error fetching districts:', err);
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
    
    if (district.filterData) {
      console.log('Дані фільтрів для району:', district.filterData);
      console.log('Рейтинг освіти:', district.filterData.education?.rating);
      console.log('Рейтинг транспорту:', district.filterData.transport?.rating);
      console.log('Рейтинг безпеки:', district.filterData.safety?.rating);
      console.log('Кількість шкіл:', district.filterData.education?.schools);
      console.log('Кількість парків:', district.filterData.social?.parks);
    }
    
    // Тут можна додати логіку для фільтрів або відображення додаткової інформації
  }, []);

  const handleFiltersChange = useCallback((filters) => {
    console.log('Фільтри змінено:', filters);
    setSelectedFilters(filters);
    
    // Тут можна додати логіку фільтрації районів на основі обраних фільтрів
    if (districts.length > 0) {
      const filteredDistricts = filterDistrictsByCriteria(districts, filters);
      console.log('Відфільтровані райони:', filteredDistricts.length);
      // Якщо потрібно відразу застосовувати фільтри, розкоментуйте:
      // setDistricts(filteredDistricts);
    }
  }, [districts]);

  // Функція для фільтрації районів за критеріями
  const filterDistrictsByCriteria = (districtsList, filters) => {
    return districtsList.filter(district => {
      if (!district.filterData) return false;

      const { education, transport, safety, social, medicine, commerce, utilities } = district.filterData;

      // Фільтрація за освітою
      if (filters.education) {
        if (filters.minSchools && education.schools < filters.minSchools) return false;
        if (filters.minKindergartens && education.kindergartens < filters.minKindergartens) return false;
        if (filters.minEducationRating && education.rating < filters.minEducationRating) return false;
      }

      // Фільтрація за транспортом
      if (filters.transport) {
        if (filters.minBusStops && transport.busStops < filters.minBusStops) return false;
        if (filters.minTransportRating && transport.rating < filters.minTransportRating) return false;
      }

      // Фільтрація за безпекою
      if (filters.safety) {
        if (filters.maxCrimeLevel && safety.crimeLevel > filters.maxCrimeLevel) return false;
        if (filters.minSafetyRating && safety.rating < filters.minSafetyRating) return false;
      }

      // Фільтрація за соціальною інфраструктурою
      if (filters.social) {
        if (filters.minParks && social.parks < filters.minParks) return false;
        if (filters.minPlaygrounds && social.playgrounds < filters.minPlaygrounds) return false;
        if (filters.minSocialRating && social.rating < filters.minSocialRating) return false;
      }

      // Додайте інші критерії фільтрації за потребою

      return true;
    });
  };

  const handleRetry = useCallback(() => {
    fetchDistricts();
  }, [fetchDistricts]);

  if (!country) return <CountrySelect />;
  if (!city) return <CitySelect country={country} />;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Карта районів {city && `${decodeURIComponent(city)}`}
        {country && `, ${decodeURIComponent(country)}`}
      </h1>
      
      <div className={styles.contentWrapper}>
        <FiltersPanel 
          onFiltersChange={handleFiltersChange}
          selectedFilters={selectedFilters}
        />
        
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Завантаження мапи районів...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>Помилка завантаження мапи: {error}</p>
            <button 
              onClick={handleRetry}
              className={styles.retryButton}
            >
              Спробувати знову
            </button>
          </div>
        ) : (
          <DistrictsMap 
            districts={districts}
            onDistrictClick={handleDistrictClick}
            selectedFilters={selectedFilters}
          />
        )}
      </div>
    </div>
  );
}