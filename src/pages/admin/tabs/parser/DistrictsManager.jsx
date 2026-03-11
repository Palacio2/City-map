import React, { useRef } from 'react';
import styles from './DistrictsManager.module.css';
import uiStyles from '../../ui/AdminUI.module.css';
import { useTranslation } from 'react-i18next';
import { FaTrash, FaPlus, FaCheckDouble } from 'react-icons/fa';

const DistrictsManager = ({ 
    foundDistricts, dbDistricts, 
    selectedIds, onToggleSelect, onSelectAll, 
    onScan, onCreate, onRemoveFromFound, onDeleteDbDistrict, 
    onImportGeoJson, loading, isSuperAdmin 
}) => {
    const { t } = useTranslation('admin');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onImportGeoJson(file);
        }
        e.target.value = null; 
    };

    return (
        <div className={styles.districtsSplit}>
            <div className={styles.districtsList}>
                <div className={styles.listHeader}>
                    <h4>{t('districtsManager.foundOSM')} <span className={styles.badge}>{foundDistricts.length}</span></h4>
                    <div className={styles.headerActions}>
                        {/* Кнопка "Шукати" */}
                        <button onClick={onScan} disabled={loading} className={`${uiStyles.btn} ${uiStyles.btnPrimary} ${styles.scanBtn}`}>
                            {loading ? t('districtsManager.searching') : t('districtsManager.searchBtn')}
                        </button>
                        
                        {/* НОВА КНОПКА: "Додати всі" (показується тільки якщо є знайдені райони) */}
                        {foundDistricts.length > 0 && (
                            <button 
                                onClick={() => onCreate(foundDistricts)} 
                                className={`${uiStyles.btn} ${uiStyles.btnSuccess}`}
                                title={t('districtsManager.addAll', {defaultValue: 'Додати всі знайдені'})}
                                style={{ padding: '8px 12px' }}
                            >
                                <FaCheckDouble />
                            </button>
                        )}
                    </div>
                </div>
                <div className={styles.listContent}>
                    {foundDistricts.length === 0 && <div className={styles.emptyMsg}>{t('districtsManager.emptyFound')}</div>}
                    {foundDistricts.map((d, i) => (
                        <div key={i} className={styles.districtItem}>
                            <span className={styles.itemName}>{d.name}</span>
                            <div className={styles.itemActions}>
                                <button onClick={() => onCreate([d])} className={styles.textBtn} style={{ color: 'var(--success)' }}>
                                    <FaPlus />
                                </button>
                                <button onClick={() => onRemoveFromFound(d.name)} className={styles.iconBtn} title="Remove">
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.districtsList}>
                <div className={styles.listHeader}>
                    <h4>{t('districtsManager.dbDistricts')} <span className={styles.badge}>{dbDistricts.length}</span></h4>
                    <div className={styles.headerActions}>
                        <input 
                            type="file" 
                            accept=".geojson,.json" 
                            style={{ display: 'none' }} 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                        />
                        <button onClick={() => fileInputRef.current?.click()} className={styles.textBtn}>
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
                            {isSuperAdmin && (
                                <button onClick={(e) => { e.stopPropagation(); onDeleteDbDistrict(d.id); }} className={styles.iconBtn} style={{color: 'var(--danger)'}} title={t('districtsManager.deleteFromDb')}>
                                    <FaTrash />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(DistrictsManager);