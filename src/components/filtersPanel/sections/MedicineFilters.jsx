import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const MedicineFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('medicine.title')}</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="hospitals" 
            checked={values.hospitals || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('medicine.hospitals')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="clinics" 
            checked={values.clinics || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('medicine.clinics')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="pharmacies" 
            checked={values.pharmacies || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('medicine.pharmacies')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="emergency" 
            checked={values.emergency || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('medicine.emergency')}</span>
        </label>
      </div>
    </div>
  );
});

export default MedicineFilters;