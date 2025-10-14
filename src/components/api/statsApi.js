import { supabase } from '../../supabaseClient';

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`Помилка API: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : []; // Гарантуємо, що повертається масив
  } catch (error) {
    console.error('API Request failed:', error);
    return []; // Повертаємо пустий масив замість помилки
  }
}

export async function fetchUserStats() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return getDefaultStats();
    }

    const data = await apiRequest('/stats', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    return data || getDefaultStats();
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return getDefaultStats();
  }
}

export async function fetchWeeklyActivity() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return getDefaultWeeklyActivity();
    }

    const data = await apiRequest('/stats/weekly-activity', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    return Array.isArray(data) ? data : getDefaultWeeklyActivity();
  } catch (error) {
    console.error('Error fetching weekly activity:', error);
    return getDefaultWeeklyActivity();
  }
}

export async function fetchPopularDistricts() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return [];
    }

    const data = await apiRequest('/stats/popular-districts', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching popular districts:', error);
    return [];
  }
}

// Функції за замовчуванням
function getDefaultStats() {
  return {
    searches: 0,
    savedDistricts: 0,
    comparisons: 0,
    lastActive: 'ніколи',
    totalTime: '0 год 0 хв',
    favoriteDistrict: 'Не визначено'
  };
}

function getDefaultWeeklyActivity() {
  return [
    { day: 'Пн', searches: 0, comparisons: 0 },
    { day: 'Вт', searches: 0, comparisons: 0 },
    { day: 'Ср', searches: 0, comparisons: 0 },
    { day: 'Чт', searches: 0, comparisons: 0 },
    { day: 'Пт', searches: 0, comparisons: 0 },
    { day: 'Сб', searches: 0, comparisons: 0 },
    { day: 'Нд', searches: 0, comparisons: 0 }
  ];
}