import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const CommerceFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
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
      </div>
    </div>
  );
});

export default CommerceFilters;