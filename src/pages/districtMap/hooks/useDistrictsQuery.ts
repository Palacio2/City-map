import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchDistrictSearch } from '@api/districtsApi';
import { transformDistrictsForDisplay, TransformedDistrict } from '@utils/dataTransformers';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { useSubscription } from '@subscription/context/SubscriptionContext';
import type { Filters } from '@filtersPanel/filterLogic';

type DistrictSearch = { districts: TransformedDistrict[]; total: number; originalTotal: number };
export const useDistrictsQuery = (country?: string, city?: string, filters: Filters = {}): UseQueryResult<DistrictSearch, Error> => {
  const { config } = useFiltersConfig();
  const { isFree, isRealtor } = useSubscription();

  return useQuery({
    queryKey: ['districts', country, city, isFree, isRealtor, filters],
    queryFn: async ({ signal }): Promise<DistrictSearch> => {
      if (!country || !city || !config) return { districts: [], total: 0, originalTotal: 0 };
      
      const active = Object.fromEntries(Object.entries(filters).flatMap(([group, values]) =>
        Object.entries(values).filter(([,value]) => value != null && value !== '' && value !== false && value !== 'any')
          .map(([key,value]) => [config[group]?.fields.find(field => field.key === key)?.dbKey ?? key, value])));
      const data = await fetchDistrictSearch(country, city, active, signal);
      
      return { ...data, districts: transformDistrictsForDisplay(data.districts, config, { isFree, isRealtor }) };
    },
    enabled: !!country && !!city && !!config, 
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
};
