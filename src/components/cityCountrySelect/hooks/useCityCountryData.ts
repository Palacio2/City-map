import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCountries, fetchCitiesByCountry, createSelectOptions } from '../api/cityCountryApi';
import type { UseCityCountryDataReturn } from '../types';

export function useCityCountryData(selectedCountry: string): UseCityCountryDataReturn {
  const {
    data: countries = [],
    isLoading: isLoadingCountries,
    isError: isCountriesError,
    refetch: refetchCountries,
  } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: cities = [],
    isLoading: isLoadingCities,
    isError: isCitiesError,
  } = useQuery({
    queryKey: ['cities', selectedCountry],
    queryFn: () => fetchCitiesByCountry(selectedCountry),
    enabled: !!selectedCountry,
    staleTime: 5 * 60 * 1000,
  });

  const countryOptions = useMemo(() => {
    return createSelectOptions(countries);
  }, [countries]);

  const cityOptions = useMemo(() => {
    return createSelectOptions(
      cities.map((c) => ({ ...c, name: c.name || c.value }))
    );
  }, [cities]);

  return {
    countries,
    cities,
    countryOptions,
    cityOptions,
    isLoadingCountries,
    isLoadingCities,
    isError: isCountriesError || isCitiesError,
    refetchCountries,
  };
}
