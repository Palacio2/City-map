import { supabase } from '@supabaseClient';

export const fetchTrackedDistrictsWithStats = async () => {
  const { data, error } = await supabase.functions.invoke('get-tracked-districts');

  if (error) {
    throw error;
  }

  return data || [];
};

export const addTrackedDistrict = async ({ country, city, district, districtId }) => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_tracked_districts')
    .insert([{ 
      user_id: userId, 
      country, 
      city, 
      district,
      district_id: districtId 
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Цей район вже додано');
    throw error;
  }
  return data;
};

export const removeTrackedDistrict = async (id) => {
  const { error } = await supabase
    .from('user_tracked_districts')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};