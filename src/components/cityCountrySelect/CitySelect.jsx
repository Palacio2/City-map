import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SelectForm from '@ui/selectForm/SelectForm';
import { fetchCitiesByCountry } from '@api/cityCountrySelect';
import styles from '@ui/selectForm/SelectForm.module.css';

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
          // Припускаємо, що об'єкти міст мають поля 'value' та 'name'
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
    return (
      <div className={styles.errorContainer}>
        <h1>Помилка завантаження</h1>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Спробувати знову
        </button>
        <button 
          onClick={handleBack}
          className={styles.backButton}
        >
          ← Назад
        </button>
      </div>
    );
  }

  if (!country) {
    return (
      <div className={styles.errorContainer}>
        <h1>Помилка</h1>
        <p>Країна не знайдена</p>
        <button 
          onClick={handleBack}
          className={styles.backButton}
        >
          ← Назад
        </button>
      </div>
    );
  }

  const availableCities = cities.filter(city => city.available);
  const unavailableCities = cities.filter(city => !city.available);

  const allOptions = [
    ...availableCities.map(city => ({
      label: city.name,
      value: city.value,
      disabled: false
    })),
    ...unavailableCities.map(city => ({
      label: city.name,
      value: city.value,
      disabled: true
    }))
  ];

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
        isLoading ? "Завантаження..." :
        !hasCities ? "Міста не знайдено" :
        isCityDisabled ? "Місто недоступне" : ""
      }
      isLoading={isLoading}
      // ❗ ВМИКАЄМО РЕЖИМ ПОШУКУ ❗
      isSearchable={true} 
    />
  );
}