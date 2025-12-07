// src/api/favoritesApi.js

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/add-favorites`;

export const favoritesAPI = {
  // Перевірити, чи район є улюбленим
  checkFavorite: async (districtId, authToken) => {
    try {
      console.log('Перевірка улюбленого району:', districtId);
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          districtId,
          action: 'check'  // ✅ ПРАВИЛЬНЕ ЗНАЧЕННЯ
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Результат перевірки улюбленого:', result);
      
      return result;
    } catch (error) {
      console.error('API Error (checkFavorite):', error);
      throw error;
    }
  },

  // Додати/видалити район (toggle)
  toggleFavorite: async (districtId, authToken) => {
    try {
      console.log('Toggle улюбленого району:', districtId);
      
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          districtId,
          action: 'toggle'  // ✅ ПРАВИЛЬНЕ ЗНАЧЕННЯ
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Результат toggle:', result);
      
      return result;
    } catch (error) {
      console.error('API Error (toggleFavorite):', error);
      throw error;
    }
  },

  // Альтернативні методи для зручності
  addFavorite: async (districtId, authToken) => {
    // Просто викликаємо toggle - якщо не улюблений, то додасться
    return await favoritesAPI.toggleFavorite(districtId, authToken);
  },

  removeFavorite: async (districtId, authToken) => {
    // Просто викликаємо toggle - якщо улюблений, то видалиться
    return await favoritesAPI.toggleFavorite(districtId, authToken);
  }
};