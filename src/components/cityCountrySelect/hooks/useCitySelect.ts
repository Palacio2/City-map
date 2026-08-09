import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchCitiesByCountry, createSelectOptions } from '../api/cityCountryApi';
import type { SelectOption } from '../types';
import type { FormEvent } from 'react';

export const useCitySelect = (propCountry?: string) => {
  const { t } = useTranslation('db');
  const { country: paramCountry } = useParams<{ country: string }>();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('');

  const effectiveCountry = propCountry || paramCountry;
  const decodedCountry = useMemo(() => effectiveCountry ? decodeURIComponent(effectiveCountry) : '', [effectiveCountry]);

  const { data: cities = [], isLoading, error } = useQuery({
    queryKey: ['cities', decodedCountry],
    queryFn: () => fetchCitiesByCountry(decodedCountry),
    enabled: !!decodedCountry
  });

  const options: SelectOption[] = createSelectOptions(cities.map(c => ({ ...c, name: c.name || c.value })));
  const queryErrorMessage = error instanceof Error ? error.message : undefined;
  const displayError = queryErrorMessage || (!decodedCountry && !propCountry ? t('country.missing_error') : undefined);
  const hasCities = cities.length > 0;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selected) {
      navigate(`/map/${encodeURIComponent(decodedCountry)}/${encodeURIComponent(selected)}`);
    }
  };

  const handleBack = () => navigate(-1);

  return {
    decodedCountry,
    selected,
    setSelected,
    options,
    isLoading,
    displayError,
    hasCities,
    showRetry: !!error,
    handleSubmit,
    handleBack,
    t
  };
};