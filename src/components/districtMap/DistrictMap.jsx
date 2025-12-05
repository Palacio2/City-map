import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styles from './DistrictMap.module.css';
import CountrySelect from '../cityCountrySelect/CountrySelect';
import CitySelect from '../cityCountrySelect/CitySelect';
import FiltersPanel from '../filtersPanel/FiltersPanel';
import DistrictsMap from './DistrictsMap';
import { fetchDistrictsWithFilters } from '../api/districtsApi';

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
      
      console.log('Завантаження районів для:', decodedCountry, decodedCity);
      
      const districtsData = await fetchDistrictsWithFilters(decodedCountry, decodedCity);
      
      setAllDistricts(districtsData);
      setFilteredDistricts(districtsData);
    } catch (err) {
      console.error('Помилка завантаження районів:', err);
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

  // Функція для фільтрації районів
  const filterDistrictsByCriteria = useCallback((districtsList, filters) => {
    if (!filters || Object.keys(filters).length === 0) {
      return districtsList;
    }

    return districtsList.filter(district => {
      if (!district.filterData) return false;

      const { 
        education = {}, 
        transport = {}, 
        safety = {}, 
        social = {}, 
        medicine = {}, 
        commerce = {} 
      } = district.filterData;

      // Освіта
      if (filters.education) {
        const eduFilters = filters.education;
        if (eduFilters.kindergartens && (!education.kindergartens || education.kindergartens === 0)) return false;
        if (eduFilters.schools && (!education.schools || education.schools === 0)) return false;
        if (eduFilters.universities && (!education.universities || education.universities === 0)) return false;
        if (eduFilters.minRating && education.rating < eduFilters.minRating) return false;
      }

      // Медицина
      if (filters.medicine) {
        const medFilters = filters.medicine;
        if (medFilters.hospitals && (!medicine.hospitals || medicine.hospitals === 0)) return false;
        if (medFilters.clinics && (!medicine.clinics || medicine.clinics === 0)) return false;
        if (medFilters.minRating && medicine.rating < medFilters.minRating) return false;
      }

      // Транспорт
      if (filters.transport) {
        const transFilters = filters.transport;
        if (transFilters.bus_stops && (!transport.busStops || transport.busStops === 0)) return false;
        if (transFilters.metro && (!transport.metroStations || transport.metroStations === 0)) return false;
        if (transFilters.minRating && transport.rating < transFilters.minRating) return false;
      }

      // Безпека
      if (filters.safety) {
        const safetyFilters = filters.safety;
        if (safetyFilters.police && (!safety.policeStations || safety.policeStations === 0)) return false;
        if (safetyFilters.minRating && safety.rating < safetyFilters.minRating) return false;
        
        if (safetyFilters.crimeLevel && safetyFilters.crimeLevel !== 'any') {
          const crimeLevel = safety.crimeLevel || 5;
          if (safetyFilters.crimeLevel === 'low' && crimeLevel > 3) return false;
          if (safetyFilters.crimeLevel === 'medium' && (crimeLevel <= 3 || crimeLevel > 6)) return false;
          if (safetyFilters.crimeLevel === 'high' && crimeLevel <= 6) return false;
        }
      }

      // Соціальна інфраструктура
      if (filters.social) {
        const socialFilters = filters.social;
        if (socialFilters.parks && (!social.parks || social.parks === 0)) return false;
        if (socialFilters.cafes && (!social.cafesRestaurants || social.cafesRestaurants === 0)) return false;
        if (socialFilters.minRating && social.rating < socialFilters.minRating) return false;
      }

      // Комерція
      if (filters.commerce) {
        const commerceFilters = filters.commerce;
        if (commerceFilters.groceries && (!commerce.groceryStores || commerce.groceryStores === 0)) return false;
        if (commerceFilters.banks && (!commerce.banksATMs || commerce.banksATMs === 0)) return false;
        if (commerceFilters.minRating && commerce.rating < commerceFilters.minRating) return false;
      }

      return true;
    });
  }, []);

  const handleFiltersChange = useCallback((filters) => {
    setSelectedFilters(filters);
    const filtered = filterDistrictsByCriteria(allDistricts, filters);
    setFilteredDistricts(filtered);
  }, [allDistricts, filterDistrictsByCriteria]);

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
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Завантаження районів...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>Помилка завантаження районів: {error}</p>
            <button 
              onClick={handleRetry}
              className={styles.retryButton}
            >
              Спробувати знову
            </button>
          </div>
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