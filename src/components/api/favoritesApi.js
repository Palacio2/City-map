// api/favoritesApi.js
import { supabase } from '../../supabaseClient';

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/favorites`;

export const favoritesApi = {
  async request(endpoint, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Будь ласка, увійдіть в систему');
    }

    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Помилка ${response.status}`);
    }

    return await response.json();
  },

  async getFavorites() {
    const data = await this.request('get');
    return data.favorites || [];
  },

  async removeFavorite(districtId) {
    return await this.request('remove', {
      method: 'POST',
      body: JSON.stringify({ districtId })
    });
  }
};