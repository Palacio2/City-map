import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const UtilitiesFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  const handleQualityChange = (event) => {
    const { value } = event.target;
    onChange?.({ quality: value });
  };

  const handleCostChange = (event, field) => {
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
      <h3 className={styles.sectionTitle}>{t('utilities.title')}</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="water" 
            checked={values.water || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('utilities.water')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="heating" 
            checked={values.heating || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('utilities.heating')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="electricity" 
            checked={values.electricity || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('utilities.electricity')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="gas" 
            checked={values.gas || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('utilities.gas')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="waste" 
            checked={values.waste || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('utilities.waste')}</span>
        </label>
        
        <div className={styles.ratingFilter}>
          <span className={styles.ratingLabel}>{t('utilities.quality')}</span>
          <select 
            className={styles.select}
            value={values.quality || 'any'}
            onChange={handleQualityChange}
          >
            <option value="any">{t('options.any')}</option>
            <option value="good">{t('options.good')}</option>
            <option value="average">{t('options.average')}</option>
            <option value="poor">{t('options.poor')}</option>
          </select>
        </div>
        
        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('utilities.cost_label')}</span>
          <div className={styles.doubleRangeContainer}>
            <div className={styles.doubleRangeInputs}>
              <input 
                type="number" 
                placeholder={t('utilities.from')}
                value={values.minCost || ''}
                onChange={(e) => handleCostChange(e, 'minCost')}
                onKeyDown={preventInvalidInput}
                className={styles.doubleRangeInput}
                min="0"
              />
              <span className={styles.doubleRangeSeparator}>-</span>
              <input 
                type="number" 
                placeholder={t('utilities.to')}
                value={values.maxCost || ''}
                onChange={(e) => handleCostChange(e, 'maxCost')}
                onKeyDown={preventInvalidInput}
                className={styles.doubleRangeInput}
                min="0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default UtilitiesFilters;