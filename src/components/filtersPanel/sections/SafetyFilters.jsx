import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const SafetyFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCrimeLevelChange = (event) => {
    const { value } = event.target;
    onChange?.({ crimeLevel: value });
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('safety.title')}</h3>
      <div className={styles.filterGroup}>
        <div className={styles.ratingFilter}>
          <span className={styles.ratingLabel}>{t('safety.crime_level')}</span>
          <select 
            className={styles.select}
            value={values.crimeLevel || 'any'}
            onChange={handleCrimeLevelChange}
          >
            <option value="any">{t('safety.level_any')}</option>
            <option value="low">{t('safety.level_low')}</option>
            <option value="medium">{t('safety.level_medium')}</option>
            <option value="high">{t('safety.level_high')}</option>
          </select>
        </div>
        
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="police" 
            checked={values.police || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('safety.police')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="cctv" 
            checked={values.cctv || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('safety.cctv')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="lighting" 
            checked={values.lighting || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('safety.lighting')}</span>
        </label>
      </div>
    </div>
  );
});

export default SafetyFilters;