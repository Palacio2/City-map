import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectForm from '@ui/selectForm/SelectForm';
// ❗ ІМПОРТ НОВОЇ ФУНКЦІЇ ❗
import { fetchCountries, createSelectOptions } from '@api/cityCountrySelect'; 
import styles from '@ui/selectForm/SelectForm.module.css';

// ❗ УМОВНА ВИНОСКА КОМПОНЕНТУ СТАТУСУ ДЛЯ ЗМЕНШЕННЯ КОДУ (якби ви його створили) ❗
const StatusView = ({ error, onBack }) => (
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
      onClick={onBack}
      className={styles.backButton}
    >
      ← Назад
    </button>
  </div>
);


export default function CountrySelect() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function getCountries() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchCountries();
        setCountries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        setCountries([]); 
      } finally {
        setIsLoading(false);
      }
    }
    getCountries();
  }, []); 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCountry) {
      navigate(`/city/${encodeURIComponent(selectedCountry)}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (error) {
    return <StatusView error={error} onBack={handleBack} />;
  }

  // ❗ ВИКОРИСТАННЯ УНІВЕРСАЛЬНОЇ ФУНКЦІЇ ❗
  const allOptions = createSelectOptions(countries);
  
  const isCountryDisabled = countries.find(c => c.value === selectedCountry)?.available === false;

  return (
    <SelectForm
      title="Оберіть країну"
      subtitle="Доступні для бронювання напрямки"
      options={allOptions}
      selectedValue={selectedCountry}
      onValueChange={setSelectedCountry}
      onSubmit={handleSubmit}
      onBack={handleBack}
      showBackButton={true}
      submitText="Продовжити"
      disabled={isCountryDisabled || isLoading}
      disabledMessage={isCountryDisabled ? "Оберіть іншу країну" : "Завантаження..."}
      isLoading={isLoading}
      isSearchable={false} // За замовчуванням
    />
  );
}