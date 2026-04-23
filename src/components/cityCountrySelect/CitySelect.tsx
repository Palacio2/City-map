import { useState, useMemo, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import SelectForm, { StatusView } from './SelectForm';
import Loader from '@components/loader/Loader';
import { fetchCitiesByCountry, createSelectOptions } from '@api/cityCountrySelect';

export default function CitySelect({ country: propCountry }: { country?: string }) {
  const { t } = useTranslation('db');
  const { country: paramCountry } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');

  const effectiveCountry = propCountry || paramCountry;
  const decodedCountry = useMemo(() => effectiveCountry ? decodeURIComponent(effectiveCountry) : '', [effectiveCountry]);

  const { data: cities = [], isLoading, error } = useQuery({
    queryKey: ['cities', decodedCountry],
    queryFn: async () => {
      const data = await fetchCitiesByCountry(decodedCountry);
      return data.map((c: any) => ({ ...c, name: c.name || c.value }));
    },
    enabled: !!decodedCountry
  });

  const queryErrorMessage = error instanceof Error ? error.message : undefined;
  const displayError: string | undefined = queryErrorMessage || (!decodedCountry && !propCountry ? t('country.missing_error') : undefined);

  if (isLoading) return <Loader fullScreen text={t('city.loading')} />;
  if (displayError) return <StatusView title={t('city.error')} error={displayError} onBack={() => navigate(-1)} showRetry={!!error} />;

  const hasCities = cities.length > 0;

  return (
    <SelectForm
      title={t('city.title', { country: decodedCountry })}
      options={createSelectOptions(cities)}
      selectedValue={selected}
      onValueChange={setSelected}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selected) navigate(`/map/${encodeURIComponent(decodedCountry)}/${encodeURIComponent(selected)}`);
      }}
      onBack={() => navigate(-1)}
      showBackButton
      submitText={t('city.submit')}
      disabled={!hasCities}
      disabledMessage={hasCities ? t('city.unavailable') : t('city.not_found')}
      isSearchable
    />
  );
}