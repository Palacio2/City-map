import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import SelectForm, { StatusView } from './SelectForm';
import Loader from '@components/loader/Loader';
import { fetchCountries, createSelectOptions } from '@api/cityCountrySelect';

export default function CountrySelect() {
  const { t } = useTranslation('db');
  const [selected, setSelected] = useState('');
  const navigate = useNavigate();

  const { data: countries = [], isLoading, error } = useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const data = await fetchCountries();
      return Array.isArray(data) ? data : [];
    }
  });

  const queryErrorMessage = error instanceof Error ? error.message : undefined;

  if (isLoading) return <Loader fullScreen text={t('country.loading')} />;
  if (queryErrorMessage) return <StatusView title={t('country.error')} error={queryErrorMessage} onBack={() => navigate(-1)} showRetry />;

  return (
    <SelectForm
      title={t('country.title')}
      subtitle={t('country.subtitle')}
      options={createSelectOptions(countries)}
      selectedValue={selected}
      onValueChange={setSelected}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selected) navigate(`/city/${encodeURIComponent(selected)}`);
      }}
    />
  );
}