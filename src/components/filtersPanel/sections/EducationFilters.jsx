import React from 'react';
import styles from './Filters.module.css';

export default function EducationFilters({ filters = {}, onFiltersChange }) {
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onFiltersChange?.({
      education: {
        ...filters.education,
        [name]: checked
      }
    });
  };

  const handleMinSchoolsChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      education: {
        ...filters.education,
        minSchools: value ? parseInt(value) : undefined
      }
    });
  };

  const handleMinKindergartensChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      education: {
        ...filters.education,
        minKindergartens: value ? parseInt(value) : undefined
      }
    });
  };

  const handleMinUniversitiesChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      education: {
        ...filters.education,
        minUniversities: value ? parseInt(value) : undefined
      }
    });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>🎓 Освіта</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="kindergartens" 
            checked={filters.education?.kindergartens || false}
            onChange={handleCheckboxChange}
          />
          <span>Дитячі садки</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="schools" 
            checked={filters.education?.schools || false}
            onChange={handleCheckboxChange}
          />
          <span>Школи</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="universities" 
            checked={filters.education?.universities || false}
            onChange={handleCheckboxChange}
          />
          <span>Університети</span>
        </label>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. кількість садків:</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={filters.education?.minKindergartens || ''}
              onChange={handleMinKindergartensChange}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>шт.</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. кількість шкіл:</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={filters.education?.minSchools || ''}
              onChange={handleMinSchoolsChange}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>шт.</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. кількість університетів:</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={filters.education?.minUniversities || ''}
              onChange={handleMinUniversitiesChange}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>шт.</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. рейтинг освіти:</span>
          <div className={styles.rangeContainer}>
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="0.5"
              value={filters.education?.minRating || 0}
              onChange={(e) => onFiltersChange?.({
                education: {
                  ...filters.education,
                  minRating: parseFloat(e.target.value)
                }
              })}
              className={styles.rangeSlider}
            />
            <span className={styles.rangeValue}>
              {filters.education?.minRating || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}