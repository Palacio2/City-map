import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicDistrictConfig } from '@config/districtFields'; 
import { getValue, formatPrice, formatNumber } from '@utils/formatters';
import { TransformedDistrict } from '@utils/dataTransformers';
import { ExportCustomData } from './ExportSettingsModal';
import { FaPhone, FaGlobe } from 'react-icons/fa';

const LOW_IS_BETTER = new Set([
  'filterData.utilities.propertyPricePerSqm',
  'filterData.general.average_rent_price',
  'filterData.general.unemploymentRate',
  'filterData.safety.crimeLevel',
  'filterData.utilities.costPerSqm'
]);

const safeStringify = (val: unknown): string => {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val.toString();
  return '-';
};

const getBestValue = (key: string, districts: TransformedDistrict[]) => {
  const values = districts.map(d => getValue(d, key)).filter(v => typeof v === 'number' && !Number.isNaN(v)) as number[];
  if (values.length === 0) return null;
  return LOW_IS_BETTER.has(key) ? Math.min(...values) : Math.max(...values);
};

interface RowDef {
  type?: 'header';
  title?: string;
  label?: string;
  key?: string;
  format?: (v: unknown, d: TransformedDistrict) => React.ReactNode;
}

const buildCategoryRows = (catKey: string, categoryConfig: any, t: any): RowDef[] => {
  const catName = t(`common.categories.${catKey}`);
  const catHeader: RowDef = { type: 'header', title: catName, key: `header-${catKey}` };

  const ratingRow: RowDef = {
    label: t('stats.comparison.rating'),
    key: `filterData.${catKey}.rating`,
    format: (val) => val ? Number(val).toFixed(1) : '-'
  };

  const fieldRows: RowDef[] = categoryConfig.fields.map((f: any) => ({
    label: t(`common.fields.${f.key}`),
    key: `filterData.${catKey}.fields.${f.key}.value`,
    format: (val: any) => {
      if (val === null || val === undefined) return '-';
      if (f.type === 'boolean') {
          if (typeof val === 'number') return formatNumber(val);
          return val ? t('common.status.yes') : t('common.status.no');
      }
      if (f.type === 'price') return formatPrice(val);
      if (f.type === 'number' || f.type === 'numeric') return formatNumber(val);
      return safeStringify(val);
    }
  }));

  return [catHeader, ratingRow, ...fieldRows];
};

interface PdfReportTemplateProps {
  readonly districts: TransformedDistrict[];
  readonly customData: ExportCustomData | null;
  readonly config: DynamicDistrictConfig | null;
}

export default function PdfReportTemplate({ districts, customData, config }: PdfReportTemplateProps) {
  const { t } = useTranslation('db');

  const rows = useMemo(() => {
    if (!districts.length) return [];
    
    const baseRows: RowDef[] = [
      { label: t('common.fields.propertyPricePerSqm'), key: 'filterData.general.propertyPrice', format: (val) => formatPrice(val as string | number | null) },
      { label: t('common.fields.average_rent_price'), key: 'filterData.general.average_rent_price', format: (val) => formatPrice(val as string | number | null) },
      { label: t('common.fields.population'), key: 'filterData.general.population', format: (val) => formatNumber(val as string | number | null) },
    ];

    if (!config) return baseRows;

    const categoryRows = Object.values(config).flatMap(cat => buildCategoryRows(cat.key, cat, t));
    return [...baseRows, ...categoryRows];
  }, [districts, config, t]);

  if (!districts.length) return null;

  const { agencyName, phone, website, comments, logo } = customData || {};

  let agencyHeaderContent = null;
  if (logo) {
    agencyHeaderContent = <img src={logo as string} alt="Agency Logo" className="max-h-[50px] max-w-[150px] object-contain" />;
  } else if (agencyName) {
    agencyHeaderContent = <div className="text-lg font-bold text-[#4a5568] uppercase">{agencyName}</div>;
  }

  return (
    <div style={{ width: '794px', minHeight: '1122px', padding: '30px', backgroundColor: '#ffffff', color: '#2d3748', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-start border-b-2 border-[#cbd5e0] pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a202c] m-0 uppercase tracking-wide">
            {t('stats.export.report_title')}
          </h1>
          <p className="text-xs text-[#718096] mt-2 mb-0 font-medium">
            {t('stats.labels.report_date')}: {new Date().toLocaleDateString('uk-UA')}
          </p>
        </div>
        {agencyHeaderContent}
      </div>

      {comments && (
         <div className="bg-[#f7fafc] p-4 rounded border border-[#e2e8f0] mb-6 text-[11px] text-[#4a5568]">
           <strong className="block mb-1 text-[#2d3748]">{t('stats.export.agent_comments')}:</strong>
           {comments}
         </div>
      )}

      {/* TABLE */}
      <div className="w-full">
        <table className="w-full border-collapse">
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
                  <tr key={rowKey} className="bg-[#edf2f7]">
                    <td colSpan={districts.length + 1} className="py-2 px-3 text-left font-bold text-[#2d3748] text-[11px] uppercase border-y border-[#cbd5e0]">
                      {row.title}
                    </td>
                  </tr>
                );
              }

              const bestVal = row.key ? getBestValue(row.key, districts) : null;

              return (
                <tr key={rowKey}>
                  <td className="py-2 px-3 border-b border-[#e2e8f0] text-left text-[10px] font-semibold text-[#4a5568] w-[180px] bg-[#f8fafc]">
                    {row.label}
                  </td>
                  {districts.map((d) => {
                    const rawVal = row.key ? getValue(d, row.key) : null;
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

      {/* FOOTER */}
      <div className="absolute bottom-8 left-[30px] right-[30px] pt-4 border-t border-[#cbd5e0] flex justify-between items-center text-[9px] text-[#718096]">
        <div className="flex gap-4">
          {website && <span className="flex items-center gap-1"><FaGlobe /> {website}</span>}
          {phone && <span className="flex items-center gap-1"><FaPhone /> {phone}</span>}
        </div>
        <div className="uppercase tracking-widest">
          {t('stats.labels.generated_auto')} <strong>GeoAnalyzer</strong>
        </div>
      </div>
    </div>
  );
}