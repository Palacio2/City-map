import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaMapMarkerAlt, FaGlobe, FaCity, FaMap } from 'react-icons/fa';
import styles from './LocationSelectorModal.module.css';
import { fetchCountries, fetchCitiesByCountry } from '@api/cityCountrySelect'; 
import { fetchDistrictsWithFilters } from '@api/districtsApi';

export default function LocationSelectorModal({ 
  onClose, 
  onSubmit, 
  includeDistrict = false, 
  trackedLocations = [],
  maxSelection = null,
  currentCount = 0 
}) {
  const { t } = useTranslation(['stats', 'common']);
  
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState([]); 
  
  const [loading, setLoading] = useState({ countries: true, cities: false, districts: false });
  const [error, setError] = useState(null);
  
  const districtsCache = useRef({});

  // 1. Завантаження країн
  useEffect(() => {
    let isMounted = true;
    fetchCountries()
      .then(data => {
        if (isMounted) {
          setCountries(Array.isArray(data) ? data.map(i => i.value || i) : []);
          setLoading(p => ({ ...p, countries: false }));
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(t('common:general.error')); 
          setLoading(p => ({ ...p, countries: false }));
        }
      });
    return () => { isMounted = false; };
  }, [t]);

  // 2. Вибір країни -> завантаження міст
  const handleCountryChange = async (e) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setSelectedCity(''); 
    setCities([]); 
    setDistricts([]);
    setSelectedDistricts([]);
    
    if (!country) return;

    setLoading(p => ({ ...p, cities: true }));
    try {
      const data = await fetchCitiesByCountry(country);
      setCities(Array.isArray(data) ? data.map(i => i.value || i) : []);
    } catch (err) { 
      console.error(err);
    } finally { 
      setLoading(p => ({ ...p, cities: false })); 
    }
  };

  // 3. Вибір міста -> завантаження районів
  const handleCityChange = async (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setDistricts([]); 

    if (includeDistrict && city && selectedCountry) {
      setLoading(p => ({ ...p, districts: true }));
      const cacheKey = `${selectedCountry}_${city}`;
      
      if (districtsCache.current[cacheKey]) {
        setDistricts(districtsCache.current[cacheKey]);
        setLoading(p => ({ ...p, districts: false }));
        return;
      }

      try {
        const response = await fetchDistrictsWithFilters(selectedCountry, city, false);
        const allDistricts = Array.isArray(response) ? response : (response?.districts || response?.data || []);
        
        districtsCache.current[cacheKey] = allDistricts;
        setDistricts(allDistricts);
      } catch (err) { 
        console.error(err);
      } finally { 
        setLoading(p => ({ ...p, districts: false })); 
      }
    }
  };

  // 4. Фільтрація районів (ховаємо ті, що вже обрані або відслідковуються)
  const availableDistricts = useMemo(() => {
    return districts.filter(d => {
      const name = d.name || d;
      const isSelectedLocally = selectedDistricts.some(sd => sd.name === name && sd.city === selectedCity);
      const isAlreadyTracked = trackedLocations.some(t => t.country === selectedCountry && t.city === selectedCity && (t.district === name || t.name === name));
      
      return !isSelectedLocally && !isAlreadyTracked;
    });
  }, [districts, selectedDistricts, trackedLocations, selectedCountry, selectedCity]);

  // 5. Додавання району
  const addDistrict = (districtData) => {
    if (maxSelection !== null && (currentCount + selectedDistricts.length >= maxSelection)) {
      alert(t('comparison.limit_reached', { max: maxSelection }));
      return;
    }

    const newDistrict = {
      ...(typeof districtData === 'object' ? districtData : {}), 
      name: districtData.name || districtData,
      city: selectedCity,
      country: selectedCountry
    };

    setSelectedDistricts(prev => [...prev, newDistrict]);
  };

  // 6. Видалення району
  const removeSelectedDistrict = (districtToRemove) => {
      setSelectedDistricts(prev => prev.filter(d => 
          !(d.name === districtToRemove.name && d.city === districtToRemove.city)
      ));
  };

  // 7. Відправка форми
  const handleSubmit = (e) => {
    e.preventDefault();
    if (includeDistrict && selectedDistricts.length > 0) {
      onSubmit(selectedDistricts); 
    } else if (!includeDistrict && selectedCountry && selectedCity) {
      onSubmit(selectedCountry, selectedCity);
    }
  };

  const isFormValid = includeDistrict ? selectedDistricts.length > 0 : (selectedCountry && selectedCity);

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}><FaTimes /></button>
        
        <div className={styles.modalHeader}>
          <div className={styles.iconCircle}><FaMapMarkerAlt /></div>
          <h3>{includeDistrict ? t('stats:add_districts_title') : t('stats:select_location')}</h3>
          <p className={styles.modalSubtitle}>
            {includeDistrict ? t('stats:select_multiple_districts_subtitle') : t('stats:select_city_subtitle')}
          </p>
        </div>

        {error ? <div className={styles.errorMsg}>{error}</div> : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label><FaGlobe className={styles.inputIcon}/> {t('stats:country')}</label>
              <div className={styles.selectWrapper}>
                <select value={selectedCountry} onChange={handleCountryChange} disabled={loading.countries} className={styles.selectInput} required={!includeDistrict}>
                  <option value="">{loading.countries ? t('common:general.loading') : t('stats:select_country_placeholder')}</option>
                  {countries.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>
            </div>
            
            <div className={styles.inputGroup}>
              <label><FaCity className={styles.inputIcon}/> {t('stats:city')}</label>
              <div className={styles.selectWrapper}>
                <select value={selectedCity} onChange={handleCityChange} disabled={!selectedCountry || loading.cities} className={styles.selectInput} required={!includeDistrict}>
                  <option value="">{!selectedCountry ? t('stats:select_country_first') : loading.cities ? t('common:general.loading') : t('stats:select_city_placeholder')}</option>
                  {cities.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>
            </div>
            
            {includeDistrict && (
                <>
                    <div className={styles.inputGroup}>
                      <label><FaMap className={styles.inputIcon}/> {t('stats:districts_label')}</label>
                      
                      {!selectedCity ? (
                          <div className={styles.emptyMessage}>{t('stats:select_city_first')}</div>
                      ) : loading.districts ? (
                          <div className={styles.emptyMessage}>{t('common:general.loading')}</div>
                      ) : availableDistricts.length === 0 ? (
                          <div className={styles.emptyMessage}>{t('stats:all_districts_added') || "Всі доступні райони додано"}</div>
                      ) : (
                          <div className={styles.districtsGrid}>
                            {availableDistricts.map((d, idx) => (
                              <div key={idx} className={styles.districtChip} onClick={() => addDistrict(d)}>
                                  {d.name || d}
                              </div>
                            ))}
                          </div>
                      )}
                    </div>

                    {selectedDistricts.length > 0 && (
                        <div className={styles.selectedSummary}>
                            <h4>{t('stats:selected_districts')} ({selectedDistricts.length})</h4>
                            <div className={styles.summaryChips}>
                                {selectedDistricts.map((d, idx) => (
                                    <div key={idx} className={styles.summaryChip}>
                                        <span>{d.name} <small>({d.city})</small></span>
                                        <button type="button" onClick={() => removeSelectedDistrict(d)}>
                                            <FaTimes />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <button type="submit" className={styles.submitButton} disabled={!isFormValid || loading.cities || loading.districts}>
              {includeDistrict 
                ? `${t('stats:add_selected_button')} (+${selectedDistricts.length})` 
                : t('stats:show_popular')}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}