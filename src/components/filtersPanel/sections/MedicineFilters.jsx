import React from 'react';
import styles from './Filters.module.css';

export default function MedicineFilters({ filters = {}, onFiltersChange }) {
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onFiltersChange?.({
      medicine: {
        ...filters.medicine,
        [name]: checked
      }
    });
  };

  const handleMinHospitalsChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      medicine: {
        ...filters.medicine,
        minHospitals: value ? parseInt(value) : undefined
      }
    });
  };

  const handleMinClinicsChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      medicine: {
        ...filters.medicine,
        minClinics: value ? parseInt(value) : undefined
      }
    });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>🏥 Медицина</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="hospitals" 
            checked={filters.medicine?.hospitals || false}
            onChange={handleCheckboxChange}
          />
          <span>Лікарні</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="clinics" 
            checked={filters.medicine?.clinics || false}
            onChange={handleCheckboxChange}
          />
          <span>Поліклініки</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="pharmacies" 
            checked={filters.medicine?.pharmacies || false}
            onChange={handleCheckboxChange}
          />
          <span>Аптеки</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="emergency" 
            checked={filters.medicine?.emergency || false}
            onChange={handleCheckboxChange}
          />
          <span>Швидка допомога</span>
        </label>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. кількість лікарень:</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={filters.medicine?.minHospitals || ''}
              onChange={handleMinHospitalsChange}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>шт.</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. кількість поліклінік:</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={filters.medicine?.minClinics || ''}
              onChange={handleMinClinicsChange}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>шт.</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. рейтинг медицини:</span>
          <div className={styles.rangeContainer}>
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="0.5"
              value={filters.medicine?.minRating || 0}
              onChange={(e) => onFiltersChange?.({
                medicine: {
                  ...filters.medicine,
                  minRating: parseFloat(e.target.value)
                }
              })}
              className={styles.rangeSlider}
            />
            <span className={styles.rangeValue}>
              {filters.medicine?.minRating || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}