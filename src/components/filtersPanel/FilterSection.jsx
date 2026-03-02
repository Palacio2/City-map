import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './FilterSection.module.css';
import { FaBus, FaHospital, FaShoppingCart, FaSchool, FaTree, FaBolt, FaShieldAlt, FaChevronDown } from 'react-icons/fa';

const ICONS = {
  transport: <FaBus />, medicine: <FaHospital />, commerce: <FaShoppingCart />,
  education: <FaSchool />, social: <FaTree />, safety: <FaShieldAlt />, utilities: <FaBolt />
};

const FilterSection = memo(({ categoryKey, filters = [], values = {}, onChange }) => {
  const { t } = useTranslation(['filters', 'common']);
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = filters.filter(f => {
    const val = values[f.name];
    return val !== undefined && val !== null && val !== false && val !== '' && val !== 'any' && val !== '0' && val !== 0;
  }).length;

  const renderInput = (filter) => {
    const isSelect = ['airQuality', 'crimeLevel', 'transportFrequency'].includes(filter.name);
    const isNumericInput = ['propertyPricePerSqm', 'costPerSqm', 'transportAvgDistance', 'avgParkSize'].includes(filter.name);
    const isLowMedHigh = ['crimeLevel', 'transportFrequency'].includes(filter.name);

    if (isSelect) {
      return (
        <select
          name={filter.name}
          value={values[filter.name] || (isLowMedHigh ? 'any' : '')}
          onChange={(e) => onChange?.({ [filter.name]: e.target.value })}
          className={styles.select}
        >
          <option value={isLowMedHigh ? 'any' : ''}>{t('filter.options.any')}</option>
          {isLowMedHigh ? (
            <>
              <option value="low">{t('common:enums.low')}</option>
              <option value="medium">{t('common:enums.medium')}</option>
              <option value="high">{t('common:enums.high')}</option>
            </>
          ) : (
            <>
              <option value="good">{t('common:enums.good')}</option>
              <option value="medium">{t('common:enums.medium')}</option>
              <option value="bad">{t('common:enums.bad')}</option>
            </>
          )}
        </select>
      );
    }

    if (isNumericInput) {
      return (
        <input
          type="number"
          name={filter.name}
          value={values[filter.name] || ''}
          onChange={(e) => onChange?.({ [filter.name]: e.target.value })}
          className={styles.numberInput}
          placeholder="0"
          min="0"
        />
      );
    }

    return (
      <input
        type="checkbox"
        name={filter.name}
        checked={!!values[filter.name]}
        onChange={(e) => onChange?.({ [filter.name]: e.target.checked })}
      />
    );
  };

  return (
    <div className={`${styles.section} ${isOpen ? styles.open : ''}`}>
      <button className={styles.sectionHeader} onClick={() => setIsOpen(!isOpen)} type="button">
        <div className={styles.headerTitle}>
          <span className={styles.sectionIcon}>{ICONS[categoryKey]}</span>
          {t(`common:categories.${categoryKey}`)}
          {activeCount > 0 && <span className={styles.activeBadge}>{activeCount}</span>}
        </div>
        <FaChevronDown className={styles.chevron} />
      </button>

      <div className={styles.filterGroupWrapper} aria-expanded={isOpen}>
        <div className={styles.filterGroupInner}>
          <div className={styles.filterGroup}>
            {filters.map((filter) => {
              const isColumn = ['propertyPricePerSqm', 'costPerSqm', 'transportAvgDistance', 'avgParkSize', 'airQuality', 'crimeLevel', 'transportFrequency'].includes(filter.name);
              
              return (
                <label 
                  className={`${styles.filterItem} ${isColumn ? styles.columnItem : ''}`} 
                  key={filter.name}
                >
                  {isColumn ? (
                    <>
                      <span>{t(`common:fields.${filter.name}`)}</span>
                      {renderInput(filter)}
                    </>
                  ) : (
                    <>
                      {renderInput(filter)}
                      <span>{t(`common:fields.${filter.name}`)}</span>
                    </>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export default FilterSection;