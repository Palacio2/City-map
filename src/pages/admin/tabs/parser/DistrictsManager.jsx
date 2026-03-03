// DistrictsManager.jsx
import React from 'react';
import styles from './DistrictsManager.module.css';

export default function DistrictsManager({ 
    foundDistricts, dbDistricts, 
    selectedIds, onToggleSelect, onSelectAll, 
    onScan, onCreate, onRemoveFromFound, onDeleteDbDistrict, 
    onImportGeoJson, loading 
}) {
    return (
        <div className={styles.districtsSplit}>
            <div className={styles.districtsList}>
                <div className={styles.listHeader}>
                    <h4>🔍 Знайдено в OSM <span className={styles.badge}>{foundDistricts.length}</span></h4>
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

            <div className={styles.districtsList}>
                <div className={styles.listHeader}>
                    <h4>🗄️ Райони в базі <span className={styles.badge}>{foundDistricts.length}</span></h4>
                    <div className={styles.headerActions}>
                        <input 
                            type="file" 
                            accept=".geojson,application/geo+json" 
                            style={{ display: 'none' }} 
                            id="geojson-upload" 
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    onImportGeoJson(e.target.files[0]);
                                    e.target.value = null;
                                }
                            }}
                        />
                        <button onClick={() => document.getElementById('geojson-upload').click()} disabled={loading} className={styles.textBtn}>
                            🗺️ Імпорт GeoJSON
                        </button>
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