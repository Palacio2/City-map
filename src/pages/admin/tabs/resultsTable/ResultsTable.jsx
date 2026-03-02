import React from 'react';
import DistrictRow from './DistrictRow';
import styles from './ResultsTable.module.css';

export default function ResultsTable({ data, onEdit, onSave, onRemove }) {
    if (!data || data.length === 0) return null;
    
    return (
        <div className={styles.tableWrapper}>
            <div className={styles.headerRow}>
                <h3>📊 Результати до збереження ({data.length})</h3>
                <button type="button" onClick={() => onSave(data)} className={`${styles.btn} ${styles.saveBtn}`}>
                    💾 ЗБЕРЕГТИ ВСІ ({data.length})
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