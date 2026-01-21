import { favoritesApi } from '../components/api/favoritesApi';

export const checkIsFavorite = async (districtId) => {
  try {
    return await favoritesApi.checkFavorite(districtId);
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const toggleFavorite = async (districtId) => {
  try {
    return await favoritesApi.toggleFavorite(districtId);
  } catch (error) {
    console.error(error);
    throw error;
  }
};