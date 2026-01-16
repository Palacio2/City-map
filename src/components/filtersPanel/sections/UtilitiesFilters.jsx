import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const UtilitiesFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
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
      </div>
    </div>
  );
});

export default UtilitiesFilters;