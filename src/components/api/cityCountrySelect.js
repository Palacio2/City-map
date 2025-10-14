const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function apiRequest(endpoint) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Request:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      throw new Error(`Помилка API: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);
    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

export async function fetchCountries() {
  try {
    const data = await apiRequest('/cityCountrySelect/get-locations/countries');
    
    return data.map(country => ({
      value: country.name,
      label: country.name,
      available: country.is_available,
    }));
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
}

export async function fetchCitiesByCountry(countryName) {
  try {
    const encodedCountryName = encodeURIComponent(countryName);
    const data = await apiRequest(`/cityCountrySelect/get-locations/cities/${encodedCountryName}`);
    
    return data.map(city => ({
      value: city.name,
      label: city.name,
      available: city.is_available,
    }));
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw new Error(`Не вдалося завантажити міста для ${countryName}`);
  }
}