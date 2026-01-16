import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const EducationFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
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
      </div>
    </div>
  );
});

export default EducationFilters;