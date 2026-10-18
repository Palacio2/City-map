import { useTranslation } from 'react-i18next';
import { getCrimeLevelText, formatAirQuality, formatTranslatedText } from '@utils/formatters';
import { useFormat } from '@hooks/useFormat';
import type { TransformedDistrict, TransformedCategory } from '@utils/dataTransformers';

export interface DistrictPdfTemplateProps {
  readonly district?: TransformedDistrict | null;
  readonly isRealtor?: boolean;
  readonly photoOverride?: string | ArrayBuffer | null;
}

export default function DistrictPdfTemplate({ district, photoOverride }: DistrictPdfTemplateProps) {
  const { t } = useTranslation('db');
  const { formatNumber, formatPrice, getCurrencyInfo } = useFormat();
  const currencyInfo = getCurrencyInfo(district?.country);

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

  const categories = Object.entries(filterData || {})
    .filter(([key, data]) => key !== 'general' && typeof data === 'object' && (data as TransformedCategory).fields)
    .map(([, data]) => (data as TransformedCategory));

  // Pagination logic
  const page1Cats = categories.slice(0, 4);
  const remainingCats = categories.slice(4);
  
  // Split remaining into chunks of 8
  const extraPages = [];
  for (let i = 0; i < remainingCats.length; i += 8) {
    extraPages.push(remainingCats.slice(i, i + 8));
  }

  const renderCategory = (cat: TransformedCategory) => (
    <div key={cat.key} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', breakInside: 'avoid' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#c5a47e' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{cat.icon}</span>
          </div>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1a202c', textTransform: 'uppercase', fontFamily: '"Inter", system-ui, sans-serif' }}>
            {t(`groups.${cat.key}`, { defaultValue: cat.key })}
          </h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', border: '1px solid', color: cat.rating >= 8 ? '#15803d' : (cat.rating >= 5 ? '#b45309' : '#b91c1c'), backgroundColor: cat.rating >= 8 ? '#f0fdf4' : (cat.rating >= 5 ? '#fffbeb' : '#fef2f2'), borderColor: cat.rating >= 8 ? '#bbf7d0' : (cat.rating >= 5 ? '#fde68a' : '#fecaca') }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', lineHeight: 1 }}>{cat.rating ? cat.rating.toFixed(1) : '-'}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.values(cat.fields || {}).map((f: { value?: unknown, key: string, type: string }) => {
          if (f.value === null || f.value === undefined) return null;
          return (
            <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: '"Inter", system-ui, sans-serif' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>{t(`common.fields.${f.key}`, { defaultValue: t(f.key) })}</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{formatValue(f.value, f.type, f.key)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#1a202c', fontFamily: '"Inter", system-ui, sans-serif', width: '794px' }}>
      {/* PAGE 1 */}
      <div className="pdf-page" style={{ width: '794px', height: '1123px', padding: '40px', boxSizing: 'border-box', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #c5a47e', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px', fontFamily: '"Inter", system-ui, sans-serif' }}>{name}</h1>
            <p style={{ fontSize: '13px', color: '#718096', margin: '8px 0 0 0', fontWeight: 500, fontFamily: '"Inter", system-ui, sans-serif' }}>
              {t('district.pdf.report_date')}: {new Date().toLocaleDateString()}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, padding: '10px 20px', border: '2px solid #1a202c', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '2px', backgroundColor: '#f8fafc', fontFamily: '"Inter", system-ui, sans-serif' }}>
            <span style={{ lineHeight: 1 }}>Kvartal</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '30px', height: '240px', marginBottom: '40px', flexShrink: 0 }}>
          <div style={{ flex: 1.5, borderRadius: '16px', overflow: 'hidden', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
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
              <div style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: '#cbd5e1' }}>🏙️</div>
            )}
          </div>
          
          <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#c5a47e', fontWeight: 800, margin: '0 0 16px 0', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9', fontFamily: '"Inter", system-ui, sans-serif' }}>
              {t('district.pdf.general_info', { defaultValue: 'INFORMACJE OGÓLNE' })}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-around' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#718096', fontWeight: 600 }}>{t('common.fields.population', { defaultValue: t('population') })}</span>
                <span style={{ fontWeight: 800 }}>{pop !== null ? formatNumber(pop) : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#718096', fontWeight: 600 }}>{t('average_salary')}</span>
                <span style={{ fontWeight: 800, color: '#c5a47e' }}>{avgSal !== null ? formatPrice(avgSal, currencyInfo) : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#718096', fontWeight: 600 }}>{t('unemployment_rate')}</span>
                <span style={{ fontWeight: 800 }}>{unemp !== null ? `${unemp}%` : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#718096', fontWeight: 600 }}>{t('common.fields.propertyPricePerSqm', { defaultValue: t('propertyPricePerSqm') })}</span>
                <span style={{ fontWeight: 800 }}>{propPrice !== null ? formatPrice(propPrice, currencyInfo) : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {page1Cats.map(renderCategory)}
        </div>

        <div style={{ position: 'absolute', bottom: '30px', left: '40px', right: '40px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '10px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', fontFamily: '"Inter", system-ui, sans-serif' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
            {t('district.pdf.generated_auto', { defaultValue: 'WYGENEROWANO W' })} <strong style={{ color: '#1e293b' }}>Kvartal</strong>
          </span>
          <span>Page 1</span>
        </div>
      </div>

      {/* SUBSEQUENT PAGES */}
      {extraPages.map((pageCats, index) => (
        <div key={index} className="pdf-page" style={{ width: '794px', height: '1123px', padding: '40px', boxSizing: 'border-box', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #c5a47e', paddingBottom: '20px', marginBottom: '40px' }}>
             <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: '#1a202c', fontFamily: '"Inter", system-ui, sans-serif' }}>
               {name} - {t('district.pdf.details_continued', { defaultValue: 'SZCZEGÓŁY (Ciąg dalszy)' })}
             </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {pageCats.map(renderCategory)}
          </div>

          <div style={{ position: 'absolute', bottom: '30px', left: '40px', right: '40px', paddingTop: '15px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '10px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', fontFamily: '"Inter", system-ui, sans-serif' }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              {t('district.pdf.generated_auto', { defaultValue: 'WYGENEROWANO W' })} <strong style={{ color: '#1e293b' }}>Kvartal</strong>
            </span>
            <span>Page {index + 2}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
