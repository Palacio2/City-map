import { useQuery } from '@tanstack/react-query';
import { fetchDistrictsWithFilters } from '@api/districtsApi';
import { transformDistrictsForDisplay } from '@utils/dataTransformers';

export const useDistrictsQuery = (country, city) => {
  return useQuery({
    queryKey: ['districts', country, city],
    queryFn: async () => {
      if (!country || !city) return [];
      const data = await fetchDistrictsWithFilters(country, city);
      return transformDistrictsForDisplay(data);
    },
    enabled: !!country && !!city,
    staleTime: 15 * 60 * 1000, // Кешуємо дані на 15 хвилин (не будемо смикати сервер)
    gcTime: 30 * 60 * 1000,    // Зберігаємо в смітнику 30 хвилин
    retry: 1,
  });
};