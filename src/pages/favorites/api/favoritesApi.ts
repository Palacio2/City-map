import { supabase } from '@supabaseClient';
import type { TransformedDistrict } from '@utils/dataTransformers';

export const favoritesApi = {
  getFavorites: async (): Promise<TransformedDistrict[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Unauthorized');
    
    const { data, error } = await supabase
      .from('favorite_districts')
      .select('*, district:districts(*, city:cities!inner(name, country:countries!inner(name)), filterData:district_filter_data(*), photos:district_photos(*))')
      .eq('user_id', session.user.id);
      
    if (error) throw new Error(error.message);
    return (data?.map((item: any) => {
      const dist = item.district;
      return {
        ...dist,
        city: dist?.city?.name,
        country: dist?.city?.country?.name,
        photo_url: dist?.photos?.find((p: any) => p.is_main)?.photo_url || dist?.photos?.[0]?.photo_url || null
      };
    }) || []) as TransformedDistrict[];
  },
  addFavorite: async (districtId: string | number): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Unauthorized');
    const { error } = await supabase
      .from('favorite_districts')
      .insert({ district_id: String(districtId), user_id: session.user.id });
    if (error) throw new Error(error.message);
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
