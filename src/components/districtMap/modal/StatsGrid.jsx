import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './styles/cards.module.css';
import StatCard from './StatCard';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { 
  formatNumber, 
  formatPrice, 
  formatBoolean, 
  getCrimeLevelText, 
  getCrimeLevelClass 
} from '@utils/formatters';

export default function StatsGrid({ filterData, currencyInfo, isFree, isRealtor }) {
  const { t } = useTranslation(['districts', 'common']);

  const formatValue = (value, type, fieldKey) => {
    if (value === null || value === undefined) return t('districts:na');

    if (type === 'price') return formatPrice(value, currencyInfo);
    if (type === 'boolean') return formatBoolean(value, t, true, styles);
    
    if (type === 'crimeLevel') {
      const labelKey = getCrimeLevelText(value);
      const className = getCrimeLevelClass(value, styles);
      return <span className={className}>{t(labelKey)}</span>;
    }
    
    if (type === 'number') {
      let formatted = formatNumber(value);
      
      if (fieldKey === 'avgParkSize' || fieldKey === 'transportAvgDistance' || fieldKey === 'propertyPricePerSqm' || fieldKey === 'costPerSqm') {
         if (fieldKey === 'transportAvgDistance') formatted += ` ${t('common:units.m')}`;
         else formatted += ` ${t('common:units.sqm')}`;
      }
      if (fieldKey === 'bikeLanes') {
         formatted += ` ${t('common:units.km')}`;
      }
      if (fieldKey === 'greenSpaces' || fieldKey === 'unemploymentRate') {
         formatted += '%';
      }
      return formatted;
    }
    
    if (type === 'text') {
      const translated = t(`common:enums.${value.toLowerCase()}`);
      return translated !== `common:enums.${value.toLowerCase()}` ? translated : value;
    }
    
    return value;
  };

  return (
    <div className={styles.statsGridContainer}>
      {Object.values(DISTRICT_CATEGORIES).map((category) => {
        if (isFree && category.isPremium) return null;

        const categoryData = filterData[category.key];
        if (!categoryData) return null;

        const rating = categoryData.rating || categoryData.qualityRating;

        return (
          <StatCard 
            key={category.key} 
            title={t(`common:categories.${category.key}`)} 
            icon={category.icon} 
            rating={rating}
          >
            {category.fields.map((field) => {
              if (isFree && field.isPremiumField) return null;
              if (field.isRealtorOnly && !isRealtor) return null;

              const val = categoryData[field.key];
              
              if (val === null || val === undefined) return null;

              return (
                <div key={field.key} className={styles.statRow}>
                  <span className={styles.statLabel}>{t(`common:fields.${field.key}`)}</span>
                  <strong className={styles.statValue}>
                    {formatValue(val, field.type, field.key)}
                  </strong>
                </div>
              );
            })}
          </StatCard>
        );
      })}
    </div>
  );
}