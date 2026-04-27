import React from 'react';
import { TFunction } from 'i18next';
import { TransformedCategory } from '@utils/dataTransformers';

const pdfStyles = {
  statRowContainer: {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    fontSize: '11px', 
    paddingBottom: '5px', 
    borderBottom: '1px dotted #e5e7eb', 
    marginBottom: '5px'
  },
  statRowLabel: {
    color: '#666666', 
    fontWeight: 500
  },
  statRowValue: (highlight: boolean) => ({
    fontWeight: 700, 
    textAlign: 'right' as const, 
    color: highlight ? '#c5a47e' : '#000000'
  }),
  sectionContainer: {
    backgroundColor: '#ffffff', 
    border: '1px solid #e5e7eb', 
    width: '100%', 
    marginBottom: '15px', 
    pageBreakInside: 'avoid' as const
  },
  sectionHeader: {
    backgroundColor: '#f1f5f9', 
    padding: '8px 12px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px', 
    borderBottom: '1px solid #e5e7eb'
  },
  sectionIcon: {
    fontSize: '14px', 
    color: '#000000'
  },
  sectionTitle: {
    fontSize: '11px', 
    fontWeight: 700, 
    color: '#000000', 
    margin: 0, 
    flexGrow: 1, 
    textTransform: 'uppercase' as const
  },
  sectionBody: {
    padding: '8px 12px', 
    display: 'flex', 
    flexDirection: 'column' as const
  }
};

export interface StatRowProps {
  readonly label: string;
  readonly value: string | number;
  readonly highlight?: boolean;
}

export const StatRow: React.FC<StatRowProps> = ({ label, value, highlight = false }) => (
  <div style={pdfStyles.statRowContainer}>
    <span style={pdfStyles.statRowLabel}>{label}</span>
    <span style={pdfStyles.statRowValue(highlight)}>{value}</span>
  </div>
);

export const getRatingBg = (rating?: number | null): string => {
  if (!rating) return '#000000';
  if (rating >= 8) return '#22c55e';
  if (rating >= 5) return '#eab308';
  return '#ef4444';
};

export interface SectionProps {
  readonly categoryConfig: { readonly key: string; readonly icon?: string };
  readonly data: TransformedCategory;
  readonly t: TFunction;
  readonly formatValue: (value: any, type: string, fieldKey: string) => string | number;
}

export const Section: React.FC<SectionProps> = ({ categoryConfig, data, t, formatValue }) => {
  if (!data?.fields) return null;

  const bg = getRatingBg(data.rating);
  const ratingText = (data.rating || 0).toFixed(1);

  return (
    <div style={pdfStyles.sectionContainer}>
      <div style={pdfStyles.sectionHeader}>
        <span style={pdfStyles.sectionIcon}>{data.icon || categoryConfig.icon}</span>
        <h3 style={pdfStyles.sectionTitle}>
          {t(`groups.${categoryConfig.key}`, { defaultValue: categoryConfig.key })}
        </h3>
        
        {/* ЯДЕРНА ЗБРОЯ: SVG графіка. Тут текст фізично не може зсунутися! */}
        <div style={{ width: '32px', height: '20px', flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="20" viewBox="0 0 32 20" style={{ display: 'block' }}>
            {/* Прямокутник із закругленими кутами */}
            <rect width="32" height="20" rx="4" fill={bg} />
            {/* Текст жорстко відцентрований по координатах */}
            <text x="16" y="14" fontFamily="sans-serif" fontSize="11px" fontWeight="bold" fill="#ffffff" textAnchor="middle">
              {ratingText}
            </text>
          </svg>
        </div>

      </div>
      <div style={pdfStyles.sectionBody}>
        {Object.values(data.fields).map((fieldData) => {
           if (fieldData.value === null || fieldData.value === undefined) return null;

           return (
             <StatRow 
                key={fieldData.key}
                label={t(`common.fields.${fieldData.key}`, { defaultValue: t(fieldData.key) })}
                value={formatValue(fieldData.value, fieldData.type, fieldData.key)}
             />
           );
        })}
      </div>
    </div>
  ); 
};