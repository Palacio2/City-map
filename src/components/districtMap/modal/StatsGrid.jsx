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
  const { t } = useTranslation('districts');

  const formatValue = (value, type, fieldKey) => {
    if (value === null || value === undefined) return t('na');

    if (type === 'price') return formatPrice(value, currencyInfo);
    if (type === 'boolean') return formatBoolean(value, t);
    
    if (type === 'crimeLevel') {
      const labelKey = getCrimeLevelText(value);
      const className = getCrimeLevelClass(value, styles);
      return <span className={className}>{t(labelKey)}</span>;
    }
    
    if (type === 'number') return formatNumber(value);
    
    if (type === 'text') {
      const translationKey = `values.${value}`;
      const translated = t(translationKey);
      return translated !== translationKey ? translated : value;
    }
    
    return value;
  };

  return (
    <div className={styles.statsGrid} style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
      gap: '20px', 
      width: '100%' 
    }}>
      {Object.values(DISTRICT_CATEGORIES).map((category) => {
        if (isFree && category.isPremium) return null;

        const categoryData = filterData[category.key];
        if (!categoryData) return null;

        const rating = categoryData.rating || categoryData.qualityRating;

        return (
          <StatCard 
            key={category.key} 
            title={t(`categories.${category.key}`)} 
            icon={category.icon} 
            rating={rating}
          >
            {category.fields.map((field) => {
              if (isFree && field.isPremiumField) return null;
              if (field.isRealtorOnly && !isRealtor) return null;

              const val = categoryData[field.key];
              
              if (val === null || val === undefined) return null;

              return (
                <div key={field.key} className={styles.statRow} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '8px 0', 
                  borderBottom: '1px dashed #eee', 
                  fontSize: '14px' 
                }}>
                  <span style={{ color: '#666' }}>{t(`fields.${field.key}`)}:</span>
                  <strong style={{ color: '#333' }}>{formatValue(val, field.type, field.key)}</strong>
                </div>
              );
            })}
          </StatCard>
        );
      })}
    </div>
  );
}