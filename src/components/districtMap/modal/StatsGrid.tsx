import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StatCard } from './StatCard';
import { BooleanStatus } from '@ui/BooleanStatus';
import { 
  formatNumber, formatPrice, getCrimeLevelText, CurrencyInfo, 
  formatAirQuality, formatNumericField, formatTranslatedText 
} from '@utils/formatters';
import { TransformedFilterData, TransformedCategory, TransformedFieldData } from '@utils/dataTransformers';

const getRatingVariant = (rating: number | string | null | undefined): 'high' | 'medium' | 'low' | 'default' => {
  if (!rating) return 'default';
  const num = Number.parseFloat(String(rating));
  if (num >= 8) return 'high';
  if (num >= 5) return 'medium';
  return 'low';
};

const getCrimeStyle = (value: number) => {
  if (value <= 3) return 'text-success font-bold';
  if (value > 6) return 'text-danger font-bold';
  return 'text-warning font-bold';
};

interface StatsGridProps {
  filterData?: TransformedFilterData | null;
  currencyInfo?: CurrencyInfo;
  selectedCategory?: string | null;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ 
  filterData, currencyInfo, selectedCategory 
}) => {
  const { t } = useTranslation('db');

  const formatValue = (value: any, type: string, fieldKey: string) => {
    if (value === null || value === undefined) return t('favorites.na');
    if (fieldKey === 'airQuality' || fieldKey === 'air_quality') return formatAirQuality(value, t);
    if (type === 'price') return formatPrice(value, currencyInfo);
    
    if (type === 'boolean') {
      if (typeof value === 'number') return formatNumber(value);
      return <BooleanStatus value={value} useIcons />;
    }

    if (type === 'crimeLevel') {
      return <span className={getCrimeStyle(Number(value))}>{t(getCrimeLevelText(Number(value)))}</span>;
    }

    if (type === 'number' || type === 'numeric') return formatNumericField(value, fieldKey, t);
    if (type === 'text') return formatTranslatedText(value, t);

    return value;
  };

  const categoriesToRender = useMemo(() => {
    if (!filterData) return [];
    
    const allCats = Object.keys(filterData)
      .filter(k => k !== 'general')
      .map(key => filterData[key])
      .filter((cat): cat is TransformedCategory => Boolean(cat && typeof cat === 'object' && 'fields' in cat));

    return selectedCategory ? allCats.filter(c => c.key === selectedCategory) : allCats;
  }, [filterData, selectedCategory]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 md:gap-6 w-full box-border">
        {categoriesToRender.map((category, index) => {
          const ratingVal = category.rating ? category.rating.toFixed(1) : t('favorites.na');

          return (
            <div key={category.key} className="opacity-0 animate-fade-in-soft" style={{ animationDelay: `${index * 60}ms` }}>
              <StatCard title={t(`categories.${category.key}`)} icon={category.icon} ratingValue={ratingVal} ratingVariant={getRatingVariant(category.rating)}>
                {Object.values(category.fields).map((fieldData: TransformedFieldData) => {
                  if (fieldData.value === null || fieldData.value === undefined) return null;

                  return (
                    <div key={fieldData.key} className="flex justify-between py-2.5 border-b border-dashed border-borderClient text-[0.9rem] items-center last:border-b-0">
                      <span className="text-textSecondary">{t(`fields.${fieldData.key}`)}</span>
                      <strong className="text-textMain font-semibold text-right">
                        {formatValue(fieldData.value, fieldData.type, fieldData.key)}
                      </strong>
                    </div>
                  );
                })}
              </StatCard>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes fadeInUpSoft { 0% { opacity: 0; transform: translateY(12px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fade-in-soft { animation: fadeInUpSoft 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>
    </>
  );
};