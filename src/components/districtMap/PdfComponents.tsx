import React from 'react';
import { TFunction } from 'i18next';
import { TransformedCategory } from '@utils/dataTransformers';

const pdfStyles = {
  statRowContainer: {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    fontSize: '11px', 
    lineHeight: '1.4', 
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
    marginBottom: '20px', 
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
  sectionRating: (bg: string) => ({
    color: '#ffffff', 
    fontSize: '11px', 
    fontWeight: 700, 
    padding: '2px 6px', 
    minWidth: '20px', 
    textAlign: 'center' as const, 
    borderRadius: '4px', 
    backgroundColor: bg
  }),
  sectionBody: {
    padding: '10px 12px', 
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

  return (
    <div style={pdfStyles.sectionContainer}>
      <div style={pdfStyles.sectionHeader}>
        <span style={pdfStyles.sectionIcon}>{data.icon || categoryConfig.icon}</span>
        <h3 style={pdfStyles.sectionTitle}>
          {t(`categories.${categoryConfig.key}`)}
        </h3>
        <span style={pdfStyles.sectionRating(getRatingBg(data.rating))}>
          {(data.rating || 0).toFixed(1)}
        </span>
      </div>
      <div style={pdfStyles.sectionBody}>
        {Object.values(data.fields).map((fieldData) => {
           if (fieldData.value === null || fieldData.value === undefined) return null;

           return (
             <StatRow 
                key={fieldData.key}
                label={t(`fields.${fieldData.key}`)}
                value={formatValue(fieldData.value, fieldData.type, fieldData.key)}
             />
           );
        })}
      </div>
    </div>
  ); 
};