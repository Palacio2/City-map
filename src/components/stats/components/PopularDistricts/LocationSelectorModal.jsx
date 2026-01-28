import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaMapMarkerAlt, FaGlobe, FaCity, FaMap, FaCheck } from 'react-icons/fa';
import styles from './LocationSelectorModal.module.css';
import { fetchCountries, fetchCitiesByCountry } from '@api/cityCountrySelect'; 
import { fetchDistrictsWithFilters } from '@api/districtsApi';

// 👇 Додано props: maxSelection (максимум) та currentCount (скільки вже є на сторінці)
export default function LocationSelectorModal({ 
  onClose, 
  onSubmit, 
  includeDistrict = false, 
  trackedLocations = [],
  maxSelection = null, // Якщо null - ліміту немає (для інших сторінок)
  currentCount = 0     // Скільки вже вибрано в батьківському компоненті
}) {
  const { t } = useTranslation('stats');
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  
  const [selectedDistricts, setSelectedDistricts] = useState([]); 
  
  const [loading, setLoading] = useState({ countries: true, cities: false, districts: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchCountries().then(data => {
      if (isMounted) {
        setCountries(Array.isArray(data) ? data.map(i => i.value) : []);
        setLoading(p => ({ ...p, countries: false }));
      }
    }).catch(() => {
      if (isMounted) {
        setError(t('error_unknown')); 
        setLoading(p => ({ ...p, countries: false }));
      }
    });
    return () => { isMounted = false; };
  }, [t]);

  const handleCountryChange = async (e) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setSelectedCity(''); setSelectedDistricts([]);
    setCities([]); setDistricts([]);
    if (!country) return;

    setLoading(p => ({ ...p, cities: true }));
    try {
      const data = await fetchCitiesByCountry(country);
      setCities(Array.isArray(data) ? data.map(i => i.value) : []);
    } catch { /* silent */ }
    finally { setLoading(p => ({ ...p, cities: false })); }
  };

  const handleCityChange = async (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setSelectedDistricts([]);
    setDistricts([]);

    if (includeDistrict && city && selectedCountry) {
      setLoading(p => ({ ...p, districts: true }));
      try {
        const allDistricts = await fetchDistrictsWithFilters(selectedCountry, city);
        if (Array.isArray(allDistricts)) {
            const filtered = allDistricts.filter(d => {
                const name = d.name || d;
                return !trackedLocations.some(t => t.country === selectedCountry && t.city === city && t.district === name);
            });
            setDistricts(filtered);
        }
      } catch { /* silent */ }
      finally { setLoading(p => ({ ...p, districts: false })); }
    }
  };

  const toggleDistrict = (district) => {
    const districtName = district.name || district;
    
    setSelectedDistricts(prev => {
      const exists = prev.find(d => (d.name || d) === districtName);
      
      if (exists) {
        // Якщо район вже вибраний - видаляємо його (це завжди дозволено)
        return prev.filter(d => (d.name || d) !== districtName);
      } else {
        // 👇 ЛОГІКА ОБМЕЖЕННЯ:
        // Якщо встановлено ліміт, перевіряємо суму (вже на сторінці + вже вибрані в модалці)
        if (maxSelection !== null) {
          const totalSelected = currentCount + prev.length;
          if (totalSelected >= maxSelection) {
            // Можна додати alert або toast notification
            alert(t('comparison.limit_reached', { max: maxSelection, defaultValue: `Максимум ${maxSelection} районів` }));
            return prev; // Не додаємо нічого
          }
        }
        return [...prev, district];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (includeDistrict) {
        if (selectedCountry && selectedCity && selectedDistricts.length > 0) {
            onSubmit(selectedCountry, selectedCity, selectedDistricts);
            onClose();
        }
    } else {
        if (selectedCountry && selectedCity) {
            onSubmit(selectedCountry, selectedCity);
            onClose();
        }
    }
  };

  const isFormValid = includeDistrict 
    ? (selectedCountry && selectedCity && selectedDistricts.length > 0) 
    : (selectedCountry && selectedCity);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}><FaTimes /></button>
        <div className={styles.modalHeader}>
          <div className={styles.iconCircle}><FaMapMarkerAlt /></div>
          <h3>{includeDistrict ? t('add_districts_title') : t('select_location')}</h3>
          <p className={styles.modalSubtitle}>
            {includeDistrict 
              ? t('select_multiple_districts_subtitle') 
              : t('select_city_subtitle')}
            
            {/* 👇 Показуємо лічильник, якщо є ліміт */}
            {maxSelection && (
               <span style={{ display: 'block', marginTop: '4px', fontWeight: 'bold', color: 'var(--color-purple)' }}>
                 ({t('selected_count', {defaultValue: 'Обрано'})}: {currentCount + selectedDistricts.length} / {maxSelection})
               </span>
            )}
          </p>
        </div>
        {error ? <div className={styles.errorMsg}>{error}</div> : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label><FaGlobe className={styles.inputIcon}/> {t('country')}</label>
              <div className={styles.selectWrapper}>
                <select value={selectedCountry} onChange={handleCountryChange} disabled={loading.countries} className={styles.selectInput} required>
                  <option value="">{loading.countries ? t('loading_placeholder') : t('select_country_placeholder')}</option>
                  {countries.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>
            </div>
            <div className={styles.inputGroup}>
              <label><FaCity className={styles.inputIcon}/> {t('city')}</label>
              <div className={styles.selectWrapper}>
                <select value={selectedCity} onChange={handleCityChange} disabled={!selectedCountry || loading.cities} className={styles.selectInput} required>
                  <option value="">{!selectedCountry ? t('select_country_first') : loading.cities ? t('loading_placeholder') : t('select_city_placeholder')}</option>
                  {cities.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <span className={styles.selectArrow}>▼</span>
              </div>
            </div>
            
            {includeDistrict && (
                <div className={styles.inputGroup}>
                  <label><FaMap className={styles.inputIcon}/> {t('districts_label')} {districts.length > 0 && `(${districts.length})`}</label>
                  
                  {!selectedCity ? (
                    <div className={styles.emptyMessage}>{t('select_city_first')}</div>
                  ) : loading.districts ? (
                    <div className={styles.emptyMessage}>{t('loading_districts')}</div>
                  ) : districts.length === 0 ? (
                    <div className={styles.emptyMessage}>{t('all_districts_added')}</div>
                  ) : (
                    <div className={styles.districtsGrid}>
                      {districts.map((d, idx) => {
                        const dName = d.name || d;
                        const isSelected = selectedDistricts.some(sd => (sd.name || sd) === dName);
                        // Опціонально: можна блокувати стиль, якщо ліміт досягнуто і елемент не вибраний
                        const isLimitReached = maxSelection !== null && (currentCount + selectedDistricts.length >= maxSelection);
                        const isDisabled = isLimitReached && !isSelected;

                        return (
                          <div 
                            key={idx} 
                            className={`${styles.districtChip} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
                            style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            onClick={() => toggleDistrict(d)}
                          >
                            {dName}
                            {isSelected && <FaCheck className={styles.checkIcon} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
            )}

            <button type="submit" className={styles.submitButton} disabled={!isFormValid || loading.cities || loading.districts}>
              {includeDistrict 
                ? `${t('add_selected_button')} (+${selectedDistricts.length})` 
                : t('show_popular')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}