import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const CommerceFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  const handleDensityChange = (event) => {
    const { value } = event.target;
    onChange?.({ density: value });
  };

  const handleMinStoresChange = (event) => {
    const { value } = event.target;
    onChange?.({ minGroceryStores: value ? parseInt(value) : undefined });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('commerce.title')}</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="groceries" 
            checked={values.groceries || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('commerce.groceries')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="construction" 
            checked={values.construction || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('commerce.construction')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="clothing" 
            checked={values.clothing || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('commerce.clothing')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="postOffices" 
            checked={values.postOffices || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('commerce.post')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="banks" 
            checked={values.banks || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('commerce.banks')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="beauty" 
            checked={values.beauty || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('commerce.beauty')}</span>
        </label>
        
        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('commerce.min_groceries')}</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={values.minGroceryStores || ''}
              onChange={handleMinStoresChange}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>{t('education.unit')}</span>
          </div>
        </div>

        <div className={styles.ratingFilter}>
          <span className={styles.ratingLabel}>{t('commerce.density')}</span>
          <select 
            className={styles.select}
            value={values.density || 'any'}
            onChange={handleDensityChange}
          >
            <option value="any">{t('options.any')}</option>
            <option value="high">{t('options.high')}</option>
            <option value="medium">{t('options.medium')}</option>
            <option value="low">{t('options.low')}</option>
          </select>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('commerce.min_rating')}</span>
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

export default CommerceFilters;