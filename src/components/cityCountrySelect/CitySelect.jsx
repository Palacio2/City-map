import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SelectForm, { StatusView } from '@ui/selectForm/SelectForm';
import { fetchCitiesByCountry, createSelectOptions } from '@api/cityCountrySelect';

export default function CitySelect() {
  const { t } = useTranslation('select');
  const { country } = useParams();
  const decodedCountry = decodeURIComponent(country || '');
  
  const [cities, setCities] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!decodedCountry) {
      setError(t('country_missing'));
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchCitiesByCountry(decodedCountry)
      .then(data => setCities(data.map(c => ({ ...c, name: c.name || c.value }))))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [decodedCountry, t]);

  const handleBack = () => navigate(-1);

  if (error || !decodedCountry) {
    return (
      <StatusView 
        title={t('error')} 
        error={error || t('country_not_found')} 
        onBack={handleBack} 
        showRetry={!!error} 
      />
    );
  }

  const hasCities = cities.length > 0;

  return (
    <SelectForm
      title={t('city_title', { country: decodedCountry })}
      options={createSelectOptions(cities)}
      selectedValue={selected}
      onValueChange={setSelected}
      onSubmit={(e) => {
        e.preventDefault();
        if (selected) navigate(`/map/${encodeURIComponent(country)}/${encodeURIComponent(selected)}`);
      }}
      onBack={handleBack}
      showBackButton
      submitText={t('go_to_map')}
      disabled={!hasCities}
      disabledMessage={!hasCities ? t('cities_not_found') : t('unavailable')}
      isLoading={loading}
      isSearchable
    />
  );
}