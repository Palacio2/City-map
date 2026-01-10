import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const EducationFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  const handleMinChange = (event, field) => {
    const { value } = event.target;
    onChange?.({ [field]: value ? parseInt(value) : undefined });
  };

  const preventInvalidInput = (e) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('education.title')}</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="kindergartens" 
            checked={values.kindergartens || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('education.kindergartens')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="schools" 
            checked={values.schools || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('education.schools')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="universities" 
            checked={values.universities || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('education.universities')}</span>
        </label>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('education.min_kindergartens')}</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={values.minKindergartens || ''}
              onChange={(e) => handleMinChange(e, 'minKindergartens')}
              onKeyDown={preventInvalidInput}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>{t('education.unit')}</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('education.min_schools')}</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={values.minSchools || ''}
              onChange={(e) => handleMinChange(e, 'minSchools')}
              onKeyDown={preventInvalidInput}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>{t('education.unit')}</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('education.min_universities')}</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={values.minUniversities || ''}
              onChange={(e) => handleMinChange(e, 'minUniversities')}
              onKeyDown={preventInvalidInput}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>{t('education.unit')}</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('education.min_rating')}</span>
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

export default EducationFilters;