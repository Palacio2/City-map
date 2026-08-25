// @ts-nocheck
import { supabase } from '@supabaseClient';

export const fetchDistrictsWithFilters = async (country: string, city: string): Promise<any[]> => {
  const { data, error } = await supabase.functions.invoke('get-districts', {
    body: { country, city, filters: 'true' }
  });
  
  if (error) throw new Error(error.message);
  return data || [];
};

export const fetchDistrictsByIds = async (ids: string[] | number[]): Promise<any[]> => {
  if (!ids || ids.length === 0) return [];
  
  const { data, error } = await supabase.functions.invoke('get-districts', {
    body: { ids: ids.join(','), filters: 'true' }
  });
    
  if (error) throw new Error(error.message);
  return data || [];
};
