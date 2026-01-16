import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const TransportFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
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
      </div>
    </div>
  );
});

export default TransportFilters;