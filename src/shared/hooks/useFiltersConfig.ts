import { useQuery } from '@tanstack/react-query';
import type { DynamicDistrictConfig } from '@config/districtFields';
import { supabase } from '@supabaseClient';

const fetchFiltersConfig = async (signal: AbortSignal): Promise<DynamicDistrictConfig> => {
  const { data, error } = await supabase.functions.invoke<DynamicDistrictConfig>('get-filters-config', {
    method: 'GET', signal,
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || Array.isArray(data)
    || Object.values(data).some(category => !category || !Array.isArray(category.fields)
      || category.fields.some(field => !field || typeof field.dbKey !== 'string'
        || typeof field.isPremiumField !== 'boolean' || typeof field.isRealtorOnly !== 'boolean'))) {
    throw new Error('Invalid filters configuration');
  }
  return data;
};

export const useFiltersConfig = () => {
  const { data: config = null, isLoading, error } = useQuery<DynamicDistrictConfig, Error>({
    queryKey: ['filtersConfig'],
    queryFn: ({ signal }) => fetchFiltersConfig(signal),
    staleTime: 60_000,
  });
  return { config, isLoading, error };
};
