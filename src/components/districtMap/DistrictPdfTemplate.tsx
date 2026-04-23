import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  formatNumber, formatPrice, getCrimeLevelText, CurrencyInfo, 
  formatAirQuality, formatNumericField, formatTranslatedText 
} from '@utils/formatters';
import { TransformedDistrict, TransformedCategory } from '@utils/dataTransformers';
import { StatRow, Section } from './PdfComponents';

export interface DistrictPdfTemplateProps {
  readonly district?: TransformedDistrict | null;
  readonly currencyInfo?: CurrencyInfo;
  readonly isRealtor?: boolean;
  readonly photoOverride?: string | ArrayBuffer | null;
}

export default function DistrictPdfTemplate({ district, currencyInfo, isRealtor, photoOverride }: DistrictPdfTemplateProps) {
  const { t } = useTranslation('db');

  const formatValue = (value: any, type: string, fieldKey: string): string | number => {
    if (value === null || value === undefined) return '-';
    if (fieldKey === 'airQuality' || fieldKey === 'air_quality') return formatAirQuality(value, t);
    if (type === 'price') return formatPrice(value, currencyInfo);
    
    if (type === 'boolean') {
      if (typeof value === 'number') return formatNumber(value);
      return value ? t('district.enums.yes') : t('district.enums.no');
    }
    
    if (type === 'crimeLevel') return t(getCrimeLevelText(Number(value)));
    if (type === 'number' || type === 'numeric') return formatNumericField(value, fieldKey, t);
    if (type === 'text') return formatTranslatedText(value, t);
    return String(value);
  };

  if (!district) return null;

  const { name, photo_url, filterData } = district;
  const safeCurrencyInfo = currencyInfo || { code: 'UAH', locale: 'uk-UA', symbol: '₴' };
  
  const general = filterData?.general || {};
  const pop = (general as any).population?.value ?? general.population;
  const avgSal = (general as any).averageSalary?.value ?? general.averageSalary;
  const unemp = (general as any).unemploymentRate?.value ?? general.unemploymentRate;
  const propPrice = (general as any).propertyPrice?.value ?? general.propertyPrice;
  const rentPrice = (general as any).average_rent_price?.value ?? general.average_rent_price;
  
  const categories = Object.entries(filterData || {})
    .filter(([key, data]) => key !== 'general' && typeof data === 'object' && (data as TransformedCategory).fields)
    .map(([, data]) => (data as TransformedCategory));

  const midPoint = Math.ceil(categories.length / 2);

  return (
    <div style={{ width: '794px', minHeight: '1122px', padding: '40px', backgroundColor: '#ffffff', color: '#000000', boxSizing: 'border-box', position: 'relative', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '2px solid #c5a47e', marginBottom: '30px' }}>
        <div style={{ maxWidth: '70%' }}>
           <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0, lineHeight: 1.2, textTransform: 'uppercase' }}>{name}</h1>
           <p style={{ fontSize: '12px', color: '#666666', marginTop: '8px', marginBottom: 0, fontWeight: 500 }}>
             {t('district.pdf.report_date')}: {new Date().toLocaleDateString()}
           </p>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, padding: '8px 16px', border: '2px solid #000000', textTransform: 'uppercase', letterSpacing: '2px' }}>
           GeoAnalyzer
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', height: '240px', marginBottom: '35px' }}>
        <div style={{ flex: 1.3, border: '1px solid #e5e7eb', backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
          {photoOverride || photo_url ? (
            <img src={(photoOverride as string) || photo_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6' }} />
          )}
        </div>
        
        {Object.keys(general).length > 0 && isRealtor && (
          <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '20px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#c5a47e', fontWeight: 700, margin: '0 0 15px 0', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
               {t('district.pdf.general_info')}
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {/* ОНОВЛЕНІ КЛЮЧІ ТУТ */}
                <StatRow label={t('common.fields.population', { defaultValue: t('population') })} value={formatNumber(pop)} highlight />
                <StatRow label={t('average_salary')} value={formatPrice(avgSal, safeCurrencyInfo)} highlight />
                <StatRow label={t('unemployment_rate')} value={unemp === null ? '-' : `${unemp}%`} />
                <StatRow label={t('common.fields.propertyPricePerSqm', { defaultValue: t('propertyPricePerSqm') })} value={formatPrice(propPrice, safeCurrencyInfo)} />
                <StatRow label={t('common.fields.average_rent_price', { defaultValue: t('average_rent_price') })} value={formatPrice(rentPrice, safeCurrencyInfo)} />
             </div>
          </div>
        )}
      </div>

      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0 0 30px 0', width: '100%' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '25px' }}>
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {categories.slice(0, midPoint).map(cat => (
                <Section key={cat.key} categoryConfig={cat as any} data={cat} t={t} formatValue={formatValue} />
            ))}
         </div>
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {categories.slice(midPoint).map(cat => (
                <Section key={cat.key} categoryConfig={cat as any} data={cat} t={t} formatValue={formatValue} />
            ))}
         </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '9px', color: '#666666', display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t('district.pdf.generated_auto')} <strong style={{ color: '#000000', marginLeft: '4px' }}>GeoAnalyzer</strong>
        </p>
      </div>
    </div>
  );
}