import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPhone, FaGlobe, FaBuilding, FaQuoteLeft, FaMapMarkerAlt } from 'react-icons/fa';
import { DISTRICT_CATEGORIES } from '@config/districtFields';
import { getValue, formatPrice, formatNumber, formatBoolean, formatLevel } from '@utils/formatters.jsx';

const LOW_IS_BETTER = [
  'filterData.utilities.propertyPricePerSqm',
  'filterData.general.average_rent_price',
  'filterData.general.unemploymentRate',
  'filterData.safety.crimeLevel',
  'filterData.utilities.costPerSqm'
];

const getBestValue = (key, districts) => {
  const values = districts.map(d => getValue(d, key)).filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return null;
  return LOW_IS_BETTER.includes(key) ? Math.min(...values) : Math.max(...values);
};

export default function PdfReportTemplate({ districts, customData, isPremium = true, isRealtor = true }) {
  const { t, i18n } = useTranslation(['db', 'common']);
  const { logo, agencyName = 'GeoAnalyzer', website = '', phone = '', comments } = customData || {};

  const sections = useMemo(() => {
    if (!districts?.length) return [];
    
    const staticSection = {
      title: t('common:categories.finance_population'),
      rows: [
        { label: t('common:fields.propertyPricePerSqm'), key: 'filterData.utilities.propertyPricePerSqm', format: (v, d) => formatPrice(v, d.country) },
        { label: t('common:fields.average_rent_price'), key: 'filterData.general.average_rent_price', format: (v, d) => formatPrice(v, d.country) },
        { label: t('common:fields.averageSalary'), key: 'filterData.general.averageSalary', format: (v, d) => formatPrice(v, d.country) },
        { label: t('common:fields.population'), key: 'filterData.general.population', format: (v) => formatNumber(v) },
        { label: t('common:fields.unemploymentRate'), key: 'filterData.general.unemploymentRate', format: (v) => formatNumber(v, '%') },
      ]
    };

    const dynamicSections = Object.values(DISTRICT_CATEGORIES).map(category => {
      if (category.isPremium && !isPremium) return null;
      
      const fields = category.fields
        .filter(f => !f.isRealtorOnly || isRealtor)
        .map(f => {
          let formatter = (v) => formatNumber(v);
          
          if (f.type === 'boolean') {
            formatter = (v) => formatBoolean(v, t, false);
          } else if (f.type === 'text') {
            formatter = (v) => formatLevel(v, t);
          } else if (f.key === 'greenSpaces') {
            formatter = (v) => formatNumber(v, '%');
          } else if (f.key === 'bikeLanes') {
            formatter = (v) => formatNumber(v, ` ${t('common:units.km')}`);
          } else if (f.key === 'avgParkSize' || f.key === 'transportAvgDistance') {
            const unit = f.key === 'avgParkSize' ? t('common:units.sqm') : t('common:units.m');
            formatter = (v) => formatNumber(v, ` ${unit}`);
          }

          return {
            label: t(`common:fields.${f.key}`),
            key: `filterData.${category.key}.${f.key}`,
            format: formatter
          };
        });
        
      return fields.length ? { title: t(`common:categories.${category.key}`), rows: fields } : null;
    }).filter(Boolean);

    return [staticSection, ...dynamicSections];
  }, [districts, t, isPremium, isRealtor]);

  if (!districts?.length) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');
        
        .pdf-table-row { page-break-inside: avoid; page-break-after: auto; }
        .pdf-table { page-break-inside: auto; }
      `}</style>
      
      <div id="pdf-report-template" className="w-[794px] min-h-[1123px] bg-white p-[40px] box-border flex flex-col relative" style={{ fontFamily: "'Inter', sans-serif", color: '#2d3748', textRendering: 'optimizeLegibility', WebkitFontSmoothing: 'antialiased' }}>
        
        {/* === HEADER === */}
        <div className="flex justify-between items-end border-b-2 border-[#1a202c] pb-5 mb-[25px]">
          <div className="flex items-center gap-[15px]">
            <div className={`w-[48px] h-[48px] flex items-center justify-center text-[22px] text-[#1a202c] rounded-lg ${logo ? 'p-0 bg-transparent' : 'bg-[#edf2f7]'}`}>
              {logo ? <img src={logo} alt="Logo" className="w-full h-full object-contain" /> : <FaBuilding />}
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold uppercase tracking-[0.5px] text-[#1a202c] m-0 leading-[1.1]">{agencyName}</h1>
              <p className="m-0 mt-1 text-[10px] text-[#718096] uppercase tracking-[1px] font-medium">{new Date().toLocaleDateString(i18n.language)}</p>
            </div>
          </div>
          <div>
            <p className="text-[26px] text-[#c5a572] m-0 italic font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>{t('comparison.pdf_report.analytics_report')}</p>
          </div>
        </div>

        {/* === COMMENTS === */}
        {comments && (
          <div className="mb-[25px] py-4 px-5 bg-[#fdfbf7] border-l-[3px] border-[#c5a572] rounded-r-md">
            <h3 className="text-[#c5a572] text-[11px] uppercase tracking-[1.2px] m-0 mb-2 flex items-center gap-2 font-bold"><FaQuoteLeft size={12} /> {t('comparison.pdf_report.analyst_notes')}</h3>
            <p className="text-[13px] leading-relaxed text-[#2d3748] m-0 whitespace-pre-wrap" style={{ fontFamily: "'Playfair Display', serif" }}>{comments}</p>
          </div>
        )}

        {/* === TABLE === */}
        <div className="flex-auto w-full mb-[40px]">
          <table className="w-full border-collapse pdf-table">
            <thead>
              <tr>
                <th className="text-left w-[30%] rounded-tl-md pl-3 bg-[#1a202c] text-white py-2.5 px-2 text-[10px] uppercase tracking-[0.8px] font-semibold border border-[#1a202c]">{t('comparison.metric')}</th>
                {districts.map((d, i) => (
                  <th key={d.id || i} className="text-center bg-[#1a202c] text-white py-2.5 px-2 text-[10px] uppercase tracking-[0.8px] font-semibold border border-[#1a202c]">
                    <div className="text-[12px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] inline-block align-middle">{d.name}</div>
                    <div className="text-[9px] opacity-80 font-normal flex items-center justify-center gap-1 mt-0.5"><FaMapMarkerAlt style={{fontSize: '8px'}}/> {d.city}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section, sIdx) => (
                <React.Fragment key={`pdf-sec-${sIdx}`}>
                  <tr className="pdf-table-row">
                    <td colSpan={districts.length + 1} className="py-3 px-3 pb-1.5 font-bold text-[14px] text-[#1a202c] border-b-2 border-[#c5a572] bg-white" style={{ fontFamily: "'Playfair Display', serif" }}>{section.title}</td>
                  </tr>
                  {section.rows.map((row, rIdx) => {
                    const bestValue = getBestValue(row.key, districts);
                    return (
                      <tr key={`pdf-row-${sIdx}-${rIdx}`} className="pdf-table-row even:bg-[#f8fafc]">
                        <td className="py-2 px-1.5 text-[12px] border-b border-[#e2e8f0] h-[32px] align-middle text-[#4a5568] font-medium pl-3">{row.label}</td>
                        {districts.map((d, dIdx) => {
                          const rawVal = getValue(d, row.key);
                          const isWinner = typeof rawVal === 'number' && !isNaN(rawVal) && rawVal === bestValue;
                          return (
                            <td key={`pdf-cell-${dIdx}`} className={`py-2 px-1.5 text-[12px] border-b border-[#e2e8f0] h-[32px] align-middle text-center font-medium tabular-nums ${isWinner ? 'text-[#15803d] font-bold bg-green-500/10 rounded' : 'text-[#2d3748]'}`}>
                              {row.format ? row.format(rawVal, d) : (rawVal ?? '-')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* === FOOTER === */}
        <div className="mt-auto pt-[15px] border-t border-[#e2e8f0] flex justify-between items-center text-[9px] text-[#a0aec0] w-full">
          <div className="flex gap-5">
            {website && <span className="flex items-center gap-1.5 text-[#4a5568] font-semibold"><FaGlobe /> {website}</span>}
            {phone && <span className="flex items-center gap-1.5 text-[#4a5568] font-semibold"><FaPhone /> {phone}</span>}
          </div>
          <div className="text-right max-w-[250px]">
            {t('comparison.pdf_report.prepared_by')} <strong className="text-[#4a5568]">{agencyName}</strong>. {new Date().getFullYear()}.
          </div>
        </div>
      </div>
    </>
  );
}