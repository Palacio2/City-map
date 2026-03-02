import { supabase } from '@supabaseClient';
import { authenticatedApiRequest } from './apiClient';

export const fetchTrackedDistrictsWithStats = async () => {
  return await authenticatedApiRequest('/get-tracked-districts');
};

export const addTrackedDistrict = async ({ country, city, district, districtId }) => {
  const { data, error } = await supabase
    .from('user_tracked_districts')
    .insert([{ 
      country, 
      city, 
      district,
      district_id: districtId 
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Цей район вже додано');
    throw new Error('Не вдалося додати район');
  }
  return data;
};

export const removeTrackedDistrict = async (id) => {
  const { error } = await supabase
    .from('user_tracked_districts')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Помилка при видаленні');
  return true;
};