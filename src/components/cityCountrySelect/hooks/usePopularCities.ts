import { useQuery } from '@tanstack/react-query';
import { fetchPopularCities } from '../api/cityCountryApi';
import type { PopularCityItem } from '../types';

export function usePopularCities(selectedCountry?: string) {
  const {
    data: popularCities = [],
    isLoading: isLoadingPopular,
    isError,
  } = useQuery({
    queryKey: ['popularCities', selectedCountry || 'all'],
    queryFn: async () => {
      try {
        const data = await fetchPopularCities(selectedCountry);
        return data || [];
      } catch (err) {
        console.warn('Failed to fetch dynamic popular cities from edge function:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    popularCities: popularCities as PopularCityItem[],
    isLoadingPopular,
    isError,
  };
}
