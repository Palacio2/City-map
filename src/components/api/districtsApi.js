// districtsApi.js - ПРОСТА РОБОЧА ВЕРСІЯ
const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('API Request to:', url);
  
  try {
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

// Просто використовуйте старий робочий маршрут
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
    throw new Error(`Не вдалося завантажити райони для ${cityName}`);
  }
}