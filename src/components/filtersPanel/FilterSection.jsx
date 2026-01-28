import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Filters.module.css';
import { FaBus, FaHospital, FaShoppingCart, FaSchool, FaTree, FaShieldAlt } from 'react-icons/fa';

const ICONS = {
  transport: <FaBus />,
  medicine: <FaHospital />,
  commerce: <FaShoppingCart />,
  education: <FaSchool />,
  social: <FaTree />,
  safety: <FaShieldAlt />
};

const FilterSection = memo(({ categoryKey, filters = [], values = {}, onChange }) => {
  const { t } = useTranslation('filters');

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onChange?.({ [name]: checked });
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.sectionIcon}>{ICONS[categoryKey]}</span>
        {t(`filter.categories.${categoryKey}.label`)}
      </h3>

      <div className={styles.filterGroup}>
        {filters.map((filter) => (
          <label className={styles.filterItem} key={filter.name}>
            <input
              type="checkbox"
              name={filter.name}
              checked={values[filter.name] || false}
              onChange={handleCheckboxChange}
            />
            <span>{t(`filter.categories.${categoryKey}.${filter.name}`)}</span>
          </label>
        ))}
      </div>
    </div>
  );
});

export default FilterSection;
