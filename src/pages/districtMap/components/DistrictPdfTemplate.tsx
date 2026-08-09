import { useTranslation } from 'react-i18next';
import { getCrimeLevelText, formatAirQuality, formatTranslatedText } from '@utils/formatters';
import { useFormat } from '@hooks/useFormat';
import type { TransformedDistrict, TransformedCategory } from '@utils/dataTransformers';
import { StatRow, Section } from './PdfComponents';

export interface DistrictPdfTemplateProps {
  readonly district?: TransformedDistrict | null;
  readonly isRealtor?: boolean;
  readonly photoOverride?: string | ArrayBuffer | null;
}

export default function DistrictPdfTemplate({ district, isRealtor, photoOverride }: DistrictPdfTemplateProps) {
  const { t } = useTranslation('db');
  const { formatNumber, formatPrice, getCurrencyInfo } = useFormat();
  const currencyInfo = getCurrencyInfo('EU');

  const formatValue = (value: unknown, type: string, fieldKey: string): string | number => {
    if (value === null || value === undefined) return '-';
    if (fieldKey === 'airQuality' || fieldKey === 'air_quality') {
      return formatAirQuality(value, t);
    }
    if (type === 'price') {
      return formatPrice(value as number, currencyInfo);
    }
    if (type === 'boolean') {
      if (typeof value === 'number') return formatNumber(value as number);
      return value ? t('district.enums.yes') : t('district.enums.no');
    }
    if (type === 'crimeLevel') {
      return t(getCrimeLevelText(Number(value)));
    }
    if (type === 'number' || type === 'numeric') {
      const numVal = formatNumber(value as number);
      const units: Record<string, string[]> = {
        sqm: ['avgParkSize', 'propertyPricePerSqm', 'costPerSqm', 'average_park_size_sqm', 'average_sale_price_sqm', 'utilities_cost_per_sqm'],
        m: ['transportAvgDistance', 'transport_average_distance_m'],
        km: ['bikeLanes', 'bike_lanes_km'],
        percent: ['greenSpaces', 'unemploymentRate', 'green_spaces_percent', 'unemployment_rate']
      };
      for (const [unit, keys] of Object.entries(units)) {
        if (keys.includes(fieldKey)) return `${numVal} ${t(`common.units.${unit}`)}`;
      }
      return numVal;
    }
    if (type === 'text') {
      return formatTranslatedText(value, t);
    }
    return String(value);
  };

  if (!district) return null;
  const { name, photo_url, filterData } = district;

  const getSafeVal = (k1: string, k2?: string): unknown => {
    const dAny = district as Record<string, unknown>;
    if (dAny[k1] !== undefined && dAny[k1] !== null) return dAny[k1];
    if (k2 && dAny[k2] !== undefined && dAny[k2] !== null) return dAny[k2];
    const distData = dAny.district_data;
    const filtData = dAny.filterData;
    const rawData = (Array.isArray(distData) ? distData[0] : distData)
      || (Array.isArray(filtData) ? filtData[0] : filtData) || {};
    const rawObj = rawData as Record<string, unknown>;
    if (rawObj[k1] !== undefined && rawObj[k1] !== null) return rawObj[k1];
    if (k2 && rawObj[k2] !== undefined && rawObj[k2] !== null) return rawObj[k2];
    if (filterData && typeof filterData === 'object') {
      for (const key of Object.keys(filterData)) {
        const cat = (filterData as Record<string, unknown>)[key] as { fields?: Record<string, { value?: unknown }> };
        if (cat && cat.fields) {
           if (cat.fields[k1]?.value !== undefined && cat.fields[k1]?.value !== null) return cat.fields[k1].value;
           if (k2 && cat.fields[k2]?.value !== undefined && cat.fields[k2]?.value !== null) return cat.fields[k2].value;
        }
      }
    }
    return null;
  };

  const parseNum = (val: unknown): number | null => {
    if (val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const pop = parseNum(getSafeVal('population'));
  const avgSal = parseNum(getSafeVal('averageSalary', 'average_salary'));
  const unemp = parseNum(getSafeVal('unemploymentRate', 'unemployment_rate'));
  const propPrice = parseNum(getSafeVal('propertyPrice', 'average_sale_price_sqm'));
  const rentPrice = parseNum(getSafeVal('average_rent_price'));

  const categories = Object.entries(filterData || {})
    .filter(([key, data]) => key !== 'general' && typeof data === 'object' && (data as TransformedCategory).fields)
    .map(([, data]) => (data as TransformedCategory));

  const midPoint = Math.ceil(categories.length / 2);

  return (
    <div style={{ width: '794px', minHeight: '1122px', padding: '30px', backgroundColor: '#ffffff', color: '#000000', boxSizing: 'border-box', position: 'relative', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '15px', borderBottom: '2px solid #c5a47e', marginBottom: '25px' }}>
        <div style={{ maxWidth: '70%' }}>
           <h1 style={{ fontSize: '30px', fontWeight: 700, margin: 0, lineHeight: 1.2, textTransform: 'uppercase' }}>{name}</h1>
           <p style={{ fontSize: '11px', color: '#666666', marginTop: '6px', marginBottom: 0, fontWeight: 500 }}>
             {t('district.pdf.report_date')}: {new Date().toLocaleDateString()}
           </p>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, padding: '8px 16px', border: '2px solid #000000', textTransform: 'uppercase', letterSpacing: '2px' }}>
           GeoAnalyzer
        </div>
      </div>
      <div style={{ display: 'flex', gap: '20px', height: '190px', marginBottom: '25px' }}>
        <div style={{ flex: 1.3, border: '1px solid #e5e7eb', backgroundColor: '#f1f5f9' }}>
          {(photoOverride || photo_url) ? (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${photoOverride || photo_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }} />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#f3f4f6' }} />
          )}
        </div>
        {isRealtor && (
          <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '16px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#c5a47e', fontWeight: 700, margin: '0 0 12px 0', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>
               {t('district.pdf.general_info', { defaultValue: 'INFORMACJE OGÓLNE' })}
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <StatRow label={t('common.fields.population', { defaultValue: t('population') })} value={pop !== null ? formatNumber(pop) : '-'} highlight />
                <StatRow label={t('average_salary')} value={avgSal !== null ? formatPrice(avgSal, currencyInfo) : '-'} highlight />
                <StatRow label={t('unemployment_rate')} value={unemp !== null ? `${unemp}%` : '-'} />
                <StatRow label={t('common.fields.propertyPricePerSqm', { defaultValue: t('propertyPricePerSqm') })} value={propPrice !== null ? formatPrice(propPrice, currencyInfo) : '-'} />
                <StatRow label={t('common.fields.average_rent_price', { defaultValue: t('average_rent_price') })} value={rentPrice !== null ? formatPrice(rentPrice, currencyInfo) : '-'} />
             </div>
          </div>
        )}
      </div>
      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0 0 25px 0', width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '25px' }}>
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {categories.slice(0, midPoint).map(cat => (
                <Section key={cat.key} categoryConfig={{ key: cat.key, icon: cat.icon }} data={cat} formatValue={formatValue} />
            ))}
         </div>
         <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {categories.slice(midPoint).map(cat => (
                <Section key={cat.key} categoryConfig={{ key: cat.key, icon: cat.icon }} data={cat} formatValue={formatValue} />
            ))}
         </div>
      </div>
      <div style={{ position: 'absolute', bottom: '20px', left: '30px', right: '30px', paddingTop: '10px', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '9px', color: '#666666', display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t('district.pdf.generated_auto', { defaultValue: 'WYGENEROWANO AUTOMATYCZNIE W' })} <strong style={{ color: '#000000', marginLeft: '4px' }}>GeoAnalyzer</strong>
        </p>
      </div>
    </div>
  );
}