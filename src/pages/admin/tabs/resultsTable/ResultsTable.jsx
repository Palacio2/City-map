import React from 'react';
import DistrictRow from './DistrictRow';
import styles from './ResultsTable.module.css';
import { useTranslation } from 'react-i18next';

export default function ResultsTable({ data, onEdit, onSave, onRemove }) {
    const { t } = useTranslation('admin');
    
    if (!data || data.length === 0) return null;
    
    return (
        <div className={styles.tableWrapper}>
            <div className={styles.headerRow}>
                <h3>📊 {t('resultsTable.title')} ({data.length})</h3>
                <button type="button" onClick={() => onSave(data)} className={`${styles.btn} ${styles.saveBtn}`}>
                    {t('resultsTable.saveAll')} ({data.length})
                </button>
            </div>
            <div className={styles.queueList}>
                {data.map((row, i) => (
                    <DistrictRow 
                        key={row.district_id ? `${row.district_id}-${i}` : `temp-${i}`} 
                        row={row} 
                        index={i} 
                        onEdit={onEdit} 
                        onSave={onSave} 
                        onRemove={onRemove} 
                    />
                ))}
            </div>
        </div>
    );
}