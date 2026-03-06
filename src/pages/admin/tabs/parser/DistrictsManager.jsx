// DistrictsManager.jsx
import React from 'react';
import styles from './DistrictsManager.module.css';
import { useTranslation } from 'react-i18next';

export default function DistrictsManager({ 
    foundDistricts, dbDistricts, 
    selectedIds, onToggleSelect, onSelectAll, 
    onScan, onCreate, onRemoveFromFound, onDeleteDbDistrict, 
    onImportGeoJson, loading 
}) {
    const { t } = useTranslation('admin');

    return (
        <div className={styles.districtsSplit}>
            <div className={styles.districtsList}>
                <div className={styles.listHeader}>
                    <h4>{t('districtsManager.foundOSM')} <span className={styles.badge}>{foundDistricts.length}</span></h4>
                    <button onClick={onScan} disabled={loading} className={`${styles.btn} ${styles.scanBtn}`}>
                        {loading ? t('districtsManager.searching') : t('districtsManager.searchBtn')}
                    </button>
                </div>
                <div className={styles.listContent}>
                    {foundDistricts.length === 0 && <div className={styles.emptyMsg}>{t('districtsManager.emptyFound')}</div>}
                    {foundDistricts.map((d, i) => (
                        <div key={i} className={styles.districtItem}>
                            <span className={styles.itemName}>{d.name}</span>
                            <button onClick={() => onRemoveFromFound(d)} className={styles.iconBtn} title={t('districtsManager.deleteTitle')}>❌</button>
                        </div>
                    ))}
                </div>
                {foundDistricts.length > 0 && (
                    <button onClick={onCreate} disabled={loading} className={`${styles.btn} ${styles.saveBtn} ${styles.fullWidthBtn}`}>
                        {t('districtsManager.saveAllDb')}
                    </button>
                )}
            </div>

            <div className={styles.districtsList}>
                <div className={styles.listHeader}>
                    <h4>{t('districtsManager.dbDistricts')} <span className={styles.badge}>{dbDistricts.length}</span></h4>
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
                            {t('districtsManager.importGeo')}
                        </button>
                        <button onClick={() => onSelectAll(true)} className={styles.textBtn}>{t('districtsManager.selectAll')}</button>
                        <button onClick={() => onSelectAll(false)} className={styles.textBtn}>{t('districtsManager.deselectAll')}</button>
                    </div>
                </div>
                <div className={styles.listContent}>
                    {dbDistricts.length === 0 && <div className={styles.emptyMsg}>{t('districtsManager.emptyDb')}</div>}
                    {dbDistricts.map(d => (
                        <div key={d.id} className={`${styles.districtItem} ${selectedIds.includes(d.id) ? styles.selected : ''}`} onClick={() => onToggleSelect(d.id)}>
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" checked={selectedIds.includes(d.id)} readOnly className={styles.checkbox} />
                                <span className={styles.itemName}>{d.name}</span>
                            </label>
                            <button onClick={(e) => { e.stopPropagation(); onDeleteDbDistrict(d.id); }} className={styles.iconBtn} title={t('districtsManager.deleteFromDb')}>🗑️</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}