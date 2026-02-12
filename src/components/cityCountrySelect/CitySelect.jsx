import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SelectForm, { StatusView } from '@ui/selectForm/SelectForm';
import { fetchCitiesByCountry, createSelectOptions } from '@api/cityCountrySelect';

export default function CitySelect({ country: propCountry }) {
  const { t } = useTranslation('select');
  const { country: paramCountry } = useParams();
  const navigate = useNavigate();

  const effectiveCountry = propCountry || paramCountry;
  
  const decodedCountry = useMemo(() => 
    effectiveCountry ? decodeURIComponent(effectiveCountry) : '', 
  [effectiveCountry]);
  
  const [cities, setCities] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(!!decodedCountry);
  const [fetchError, setFetchError] = useState(null);

  const validationError = !decodedCountry && !propCountry ? t('country_missing') : null;
  const displayError = fetchError || validationError;

  useEffect(() => {
    if (!decodedCountry) return;

    let isMounted = true;
    
    fetchCitiesByCountry(decodedCountry)
      .then(data => {
        if (isMounted) {
          setCities(data.map(c => ({ ...c, name: c.name || c.value })));
        }
      })
      .catch(err => {
        if (isMounted) setFetchError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [decodedCountry]);

  const handleBack = () => navigate(-1);

  if (displayError) {
    return (
      <StatusView 
        title={t('error')} 
        error={displayError || t('country_not_found')} 
        onBack={handleBack} 
        showRetry={!!fetchError}
        onRetry={() => window.location.reload()}
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
        if (selected) {
             navigate(`/map/${encodeURIComponent(decodedCountry)}/${encodeURIComponent(selected)}`);
        }
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