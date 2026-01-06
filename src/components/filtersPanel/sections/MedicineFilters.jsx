import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const MedicineFilters = memo(({ values = {}, onChange }) => {
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

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('medicine.min_hospitals')}</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={values.minHospitals || ''}
              onChange={(e) => handleMinChange(e, 'minHospitals')}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>{t('education.unit')}</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('medicine.min_clinics')}</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={values.minClinics || ''}
              onChange={(e) => handleMinChange(e, 'minClinics')}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>{t('education.unit')}</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('medicine.min_rating')}</span>
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

export default MedicineFilters;