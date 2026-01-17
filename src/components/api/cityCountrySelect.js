import { authenticatedApiRequest } from './apiClient';

const mapLocationData = (item) => ({
  value: item.name,
  label: item.name,
  available: item.is_available,
});

async function apiRequest(endpoint) {
  return authenticatedApiRequest(`/cityCountrySelect${endpoint}`);
}

export async function fetchCountries() {
  const data = await apiRequest('/get-locations/countries');
  return Array.isArray(data) ? data.map(mapLocationData) : [];
}

export async function fetchCitiesByCountry(countryName) {
  if (!countryName) return [];
  const encodedName = encodeURIComponent(countryName);
  const data = await apiRequest(`/get-locations/cities/${encodedName}`);
  return Array.isArray(data) ? data.map(mapLocationData) : [];
}

export function createSelectOptions(data) {
  if (!Array.isArray(data)) return [];

  const available = [];
  const unavailable = [];

  data.forEach(item => {
    const option = {
      label: item.label || item.name || item.value,
      value: item.value,
      disabled: !item.available
    };

    if (item.available) {
      available.push(option);
    } else {
      unavailable.push(option);
    }
  });

  return [...available, ...unavailable];
}
