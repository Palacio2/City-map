const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cityCountrySelect`;

const mapLocationData = (item) => ({
  value: item.name,
  label: item.name,
  available: item.is_available,
});

async function apiRequest(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
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