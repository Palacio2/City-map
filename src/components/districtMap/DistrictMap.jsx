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
      
      console.log('Fetching districts with filters for:', decodedCountry, decodedCity);
      
      const districtsData = await fetchDistrictsWithFilters(decodedCountry, decodedCity);
      console.log('Received districts data:', districtsData);
      setAllDistricts(districtsData);
      setFilteredDistricts(districtsData);
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
    }
  }, []);

  // Функція для фільтрації районів за критеріями
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
        commerce = {}, 
        utilities = {} 
      } = district.filterData;

      // Фільтрація за освітою
      if (filters.education) {
        const eduFilters = filters.education;
        
        // Чекбокси
        if (eduFilters.kindergartens && (!education.kindergartens || education.kindergartens === 0)) return false;
        if (eduFilters.schools && (!education.schools || education.schools === 0)) return false;
        if (eduFilters.universities && (!education.universities || education.universities === 0)) return false;
        
        // Числові фільтри
        if (eduFilters.minSchools && education.schools < eduFilters.minSchools) return false;
        if (eduFilters.minKindergartens && education.kindergartens < eduFilters.minKindergartens) return false;
        if (eduFilters.minRating && education.rating < eduFilters.minRating) return false;
      }

      // Фільтрація за медициною
      if (filters.medicine) {
        const medFilters = filters.medicine;
        
        // Чекбокси
        if (medFilters.hospitals && (!medicine.hospitals || medicine.hospitals === 0)) return false;
        if (medFilters.clinics && (!medicine.clinics || medicine.clinics === 0)) return false;
        if (medFilters.pharmacies && (!medicine.pharmacies || medicine.pharmacies === 0)) return false;
        if (medFilters.emergency && (!medicine.emergency || medicine.emergency === 0)) return false;
        
        // Числові фільтри
        if (medFilters.minHospitals && medicine.hospitals < medFilters.minHospitals) return false;
        if (medFilters.minClinics && medicine.clinics < medFilters.minClinics) return false;
        if (medFilters.minRating && medicine.rating < medFilters.minRating) return false;
      }

      // Фільтрація за транспортом (тільки для Premium)
      if (filters.transport) {
        const transFilters = filters.transport;
        
        // Чекбокси
        if (transFilters.bus_stops && (!transport.busStops || transport.busStops === 0)) return false;
        if (transFilters.tram_stops && (!transport.tramStops || transport.tramStops === 0)) return false;
        if (transFilters.metro && (!transport.metroStations || transport.metroStations === 0)) return false;
        if (transFilters.bike_lanes && (!transport.bikeLanesKm || transport.bikeLanesKm === 0)) return false;
        if (transFilters.parking && (!transport.parking || transport.parking === 0)) return false;
        
        // Числові фільтри
        if (transFilters.maxDistance && transport.avgDistance > transFilters.maxDistance) return false;
        if (transFilters.minRating && transport.rating < transFilters.minRating) return false;
        
        // Селект
        if (transFilters.frequency && transFilters.frequency !== 'any') {
          const districtFrequency = transport.frequency || 'medium';
          if (transFilters.frequency === 'high' && districtFrequency !== 'high') return false;
          if (transFilters.frequency === 'medium' && districtFrequency === 'low') return false;
        }
      }

      // Фільтрація за безпекою (тільки для Premium)
      if (filters.safety) {
        const safetyFilters = filters.safety;
        
        // Чекбокси
        if (safetyFilters.police && (!safety.policeStations || safety.policeStations === 0)) return false;
        if (safetyFilters.cctv && (!safety.cctv || safety.cctv === 0)) return false;
        if (safetyFilters.lighting && (!safety.lighting || safety.lighting === 0)) return false;
        
        // Селект рівня злочинності
        if (safetyFilters.crimeLevel && safetyFilters.crimeLevel !== 'any') {
          const crimeLevel = safety.crimeLevel || 5;
          if (safetyFilters.crimeLevel === 'low' && crimeLevel > 3) return false;
          if (safetyFilters.crimeLevel === 'medium' && (crimeLevel <= 3 || crimeLevel > 6)) return false;
          if (safetyFilters.crimeLevel === 'high' && crimeLevel <= 6) return false;
        }
        
        if (safetyFilters.minRating && safety.rating < safetyFilters.minRating) return false;
      }

      // Фільтрація за соціальною інфраструктурою (тільки для Premium)
      if (filters.social) {
        const socialFilters = filters.social;
        
        // Чекбокси
        if (socialFilters.parks && (!social.parks || social.parks === 0)) return false;
        if (socialFilters.cafes && (!social.cafesRestaurants || social.cafesRestaurants === 0)) return false;
        if (socialFilters.playgrounds && (!social.playgrounds || social.playgrounds === 0)) return false;
        if (socialFilters.sports && (!social.sports || social.sports === 0)) return false;
        if (socialFilters.libraries && (!social.libraries || social.libraries === 0)) return false;
        
        // Числові фільтри
        if (socialFilters.minParks && social.parks < socialFilters.minParks) return false;
        if (socialFilters.minPlaygrounds && social.playgrounds < socialFilters.minPlaygrounds) return false;
        if (socialFilters.minRating && social.rating < socialFilters.minRating) return false;
      }

      // Фільтрація за комерцією (тільки для Premium)
      if (filters.commerce) {
        const commerceFilters = filters.commerce;
        
        // Чекбокси
        if (commerceFilters.groceries && (!commerce.groceryStores || commerce.groceryStores === 0)) return false;
        if (commerceFilters.construction && (!commerce.construction || commerce.construction === 0)) return false;
        if (commerceFilters.clothing && (!commerce.clothing || commerce.clothing === 0)) return false;
        if (commerceFilters.postOffices && (!commerce.postOffices || commerce.postOffices === 0)) return false;
        if (commerceFilters.banks && (!commerce.banksATMs || commerce.banksATMs === 0)) return false;
        
        // Числові фільтри
        if (commerceFilters.minGroceryStores && commerce.groceryStores < commerceFilters.minGroceryStores) return false;
        if (commerceFilters.minRating && commerce.rating < commerceFilters.minRating) return false;
        
        // Селект щільності
        if (commerceFilters.density && commerceFilters.density !== 'any') {
          const districtDensity = commerce.density || 'medium';
          if (commerceFilters.density === 'high' && districtDensity !== 'high') return false;
          if (commerceFilters.density === 'medium' && districtDensity === 'low') return false;
        }
      }

      // Фільтрація за комунальними послугами (тільки для Premium)
      if (filters.utilities) {
        const utilsFilters = filters.utilities;
        
        // Чекбокси
        if (utilsFilters.water && (!utilities.water || utilities.water === 0)) return false;
        if (utilsFilters.heating && (!utilities.heating || utilities.heating === 0)) return false;
        if (utilsFilters.electricity && (!utilities.electricity || utilities.electricity === 0)) return false;
        if (utilsFilters.gas && (!utilities.gas || utilities.gas === 0)) return false;
        if (utilsFilters.waste && (!utilities.waste || utilities.waste === 0)) return false;
        
        // Селект якості
        if (utilsFilters.quality && utilsFilters.quality !== 'any') {
          const districtQuality = utilities.quality || 'average';
          if (utilsFilters.quality === 'good' && districtQuality !== 'good') return false;
          if (utilsFilters.quality === 'average' && districtQuality === 'poor') return false;
        }
      }

      return true;
    });
  }, []);

  const handleFiltersChange = useCallback((filters) => {
    console.log('Фільтри змінено:', filters);
    setSelectedFilters(filters);
    
    // Застосовуємо фільтри до всіх районів
    const filtered = filterDistrictsByCriteria(allDistricts, filters);
    console.log('Відфільтровані райони:', filtered.length);
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
            districts={filteredDistricts}
            onDistrictClick={handleDistrictClick}
            selectedFilters={selectedFilters}
          />
        )}
      </div>
    </div>
  );
}