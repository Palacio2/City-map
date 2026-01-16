const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function apiRequest(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

export async function fetchDistrictsWithFilters(country, city) {
  const params = new URLSearchParams({ country, city, filters: 'true' });
  return apiRequest(`/get-districts?${params.toString()}`);
}