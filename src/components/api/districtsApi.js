// districtsApi.js
const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Request:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`Помилка API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

export async function fetchDistrictsByCity(countryName, cityName) {
  try {
    const encodedCountry = encodeURIComponent(countryName);
    const encodedCity = encodeURIComponent(cityName);
    
    const data = await apiRequest(
      `/get-districts/city/?country=${encodedCountry}&city=${encodedCity}`
    );
    
    return data.map(district => ({
      id: district.id,
      name: district.name,
      available: district.is_available,
      svgContent: district.full_svg,
      viewBox: district.view_box,
      hasSvg: !!district.full_svg
    }));
  } catch (error) {
    console.error('Error fetching districts:', error);
    throw new Error(`Не вдалося завантажити райони для ${cityName}`);
  }
}

export async function fetchDistrictsWithFilters(countryName, cityName) {
  try {
    const encodedCountry = encodeURIComponent(countryName);
    const encodedCity = encodeURIComponent(cityName);
    
    const data = await apiRequest(
      `/get-district-filters/?country=${encodedCountry}&city=${encodedCity}`
    );
    
    return data;
  } catch (error) {
    console.error('Error fetching districts with filters:', error);
    throw new Error(`Не вдалося завантажити дані фільтрів для ${cityName}`);
  }
}