import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SelectForm from '@ui/selectForm/SelectForm';
// ❗ ІМПОРТ НОВОЇ ФУНКЦІЇ ❗
import { fetchCitiesByCountry, createSelectOptions } from '@api/cityCountrySelect';
import styles from '@ui/selectForm/SelectForm.module.css';

// ❗ УМОВНА ВИНОСКА КОМПОНЕНТУ СТАТУСУ ДЛЯ ЗМЕНШЕННЯ КОДУ (якби ви його створили) ❗
const StatusView = ({ title = "Помилка", error, onBack, showRetry = false }) => (
  <div className={styles.errorContainer}>
    <h1>{title}</h1>
    <p>{error}</p>
    {showRetry && (
      <button 
        onClick={() => window.location.reload()}
        className={styles.retryButton}
      >
        Спробувати знову
      </button>
    )}
    <button 
      onClick={onBack}
      className={styles.backButton}
    >
      ← Назад
    </button>
  </div>
);

export default function CitySelect() {
  const { country } = useParams();
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function getCities() {
      if (!country) {
        setError('Країна не вказана');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const decodedCountry = decodeURIComponent(country);
        const data = await fetchCitiesByCountry(decodedCountry);
        
        setCities(data.map(city => ({
          ...city,
          name: city.name || city.value,
          value: city.value
        })));
        
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    getCities();
  }, [country]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCity) {
      navigate(`/map/${encodeURIComponent(country)}/${encodeURIComponent(selectedCity)}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (error) {
    return <StatusView title="Помилка завантаження" error={error} onBack={handleBack} showRetry={true} />;
  }

  if (!country) {
    return <StatusView title="Помилка" error="Країна не знайдена" onBack={handleBack} />;
  }

  // ❗ ВИКОРИСТАННЯ УНІВЕРСАЛЬНОЇ ФУНКЦІЇ ❗
  const allOptions = createSelectOptions(cities);
  
  const isCityDisabled = cities.find(c => c.value === selectedCity)?.available === false;
  const hasCities = cities.length > 0;

  return (
    <SelectForm
      title={`Оберіть місто у ${decodeURIComponent(country)}`}
      options={allOptions}
      selectedValue={selectedCity}
      onValueChange={setSelectedCity}
      onSubmit={handleSubmit}
      onBack={handleBack}
      showBackButton={true}
      submitText="Перейти на мапу →"
      disabled={isCityDisabled || isLoading || !hasCities}
      disabledMessage={
        // ❗ СПРОЩЕННЯ disabledMessage ❗
        !hasCities ? "Міста не знайдено" : "Місто недоступне"
      }
      isLoading={isLoading}
      isSearchable={true} 
    />
  );
}