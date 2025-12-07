// src/utils/favorites.js
import { favoritesAPI } from '../components/api/addFavoritesApi';
import { supabase } from '../supabaseClient'; // ✅ Правильний імпорт

// Отримати токен з сесії Supabase
export const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  } catch (error) {
    console.error('Помилка отримання токена:', error);
    return null;
  }
};

export const checkIsFavorite = async (districtId) => {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    const result = await favoritesAPI.checkFavorite(districtId, token);
    return result.isFavorite;
  } catch (error) {
    console.error('Помилка перевірки улюбленого:', error);
    return false;
  }
};

export const toggleFavorite = async (district, currentState) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      alert('Будь ласка, увійдіть в систему, щоб додавати улюблені');
      return currentState;
    }

    const result = await favoritesAPI.toggleFavorite(district.id, token);
    
    // Показати повідомлення
    if (result.success) {
      console.log(result.message);
    }
    
    return result.isFavorite;
  } catch (error) {
    console.error('Помилка toggle улюбленого:', error);
    return currentState;
  }
};