import React from 'react';
import { useTranslation } from 'react-i18next';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { formatNumber, formatPrice, getCrimeLevelText } from '@utils/formatters';

// Стандартний рядок статистики
const StatRow = ({ label, value, highlight = false }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    fontSize: '11px', 
    lineHeight: '1.4', 
    paddingBottom: '5px', 
    borderBottom: '1px dotted #e5e7eb', 
    marginBottom: '5px' 
  }}>
    <span style={{ color: '#666666', fontWeight: 500 }}>{label}</span>
    <span style={{ fontWeight: 700, textAlign: 'right', color: highlight ? '#c5a47e' : '#000000' }}>{value}</span>
  </div>
);

// Кольори для рейтингу
const getRatingBg = (rating) => {
  if (!rating) return '#000000';
  if (rating >= 8) return '#22c55e';
  if (rating >= 5) return '#eab308';
  return '#ef4444';
};

// Секція категорії (наприклад, Освіта, Медицина)
const Section = ({ categoryConfig, data, t, formatValue, isRealtor }) => {
  if (!data) return null;

  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      border: '1px solid #e5e7eb', 
      width: '100%', 
      marginBottom: '20px', 
      pageBreakInside: 'avoid' 
    }}>
      <div style={{ 
        backgroundColor: '#f1f5f9', 
        padding: '8px 12px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        borderBottom: '1px solid #e5e7eb' 
      }}>
        <span style={{ fontSize: '14px', color: '#000000' }}>{categoryConfig.icon}</span>
        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#000000', margin: 0, flexGrow: 1, textTransform: 'uppercase' }}>
          {t(`common:categories.${categoryConfig.key}`)}
        </h3>
        <span style={{ 
          color: '#ffffff', 
          fontSize: '11px', 
          fontWeight: 700, 
          padding: '2px 6px', 
          minWidth: '20px', 
          textAlign: 'center', 
          borderRadius: '4px', 
          backgroundColor: getRatingBg(data.rating || data.qualityRating) 
        }}>
          {(data.rating || data.qualityRating || 0).toFixed(1)}
        </span>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column' }}>
        {categoryConfig.fields.map(field => {
           if (field.isRealtorOnly && !isRealtor) return null;
           const val = data[field.key];
           if (val === null || val === undefined) return null;

           return (
             <StatRow 
                key={field.key}
                label={t(`common:fields.${field.key}`)}
                value={formatValue(val, field.type, field.key)}
             />
           );
        })}
      </div>
    </div>
  );
};

export default function DistrictPdfTemplate({ district, currencyInfo, isRealtor, photoOverride }) {
  const { t } = useTranslation(['db', 'common']);

  const formatValue = (value, type, fieldKey) => {
    if (value === null || value === undefined) return '-';

    if (fieldKey === 'airQuality') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        let aqiEnum = 'medium';
        if (numValue <= 50) aqiEnum = 'good';
        else if (numValue > 100) aqiEnum = 'bad';
        return t(`common:enums.${aqiEnum}`);
      }
    }

    if (type === 'price') return formatPrice(value, currencyInfo);
    if (type === 'boolean') return value ? t('common:enums.yes') : t('common:enums.no');
    
    if (type === 'crimeLevel') {
        const labelKey = getCrimeLevelText(value);
        return t(labelKey);
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
        const translationKey = `common:enums.${String(value).toLowerCase()}`;
        const translated = t(translationKey);
        return translated !== translationKey ? translated : value;
    }
    
    return value;
  };

  if (!district) return null;

  const { name, photo_url, filterData } = district;
  const safeCurrencyInfo = currencyInfo || { code: 'UAH', locale: 'uk-UA' };
  
  const categories = Object.values(DISTRICT_CATEGORIES);
  const midPoint = Math.ceil(categories.length / 2);
  const leftColumn = categories.slice(0, midPoint);
  const rightColumn = categories.slice(midPoint);

  return (
    <div 
      style={{ 
        width: '794px', 
        minHeight: '1122px', 
        padding: '40px', 
        backgroundColor: '#ffffff', 
        color: '#000000', 
        boxSizing: 'border-box', 
        position: 'relative', 
        fontFamily: 'sans-serif'
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '2px solid #c5a47e', marginBottom: '30px' }}>
        <div style={{ maxWidth: '70%' }}>
           <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0, lineHeight: 1.2, textTransform: 'uppercase' }}>{name}</h1>
           <p style={{ fontSize: '12px', color: '#666666', marginTop: '8px', marginBottom: 0, fontWeight: 500 }}>
             {t('districts.pdf.report_date', { defaultValue: 'Дата звіту' })}: {new Date().toLocaleDateString('uk-UA')}
           </p>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, padding: '8px 16px', border: '2px solid #000000', textTransform: 'uppercase', letterSpacing: '2px' }}>
           GeoAnalyzer
        </div>
      </div>

      {/* HERO SECTION */}
      <div style={{ display: 'flex', gap: '24px', height: '240px', marginBottom: '35px' }}>
        <div style={{ flex: 1.3, border: '1px solid #e5e7eb', backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
          {photoOverride || photo_url ? (
            <img 
              src={photoOverride || photo_url} 
              alt={name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              crossOrigin="anonymous" 
            />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6' }} />
          )}
        </div>
        
        {filterData?.general && isRealtor && (
          <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '20px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#c5a47e', fontWeight: 700, margin: '0 0 15px 0', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
               {t('districts.pdf.general_info', { defaultValue: 'Загальна інформація' })}
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <StatRow label={t('common:fields.population')} value={formatNumber(filterData.general.population)} highlight />
                <StatRow label={t('common:fields.averageSalary')} value={formatPrice(filterData.general.averageSalary, safeCurrencyInfo)} highlight />
                <StatRow label={t('common:fields.unemploymentRate')} value={filterData.general.unemploymentRate ? `${filterData.general.unemploymentRate}%` : '-'} />
                <StatRow label={t('common:fields.propertyPricePerSqm')} value={formatPrice(filterData.general.propertyPrice, safeCurrencyInfo)} />
                <StatRow label={t('common:fields.average_rent_price')} value={formatPrice(filterData.general.average_rent_price, safeCurrencyInfo)} />
             </div>
          </div>
        )}
      </div>

      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0 0 30px 0', width: '100%' }} />

      {/* MASONRY GRID */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '25px' }}>
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {leftColumn.map(cat => (
                <Section key={cat.key} categoryConfig={cat} data={filterData?.[cat.key]} t={t} formatValue={formatValue} isRealtor={isRealtor} />
            ))}
         </div>
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {rightColumn.map(cat => (
                <Section key={cat.key} categoryConfig={cat} data={filterData?.[cat.key]} t={t} formatValue={formatValue} isRealtor={isRealtor} />
            ))}
         </div>
      </div>

      {/* FOOTER */}
      <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '9px', color: '#666666', display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t('districts.pdf.generated_auto', { defaultValue: 'Згенеровано автоматично системою' })} <strong style={{ color: '#000000', marginLeft: '4px' }}>GeoAnalyzer</strong>
        </p>
      </div>
    </div>
  );
}