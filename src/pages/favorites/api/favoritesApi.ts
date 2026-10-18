import { supabase } from '@supabaseClient';
import type { TransformedDistrict } from '@utils/dataTransformers';

export const favoritesApi = {
  getFavorites: async (): Promise<TransformedDistrict[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Unauthorized');
    
    const { data, error } = await supabase
      .from('favorite_districts')
      .select('district_id')
      .eq('user_id', session.user.id);
      
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];

    const ids = data.map((item: { district_id: string | number }) => item.district_id as string);
    const { fetchDistrictsByIds } = await import('@shared/api/districtsApi');
    const districtsData = await fetchDistrictsByIds(ids);

    return districtsData.map((dist) => dist as unknown as TransformedDistrict);
  },
  addFavorite: async (districtId: string | number): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Unauthorized');
    const { error } = await supabase
      .from('favorite_districts')
      .insert({ district_id: String(districtId), user_id: session.user.id });
    if (error && error.code !== '23505') throw new Error(error.message);
  },
  removeFavorite: async (districtId: string | number): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Unauthorized');
    const { error } = await supabase
      .from('favorite_districts')
      .delete()
      .eq('district_id', String(districtId))
      .eq('user_id', session.user.id);
    if (error) throw new Error(error.message);
  }
};
