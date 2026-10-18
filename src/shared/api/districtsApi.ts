import { supabase } from '@supabaseClient';
import type { DistrictData } from '@shared/utils/dataTransformers';

export const fetchDistrictSearch = async (country: string, city: string, filters: Record<string, unknown>, signal?: AbortSignal): Promise<{ districts: DistrictData[]; total: number; originalTotal: number }> => {
  const { data, error } = await supabase.functions.invoke('get-districts', {
    body: { country, city, filters: JSON.stringify(filters), includeTotals: true }, signal,
  });
  if (error) throw new Error(error.message);
  if (!data || !Array.isArray(data.districts) || !Number.isSafeInteger(data.total) || !Number.isSafeInteger(data.originalTotal)) throw new Error('Invalid search response');
  return data;
};

export const fetchDistrictsWithFilters = async (country: string, city: string, signal?: AbortSignal, filters?: Record<string, unknown>): Promise<DistrictData[]> => {
  const { data, error } = await supabase.functions.invoke('get-districts', {
    body: { country, city, filters: filters ? JSON.stringify(filters) : 'true' },
    signal,
  });
  if (error) throw new Error(error.message);
  return data || [];
};

export const fetchDistrictsByIds = async (ids: (string | number)[]): Promise<DistrictData[]> => {
  if (!ids || ids.length === 0) return [];
  
  const { data, error } = await supabase.functions.invoke('get-districts', {
    body: { ids: ids.join(','), filters: 'true' }
  });
    
  if (error) throw new Error(error.message);
  return data || [];
};
