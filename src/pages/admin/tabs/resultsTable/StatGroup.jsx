import React from 'react';
import styles from './ResultsTable.module.css';

const getWarning = (key, val, row) => {
    const isEmpty = val === 0 || val === null || val === '';
    if (key === 'population' && isEmpty && (row.schools_count > 0 || row.grocery_stores_count > 0 || row.bus_stops_count > 0)) return "Є інфраструктура, але населення 0";
    if (key === 'average_property_price' && val > 5000000) return "Аномально висока ціна продажу";
    if (key === 'average_rent_price' && val > 15000) return "Аномально висока оренда";
    if (key === 'average_salary' && val < 2000 && val > 0) return "Зарплата нижче мінімальної";
    return null;
};

export default function StatGroup({ label, icon, fields, data, onChange, bgColor }) {
    return (
        <div className={styles.statGroup} style={{ background: bgColor || '#ffffff' }}>
            <div className={styles.statHeader}>{icon} {label}</div>
            {fields.map(f => {
                if (data[f.key] === undefined) return null; 

                const val = data[f.key];
                const isMissing = val === null || val === '';
                const warningMsg = getWarning(f.key, val, data);
                
                return (
                    <div key={f.key} className={styles.statRow} title={warningMsg || f.key}>
                        <span>{f.label}: {warningMsg && <span className={styles.warningIcon}>⚠️</span>}</span>
                        
                        {f.type === 'boolean' ? (
                            <select
                                className={`${styles.miniInput} ${styles.selectInput}`}
                                value={isMissing ? '' : (val ? 'true' : 'false')}
                                onChange={e => {
                                    const v = e.target.value;
                                    onChange(f.key, v === '' ? null : v === 'true');
                                }}
                            >
                                <option value="">-</option>
                                <option value="true">Так</option>
                                <option value="false">Ні</option>
                            </select>
                        ) : (
                            <input
                                type={f.type === 'text' ? 'text' : 'number'}
                                className={`${styles.miniInput} ${warningMsg ? styles.inputWarning : ''}`}
                                value={isMissing ? '' : val}
                                onChange={(e) => {
                                    if (f.type === 'text') {
                                        onChange(f.key, e.target.value);
                                    } else {
                                        const rawVal = e.target.value;
                                        const newVal = f.type === 'float' ? parseFloat(rawVal) : parseInt(rawVal, 10);
                                        onChange(f.key, rawVal === '' ? '' : (isNaN(newVal) ? 0 : newVal));
                                    }
                                }}
                                placeholder="0"
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}