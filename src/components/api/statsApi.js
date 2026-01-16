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
    throw error;
  }
}

export async function fetchDashboardData() {
  return await apiRequest('/get-dashboard-stats');
}

export async function trackActivity(type) {
  try {
    const { error } = await supabase.rpc('track_user_activity', { activity_type: type });
    if (error) console.error('Tracking error:', error);
  } catch (err) {
    console.error('Tracking failed:', err);
  }
}

// НОВА ФУНКЦІЯ: Оновлення часу
export async function updateUserTime(seconds) {
  try {
    const { error } = await supabase.rpc('update_user_time', { seconds });
    if (error) console.error('Time tracking error:', error);
  } catch (err) {
    console.error('Time tracking failed:', err);
  }
}

export async function trackDistrictVisit(districtId) {
  try {
    const { error } = await supabase.rpc('track_district_visit', { did: districtId });
    if (error) console.error('District visit error:', error);
  } catch (err) {
    console.error('District visit failed:', err);
  }
}