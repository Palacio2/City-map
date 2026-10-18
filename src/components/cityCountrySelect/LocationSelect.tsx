import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCityCountryData } from './hooks/useCityCountryData';
import { useRecentLocations } from './hooks/useRecentLocations';
import { usePopularCities } from './hooks/usePopularCities';
import { LocationHero } from './components/LocationHero';
import { LocationDualSelector } from './components/LocationDualSelector';
import { RecentLocations } from './components/RecentLocations';
import { PopularLocations } from './components/PopularLocations';

export default function LocationSelect() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const {
    countryOptions,
    cityOptions,
    isLoadingCountries,
    isLoadingCities,
  } = useCityCountryData(selectedCountry);

  const {
    popularCities,
    isLoadingPopular,
  } = usePopularCities(selectedCountry);

  const {
    recentLocations,
    addRecentLocation,
    removeRecentLocation,
    clearRecentLocations,
  } = useRecentLocations();

  const handleCountryChange = useCallback((val: string) => {
    setSelectedCountry(val);
    setSelectedCity('');
  }, []);

  const handleCityChange = useCallback((val: string) => {
    setSelectedCity(val);
  }, []);

  const navigateToMap = useCallback(
    (country: string, city: string) => {
      if (country && city) {
        addRecentLocation(country, city);
        navigate(`/map/${encodeURIComponent(country)}/${encodeURIComponent(city)}`);
      }
    },
    [navigate, addRecentLocation]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      navigateToMap(selectedCountry, selectedCity);
    },
    [selectedCountry, selectedCity, navigateToMap]
  );

  const handleDirectSelect = useCallback(
    (country: string, city: string) => {
      setSelectedCountry(country);
      setSelectedCity(city);
      navigateToMap(country, city);
    },
    [navigateToMap]
  );

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-start pt-4 sm:pt-10 pb-12 sm:pb-20 px-0 sm:px-6 animate-fadeIn overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 bg-body" />
      
      <div className="radar-scanner z-0" />

      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-20 dark:opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--primary) 1px, transparent 1px),
            linear-gradient(to bottom, var(--primary) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 10%, transparent 70%)',
          maskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 10%, transparent 70%)',
        }}
      />
      
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary z-0 shadow-[0_0_15px_var(--primary)] pointer-events-none" 
        style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} 
      />

      <div className="fixed top-[30%] left-[35%] w-2 h-2 bg-primary rounded-full z-0 opacity-0 pointer-events-none" style={{ animation: 'radar-blip 6s infinite 1s' }} />
      <div className="fixed top-[65%] left-[60%] w-2.5 h-2.5 bg-primary rounded-full z-0 opacity-0 pointer-events-none" style={{ animation: 'radar-blip 8s infinite 3.5s' }} />
      <div className="fixed top-[45%] right-[25%] w-1.5 h-1.5 bg-primary rounded-full z-0 opacity-0 pointer-events-none" style={{ animation: 'radar-blip 5s infinite 0.5s' }} />
      <div className="fixed bottom-[25%] left-[20%] w-2 h-2 bg-primary rounded-full z-0 opacity-0 pointer-events-none" style={{ animation: 'radar-blip 7s infinite 5s' }} />
      <div className="fixed top-[20%] right-[40%] w-1.5 h-1.5 bg-primary rounded-full z-0 opacity-0 pointer-events-none" style={{ animation: 'radar-blip 6.5s infinite 2s' }} />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        <LocationHero />

        <RecentLocations
          locations={recentLocations}
          onSelect={handleDirectSelect}
          onRemove={removeRecentLocation}
          onClearAll={clearRecentLocations}
        />

        <LocationDualSelector
          countryOptions={countryOptions}
          cityOptions={cityOptions}
          selectedCountry={selectedCountry}
          selectedCity={selectedCity}
          onCountryChange={handleCountryChange}
          onCityChange={handleCityChange}
          onSubmit={handleSubmit}
          isLoadingCountries={isLoadingCountries}
          isLoadingCities={isLoadingCities}
        />

        <PopularLocations
          selectedCountry={selectedCountry}
          popularCities={popularCities}
          isLoading={isLoadingPopular}
          onSelectLocation={handleDirectSelect}
        />
      </div>
    </div>
  );
}