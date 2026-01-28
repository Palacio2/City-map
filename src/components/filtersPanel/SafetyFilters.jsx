import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';
import { DISTRICT_CATEGORIES } from '@config/districtFields';

const SafetyFilters = memo(({ values = {}, onChange }) => {
  const { t } = useTranslation('filters');
  const config = DISTRICT_CATEGORIES.safety;

  const checkboxFilters = useMemo(() => {
    return config.fields
      .filter(f => f.key !== 'crimeLevel')
      .map(f => ({
        name: f.key
      }));
  }, [config]);

  const handleCrimeLevelChange = (event) => {
    onChange?.({ crimeLevel: event.target.value });
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        {t('filter.categories.safety.label')}
      </h3>
      <div className={styles.filterGroup}>
        <div className={styles.ratingFilter}>
          <span className={styles.ratingLabel}>
            {t('filter.categories.safety.crimeLevel')}
          </span>
          <select 
            className={styles.select}
            value={values.crimeLevel || 'any'}
            onChange={handleCrimeLevelChange}
          >
            <option value="any">{t('filter.options.any')}</option>
            <option value="low">{t('filter.options.low')}</option>
            <option value="medium">{t('filter.options.medium')}</option>
            <option value="high">{t('filter.options.high')}</option>
          </select>
        </div>
        
        {checkboxFilters.map((filter) => (
          <label className={styles.filterItem} key={filter.name}>
            <input 
              type="checkbox" 
              name={filter.name} 
              checked={values[filter.name] || false}
              onChange={handleCheckboxChange}
            />
            <span>
              {t(`filter.categories.safety.${filter.name}`)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
});

export default SafetyFilters;