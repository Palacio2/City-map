import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const SocialFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  const handleMinChange = (event, field) => {
    const { value } = event.target;
    onChange?.({ [field]: value ? parseInt(value) : undefined });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('social.title')}</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="parks" 
            checked={values.parks || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.parks')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="cafes" 
            checked={values.cafes || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.cafes')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="playgrounds" 
            checked={values.playgrounds || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.playgrounds')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="sports" 
            checked={values.sports || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.sports')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="libraries" 
            checked={values.libraries || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.libraries')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="cinemas" 
            checked={values.cinemas || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.cinemas')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="theaters" 
            checked={values.theaters || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.theaters')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="museums" 
            checked={values.museums || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('social.museums')}</span>
        </label>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('social.min_parks')}</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={values.minParks || ''}
              onChange={(e) => handleMinChange(e, 'minParks')}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>{t('education.unit')}</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('social.min_park_size')}</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={values.minParkSize || ''}
              onChange={(e) => handleMinChange(e, 'minParkSize')}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>{t('social.unit_size')}</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('social.min_rating')}</span>
          <div className={styles.rangeContainer}>
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="0.5"
              value={values.minRating || 0}
              onChange={(e) => onChange?.({ minRating: parseFloat(e.target.value) })}
              className={styles.rangeSlider}
            />
            <span className={styles.rangeValue}>
              {values.minRating || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SocialFilters;