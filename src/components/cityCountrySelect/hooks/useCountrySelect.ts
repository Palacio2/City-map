import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchCountries, createSelectOptions } from '../api/cityCountryApi';
import type { SelectOption } from '../types';
import type { FormEvent } from 'react';

export const useCountrySelect = () => {
  const { t } = useTranslation('db');
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('');

  const { data: countries = [], isLoading, error } = useQuery({
    queryKey: ['countries'],
    queryFn: fetchCountries
  });

  const options: SelectOption[] = createSelectOptions(countries);
  const errorMessage = error instanceof Error ? error.message : undefined;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selected) {
      navigate(`/city/${encodeURIComponent(selected)}`);
    }
  };

  const handleBack = () => navigate(-1);

  return {
    selected,
    setSelected,
    options,
    isLoading,
    errorMessage,
    handleSubmit,
    handleBack,
    t
  };
};