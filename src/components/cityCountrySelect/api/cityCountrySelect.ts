// @ts-nocheck
import { authenticatedApiRequest } from '@api/apiClient';

const mapLocationData = (item) => ({
  value: item.name,
  label: item.name,
  available: item.is_available,
});

const memoryCache = {
  countries: null,
  cities: {}
};

async function apiRequest(endpoint) {
  return authenticatedApiRequest(`/cityCountrySelect${endpoint}`);
}

export async function fetchCountries() {
  if (memoryCache.countries) return memoryCache.countries;

  const data = await apiRequest('/get-locations/countries');
  const result = Array.isArray(data) ? data.map(mapLocationData) : [];
  
  memoryCache.countries = result;
  return result;
}

export async function fetchCitiesByCountry(countryName) {
  if (!countryName) return [];
  
  if (memoryCache.cities[countryName]) {
    return memoryCache.cities[countryName];
  }

  const encodedName = encodeURIComponent(countryName);
  const data = await apiRequest(`/get-locations/cities/${encodedName}`);
  const result = Array.isArray(data) ? data.map(mapLocationData) : [];

  memoryCache.cities[countryName] = result;
  return result;
}

export function createSelectOptions(data) {
  if (!Array.isArray(data)) return [];

  const available = [];
  const unavailable = [];

  data.forEach(item => {
    const option = {
      label: item.label || item.name || item.value,
      value: item.value,
      disabled: item.available === false 
    };

    if (item.available !== false) {
      available.push(option);
    } else {
      unavailable.push(option);
    }
  });

  return [...available, ...unavailable];
}
