// @ts-nocheck
import { supabase } from '@supabaseClient';

export const fetchDistrictsWithFilters = async (country: string, city: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('districts')
    .select('*, city:cities!inner(name, country:countries!inner(name)), filterData:district_filter_data(*), photos:district_photos(*)')
    .eq('cities.name', city)
    .eq('cities.countries.name', country);
  
  if (error) throw new Error(error.message);
  return (data || []).map((d: any) => ({
    ...d,
    city: d.city?.name,
    country: d.city?.country?.name,
    photo_url: Array.isArray(d.photos) 
      ? d.photos.find((p: any) => p.is_main)?.photo_url || d.photos[0]?.photo_url || null
      : typeof d.photos === 'object' && d.photos !== null 
        ? (d.photos as any).photo_url || null 
        : null
  }));
};

export const fetchDistrictsByIds = async (ids: string[] | number[]): Promise<any[]> => {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from('districts')
    .select('*, city:cities!inner(name, country:countries!inner(name)), filterData:district_filter_data(*), photos:district_photos(*)')
    .in('id', ids);
    
  if (error) throw new Error(error.message);
  return (data || []).map((d: any) => ({
    ...d,
    city: d.city?.name,
    country: d.city?.country?.name,
    photo_url: Array.isArray(d.photos) 
      ? d.photos.find((p: any) => p.is_main)?.photo_url || d.photos[0]?.photo_url || null
      : typeof d.photos === 'object' && d.photos !== null 
        ? (d.photos as any).photo_url || null 
        : null
  }));
};
