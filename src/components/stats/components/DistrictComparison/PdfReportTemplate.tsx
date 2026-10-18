import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicDistrictConfig } from '@config/districtFields'; 
import { getValue, formatPrice, formatNumber, formatDate, getCurrencyInfo } from '@utils/formatters';
import { extractBaseVal, extractRating, TransformedDistrict } from '@utils/dataTransformers';
import { ExportCustomData } from './ExportSettingsModal';
import { FaPhone, FaGlobe } from 'react-icons/fa';
import { buildCategoryRows, safeStringify, RowDef } from '@utils/comparisonHelpers';

const LOW_IS_BETTER = new Set([
  'average_sale_price_sqm',
  'average_rent_price',
  'filterData.general.unemploymentRate',
  'filterData.safety.crimeLevel',
  'filterData.utilities.costPerSqm'
]);

const getBestValue = (key: string, districts: TransformedDistrict[]) => {
  const values = districts.map(d => {
     if (['average_sale_price_sqm', 'average_rent_price', 'population'].includes(key)) {
        return extractBaseVal(d, key);
     }
     if (key.startsWith('rating_')) {
        return extractRating(d, key.replace('rating_', ''));
     }
     return getValue(d, key);
  }).filter(v => typeof v === 'number' && !Number.isNaN(v)) as number[];
  
  if (values.length === 0) return null;
  return LOW_IS_BETTER.has(key) ? Math.min(...values) : Math.max(...values);
};

interface PdfReportTemplateProps {
  readonly districts: TransformedDistrict[];
  readonly customData: ExportCustomData | null;
  readonly config: DynamicDistrictConfig | null;
}

export default function PdfReportTemplate({ districts, customData, config }: PdfReportTemplateProps) {
  const { t, i18n } = useTranslation('db');

  const rows = useMemo(() => {
    if (!districts.length) return [];
    
    const baseRows: RowDef[] = [
      { 
         label: t(['common.fields.propertyPricePerSqm', 'propertyPricePerSqm'], { defaultValue: 'propertyPricePerSqm' }), 
         key: 'average_sale_price_sqm', 
         format: (_, d) => formatPrice(extractBaseVal(d, 'average_sale_price_sqm'), getCurrencyInfo(d.country)) 
      },
      { 
         label: t(['common.fields.average_rent_price', 'average_rent_price'], { defaultValue: 'average_rent_price' }), 
         key: 'average_rent_price', 
         format: (_, d) => formatPrice(extractBaseVal(d, 'average_rent_price'), getCurrencyInfo(d.country)) 
      },
      { 
         label: t(['common.fields.population', 'population'], { defaultValue: 'population' }), 
         key: 'population', 
         format: (_, d) => formatNumber(extractBaseVal(d, 'population')) 
      },
    ];

    if (!config) return baseRows;

    const categoryRows = Object.values(config).flatMap(cat => buildCategoryRows(cat.key, cat, t));
    return [...baseRows, ...categoryRows];
  }, [districts, config, t]);

  if (!districts.length) return null;

  const { agencyName, phone, website, comments, logo } = customData || {};

  let agencyHeaderContent = null;
  if (logo) {
    agencyHeaderContent = <img src={logo as string} alt="Agency Logo" className="max-h-[50px] max-w-[150px] object-contain" crossOrigin="anonymous" />;
  } else if (agencyName) {
    agencyHeaderContent = <div className="text-lg font-bold text-[#4a5568] uppercase">{agencyName}</div>;
  }

  return (
    <div style={{ width: '794px', minHeight: '1122px', padding: '30px', paddingBottom: '80px', backgroundColor: '#ffffff', color: '#2d3748', fontFamily: 'sans-serif', position: 'relative' }}>
      
      <div className="flex justify-between items-start border-b-2 border-[#cbd5e0] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a202c] m-0 uppercase tracking-wide">
            {t('stats.export.report_title')}
          </h1>
          <p className="text-xs text-[#718096] mt-2 mb-0 font-medium">
            {t('stats.labels.report_date')}: {formatDate(new Date(), i18n.language || 'uk-UA')}
          </p>
        </div>
        {agencyHeaderContent}
      </div>

      {comments && (
         <div className="bg-[#f7fafc] p-4 rounded-sm border border-[#e2e8f0] mb-6 text-[11px] text-[#4a5568]">
           <strong className="block mb-1 text-[#2d3748]">{t('stats.export.agent_comments')}:</strong>
           {comments}
         </div>
      )}

      <div className="w-full mb-10">
        <table className="w-full border-collapse" style={{ pageBreakInside: 'auto' }}>
          <thead>
            <tr>
              <th className="p-2 border-b border-[#cbd5e0] text-left w-[180px]"></th>
              {districts.map((d) => (
                <th key={`pdf-th-${d.id}`} className="p-2 border-b border-[#cbd5e0] text-center font-bold text-[13px] text-[#2d3748] w-[140px]">
                  {d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowKey = row.key || `header-${idx}`;
              if (row.type === 'header') {
                return (
                  <tr key={rowKey} className="bg-[#edf2f7]" style={{ pageBreakInside: 'avoid' }}>
                    <td colSpan={districts.length + 1} className="py-2 px-3 text-left font-bold text-[#2d3748] text-[11px] uppercase border-y border-[#cbd5e0]">
                      {row.title}
                    </td>
                  </tr>
                );
              }

              const bestVal = row.key ? getBestValue(row.key, districts) : null;

              return (
                <tr key={rowKey} style={{ pageBreakInside: 'avoid' }}>
                  <td className="py-2 px-3 border-b border-[#e2e8f0] text-left text-[10px] font-semibold text-[#4a5568] w-[180px] bg-[#f8fafc]">
                    {row.label}
                  </td>
                  {districts.map((d) => {
                    let rawVal = null;
                    if (['average_sale_price_sqm', 'average_rent_price', 'population'].includes(row.key || '')) {
                        rawVal = extractBaseVal(d, row.key!);
                    } else if (row.key?.startsWith('rating_')) {
                        rawVal = extractRating(d, row.key.replace('rating_', ''));
                    } else {
                        rawVal = row.key ? getValue(d, row.key) : null;
                    }
                    
                    const isWinner = rawVal !== null && bestVal !== null && rawVal === bestVal && typeof rawVal === 'number';
                    const displayVal = row.format ? row.format(rawVal, d) : safeStringify(rawVal);

                    return (
                      <td key={`pdf-cell-${String(d.id || d.name)}-${row.key}`} className={`py-2 px-1.5 text-[11px] border-b border-[#e2e8f0] text-center font-medium ${isWinner ? 'text-[#15803d] font-bold bg-[#f0fdf4]' : 'text-[#2d3748]'}`}>
                        {displayVal}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="absolute bottom-8 left-[30px] right-[30px] pt-4 border-t border-[#cbd5e0] flex justify-between items-center text-[9px] text-[#718096]">
        <div className="flex gap-4">
          {website && <span className="flex items-center gap-1"><FaGlobe /> {website}</span>}
          {phone && <span className="flex items-center gap-1"><FaPhone /> {phone}</span>}
        </div>
        <div className="uppercase tracking-widest">
          {t('stats.labels.generated_auto')} <strong>Kvartal</strong>
        </div>
      </div>
    </div>
  );
}
