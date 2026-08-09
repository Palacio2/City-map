import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchDistrictsWithFilters } from '@api/districtsApi';
import { transformDistrictsForDisplay, TransformedDistrict } from '@utils/dataTransformers';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { useSubscription } from '@/pages/subscription/contex/SubscriptionContext';

export const useDistrictsQuery = (country?: string, city?: string): UseQueryResult<TransformedDistrict[], Error> => {
  const { config } = useFiltersConfig();
  const { isFree, isRealtor } = useSubscription();

  return useQuery({
    queryKey: ['districts', country, city, isFree, isRealtor], 
    queryFn: async (): Promise<TransformedDistrict[]> => {
      if (!country || !city || !config) return []; 
      
      const data = await fetchDistrictsWithFilters(country, city);
      
      return transformDistrictsForDisplay(data, config, { isFree, isRealtor }); 
    },
    enabled: !!country && !!city && !!config, 
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
};