// api/favoritesApi.js
import { supabase } from '../../supabaseClient';

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/favorites`;

export const favoritesApi = {
  async request(endpoint, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Будь ласка, увійдіть в систему');
    }

    const url = `${API_BASE_URL}/${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || `Помилка ${response.status}`);
      } catch {
        throw new Error(`Помилка ${response.status}: ${errorText}`);
      }
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { success: true, message: "Дія виконана" };
    }

    return await response.json();
  },

  async getFavorites() {
    const data = await this.request('get', { method: 'GET' });
    return data.favorites || [];
  },

  // Використовує /remove, очікує districtId у тілі
  async removeFavorite(districtId) {
    return await this.request('remove', {
      method: 'POST',
      body: JSON.stringify({ districtId })
    });
  }
};