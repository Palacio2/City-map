import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const TransportFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  const handleDistanceChange = (event) => {
    const { value } = event.target;
    onChange?.({ maxDistance: value ? parseInt(value) : undefined });
  };

  const handleFrequencyChange = (event) => {
    const { value } = event.target;
    onChange?.({ frequency: value });
  };

  const preventInvalidInput = (e) => {
    if (['e', 'E', '+', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t('transport.title')}</h3>
      <div className={styles.filterGroup}>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="bus_stops" 
            checked={values.bus_stops || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('transport.bus_stops')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="tram_stops" 
            checked={values.tram_stops || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('transport.tram_stops')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="metro" 
            checked={values.metro || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('transport.metro')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="bike_lanes" 
            checked={values.bike_lanes || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('transport.bike_lanes')}</span>
        </label>
        <label className={styles.filterItem}>
          <input 
            type="checkbox" 
            name="parking" 
            checked={values.parking || false}
            onChange={handleCheckboxChange}
          />
          <span>{t('transport.parking')}</span>
        </label>

        <div className={styles.rangeFilter}>
          <span className={styles.rangeLabel}>{t('transport.distance')}</span>
          <div className={styles.rangeInputContainer}>
            <input 
              type="number" 
              placeholder={t('transport.placeholder_dist')}
              className={styles.rangeInput}
              value={values.maxDistance || ''}
              onChange={handleDistanceChange}
              onKeyDown={preventInvalidInput}
              min="0"
            />
            <span className={styles.rangeUnit}>{t('transport.unit_dist')}</span>
          </div>
        </div>
        
        <div className={styles.ratingFilter}>
          <span className={styles.ratingLabel}>{t('transport.frequency')}</span>
          <select 
            className={styles.select}
            value={values.frequency || 'any'}
            onChange={handleFrequencyChange}
          >
            <option value="any">{t('options.any')}</option>
            <option value="high">{t('options.high')}</option>
            <option value="medium">{t('options.medium')}</option>
            <option value="low">{t('options.low')}</option>
          </select>
        </div>
      </div>
    </div>
  );
});

export default TransportFilters;