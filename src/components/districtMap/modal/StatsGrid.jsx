import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import StatCard from './StatCard';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { 
  formatNumber, 
  formatPrice, 
  formatBoolean, 
  getCrimeLevelText, 
  getCrimeLevelClass 
} from '@utils/formatters';

// Створюємо імітацію styles.module.css для сумісності з утилітами форматування
const mockStyles = {
  highRating: 'text-success font-bold',
  mediumRating: 'text-warning font-bold',
  lowRating: 'text-danger font-bold',
  booleanTrue: 'text-success font-bold',
  booleanFalse: 'text-textSecondary opacity-50'
};

export default function StatsGrid({ filterData, currencyInfo, isFree, isRealtor, selectedCategory }) {
  const { t } = useTranslation(['districts', 'common']);

  const formatValue = (value, type, fieldKey) => {
    if (value === null || value === undefined) return t('districts:na');

    if (type === 'price') return formatPrice(value, currencyInfo);
    if (type === 'boolean') return formatBoolean(value, t, true, mockStyles);
    
    if (type === 'crimeLevel') {
      const labelKey = getCrimeLevelText(value);
      const className = getCrimeLevelClass(value, mockStyles);
      return <span className={className}>{t(labelKey)}</span>;
    }

    if (fieldKey === 'airQuality') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        let aqiEnum = 'medium';
        if (numValue <= 50) aqiEnum = 'good';
        else if (numValue > 100) aqiEnum = 'bad';
        
        return t(`common:enums.${aqiEnum}`);
      }
    }
    
    if (type === 'number') {
      let formatted = formatNumber(value);
      if (fieldKey === 'avgParkSize' || fieldKey === 'propertyPricePerSqm' || fieldKey === 'costPerSqm') {
          formatted += ` ${t('common:units.sqm')}`;
      } else if (fieldKey === 'transportAvgDistance') {
          formatted += ` ${t('common:units.m')}`;
      } else if (fieldKey === 'bikeLanes') {
          formatted += ` ${t('common:units.km')}`;
      } else if (fieldKey === 'greenSpaces' || fieldKey === 'unemploymentRate') {
          formatted += '%';
      }
      return formatted;
    }
    
    if (type === 'text') {
      const stringVal = String(value);
      const translated = t(`common:enums.${stringVal.toLowerCase()}`);
      return translated.includes('enums.') ? stringVal : translated;
    }
    
    return value;
  };

  const categoriesToRender = useMemo(() => {
    if (selectedCategory && DISTRICT_CATEGORIES[selectedCategory]) {
      return [DISTRICT_CATEGORIES[selectedCategory]];
    }
    return Object.values(DISTRICT_CATEGORIES);
  }, [selectedCategory]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 md:gap-6 w-full box-border">
      {categoriesToRender.map((category) => {
        if (isFree && category.isPremium) return null;
        const categoryData = filterData[category.key];
        if (!categoryData) return null;

        return (
          <StatCard 
            key={category.key} 
            title={t(`common:categories.${category.key}`)} 
            icon={category.icon} 
            rating={categoryData.rating || categoryData.qualityRating}
          >
            {category.fields.map((field) => {
              if (isFree && field.isPremiumField) return null;
              if (field.isRealtorOnly && !isRealtor) return null;
              const val = categoryData[field.key];
              if (val === null || val === undefined) return null;

              return (
                <div key={field.key} className="flex justify-between py-2.5 border-b border-dashed border-borderClient text-[0.9rem] items-center last:border-b-0">
                  <span className="text-textSecondary">{t(`common:fields.${field.key}`)}</span>
                  <strong className="text-textMain font-semibold text-right">
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