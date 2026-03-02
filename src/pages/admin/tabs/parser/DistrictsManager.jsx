import React from 'react';
import styles from './DistrictsManager.module.css';

export default function DistrictsManager({ 
    foundDistricts, dbDistricts, 
    selectedIds, onToggleSelect, onSelectAll, 
    onScan, onCreate, onRemoveFromFound, onDeleteDbDistrict, 
    loading 
}) {
    return (
        <div className={styles.districtsSplit}>
            {/* Ліва колонка: OSM */}
            <div className={styles.districtsList}>
                <div className={styles.listHeader}>
                    <h4>🔍 Знайдено в OSM <span>({foundDistricts.length})</span></h4>
                    <button onClick={onScan} disabled={loading} className={`${styles.btn} ${styles.scanBtn}`}>
                        {loading ? '⏳ Шукаю...' : 'Шукати в PBF/OSM'}
                    </button>
                </div>
                <div className={styles.listContent}>
                    {foundDistricts.length === 0 && <div className={styles.emptyMsg}>Натисніть "Шукати" для початку</div>}
                    {foundDistricts.map((d, i) => (
                        <div key={i} className={styles.districtItem}>
                            <span className={styles.itemName}>{d.name}</span>
                            <button onClick={() => onRemoveFromFound(d)} className={styles.iconBtn} title="Видалити">❌</button>
                        </div>
                    ))}
                </div>
                {foundDistricts.length > 0 && (
                    <button onClick={onCreate} disabled={loading} className={`${styles.btn} ${styles.saveBtn} ${styles.fullWidthBtn}`}>
                        💾 Зберегти всі в БД
                    </button>
                )}
            </div>

            {/* Права колонка: База Даних */}
            <div className={styles.districtsList}>
                <div className={styles.listHeader}>
                    <h4>🗄️ Райони в базі <span>({dbDistricts.length})</span></h4>
                    <div className={styles.headerActions}>
                        <button onClick={() => onSelectAll(true)} className={styles.textBtn}>Всі</button>
                        <button onClick={() => onSelectAll(false)} className={styles.textBtn}>Зняти</button>
                    </div>
                </div>
                <div className={styles.listContent}>
                    {dbDistricts.length === 0 && <div className={styles.emptyMsg}>Немає районів у базі</div>}
                    {dbDistricts.map(d => (
                        <div key={d.id} className={`${styles.districtItem} ${selectedIds.includes(d.id) ? styles.selected : ''}`} onClick={() => onToggleSelect(d.id)}>
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" checked={selectedIds.includes(d.id)} readOnly className={styles.checkbox} />
                                <span className={styles.itemName}>{d.name}</span>
                            </label>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteDbDistrict(d.id); }} className={styles.iconBtn} title="Видалити з БД">🗑️</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}