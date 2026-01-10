import { supabase } from '../../supabaseClient';

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function apiRequest(endpoint, options = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) throw new Error('No active session');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error; // Прокидаємо помилку, щоб UI міг показати error state
  }
}

// Єдиний метод для отримання всього дашборду
export async function fetchDashboardData() {
  // Викликаємо нову Edge Function 'get-dashboard-stats'
  const data = await apiRequest('/get-dashboard-stats');
  
  return {
    stats: data.stats || null,
    weeklyActivity: Array.isArray(data.weeklyActivity) ? data.weeklyActivity : [],
    popularDistricts: Array.isArray(data.popularDistricts) ? data.popularDistricts : []
  };
}