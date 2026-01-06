import { favoritesAPI } from '../components/api/addFavoritesApi';
import { supabase } from '../supabaseClient';

export const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
};

export const checkIsFavorite = async (districtId) => {
  const token = await getAuthToken();
  if (!token) return false;

  try {
    const result = await favoritesAPI.checkFavorite(districtId, token);
    return !!result.isFavorite;
  } catch {
    return false;
  }
};

export const toggleFavorite = async (district, currentState) => {
  const token = await getAuthToken();
  if (!token) return currentState;

  try {
    const result = await favoritesAPI.toggleFavorite(district.id, token);
    return result.success ? result.isFavorite : currentState;
  } catch {
    return currentState;
  }
};