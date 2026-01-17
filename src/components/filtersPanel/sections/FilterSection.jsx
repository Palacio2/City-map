import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';

const FilterSection = memo(({ title, filters = [], values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{t(title)}</h3>
      <div className={styles.filterGroup}>
        {filters.map((filter) => (
          <label className={styles.filterItem} key={filter.name}>
            <input
              type="checkbox"
              name={filter.name}
              checked={values[filter.name] || false}
              onChange={handleCheckboxChange}
            />
            <span>{t(filter.label)}</span>
          </label>
        ))}
      </div>
    </div>
  );
});

export default FilterSection;
