import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SelectForm, { StatusView } from '@ui/selectForm/SelectForm';
import Loader from '@components/loader/Loader';
import { fetchCountries, createSelectOptions } from '@api/cityCountrySelect';

export default function CountrySelect() {
  const { t } = useTranslation('select');
  const [countries, setCountries] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    fetchCountries()
      .then(data => {
        if (isMounted) setCountries(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBack = () => navigate(-1);

  if (loading) return <Loader fullScreen text={t('loading')} />;
  if (error) return <StatusView error={error} onBack={handleBack} showRetry />;

  return (
    <SelectForm
      title={t('country_title')}
      subtitle={t('country_subtitle')}
      options={createSelectOptions(countries)}
      selectedValue={selected}
      onValueChange={setSelected}
      onSubmit={(e) => {
        e.preventDefault();
        if (selected) navigate(`/city/${encodeURIComponent(selected)}`);
      }}
      onBack={handleBack}
      showBackButton
    />
  );
}