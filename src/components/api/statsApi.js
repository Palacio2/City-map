import { supabase } from '../../supabaseClient';

// Зверніть увагу: URL має бути коректним. 
// Якщо ви тестуєте локально - це одна адреса, якщо на проді - інша.
const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    return []; 
  }
}

export async function fetchUserStats() {
  const data = await apiRequest('/stats');
  return data || null;
}

export async function fetchWeeklyActivity() {
  const data = await apiRequest('/stats/weekly-activity');
  return Array.isArray(data) ? data : [];
}

export async function fetchPopularDistricts() {
  const data = await apiRequest('/stats/popular-districts');
  return Array.isArray(data) ? data : [];
}