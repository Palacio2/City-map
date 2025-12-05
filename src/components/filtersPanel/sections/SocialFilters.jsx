import React from 'react';
import styles from './Filters.module.css';

export default function SocialFilters({ filters = {}, onFiltersChange }) {
  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onFiltersChange?.({
      social: {
        ...filters.social,
        [name]: checked
      }
    });
  };

  const handleMinParksChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      social: {
        ...filters.social,
        minParks: value ? parseInt(value) : undefined
      }
    });
  };

  const handleParkSizeChange = (event) => {
    const { value } = event.target;
    onFiltersChange?.({
      social: {
        ...filters.social,
        minParkSize: value ? parseInt(value) : undefined
      }
    });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>🌳 Соціальна інфраструктура</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="parks" 
            checked={filters.social?.parks || false}
            onChange={handleCheckboxChange}
          />
          <span>Парки та сквери</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="cafes" 
            checked={filters.social?.cafes || false}
            onChange={handleCheckboxChange}
          />
          <span>Кафе та ресторани</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="playgrounds" 
            checked={filters.social?.playgrounds || false}
            onChange={handleCheckboxChange}
          />
          <span>Дитячі майданчики</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="sports" 
            checked={filters.social?.sports || false}
            onChange={handleCheckboxChange}
          />
          <span>Спортивні майданчики</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="libraries" 
            checked={filters.social?.libraries || false}
            onChange={handleCheckboxChange}
          />
          <span>Бібліотеки</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="cinemas" 
            checked={filters.social?.cinemas || false}
            onChange={handleCheckboxChange}
          />
          <span>Кінотеатри</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="theaters" 
            checked={filters.social?.theaters || false}
            onChange={handleCheckboxChange}
          />
          <span>Театри</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="museums" 
            checked={filters.social?.museums || false}
            onChange={handleCheckboxChange}
          />
          <span>Музеї</span>
        </label>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. кількість парків:</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={filters.social?.minParks || ''}
              onChange={handleMinParksChange}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>шт.</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. розмір парків:</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder="0"
              value={filters.social?.minParkSize || ''}
              onChange={handleParkSizeChange}
              className={styles.rangeInput}
              min="0"
            />
            <span className={styles.rangeUnit}>м²</span>
          </div>
        </div>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>Мін. рейтинг соціальної інфраструктури:</span>
          <div className={styles.rangeContainer}>
            <input 
              type="range" 
              min="0" 
              max="10" 
              step="0.5"
              value={filters.social?.minRating || 0}
              onChange={(e) => onFiltersChange?.({
                social: {
                  ...filters.social,
                  minRating: parseFloat(e.target.value)
                }
              })}
              className={styles.rangeSlider}
            />
            <span className={styles.rangeValue}>
              {filters.social?.minRating || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}