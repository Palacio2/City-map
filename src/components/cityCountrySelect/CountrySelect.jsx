import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectForm from '@ui/selectForm/SelectForm';
import { fetchCountries } from '@api/cityCountrySelect';
import styles from '@ui/selectForm/SelectForm.module.css';

export default function CountrySelect() {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
  console.log('useEffect called - this should appear only once');
  async function getCountries() {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching countries...');
      
      const data = await fetchCountries();
      console.log('Countries data received:', data);
      
      setCountries(data);
    } catch (err) {
      console.error('Error fetching countries:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }
  getCountries();
}, []); // <- порожній масив залежностей

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedCountry) {
      console.log('Selected country:', selectedCountry);
      navigate(`/city/${encodeURIComponent(selectedCountry)}`);
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

  const availableCountries = countries.filter(country => country.available);
  const unavailableCountries = countries.filter(country => !country.available);

  const allOptions = [
    ...availableCountries.map(country => ({
      ...country,
      disabled: false
    })),
    ...unavailableCountries.map(country => ({
      ...country,
      disabled: true
    }))
  ];

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
    />
  );
}