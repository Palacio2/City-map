import React, { useState } from 'react';
import { supabase } from '@supabaseClient';
import { METRIC_GROUPS } from '../../config/metricsConfig';
import MapEditorModal from '../map/MapEditorModal';
import StatGroup from './StatGroup';
import styles from './ResultsTable.module.css';
import uiStyles from '../../ui/AdminUI.module.css';
import { useTranslation } from 'react-i18next';

const DistrictRow = ({ row, index, onEdit, onSave, onRemove }) => {
    const { t } = useTranslation('admin');
    const [isOpen, setIsOpen] = useState(false);
    const [isMapEditorOpen, setIsMapEditorOpen] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [uploading, setUploading] = useState(false);

const handlePhotoUpload = async () => {
        if (!photoFile) return;
        setUploading(true);
        try {
            const fileExt = photoFile.name.split('.').pop();
            const fileName = `${row.district_id}-${Date.now()}.${fileExt}`;
            
            // 1. Завантажуємо фізичний файл у бакет
            const { error: upErr } = await supabase.storage.from('district-photos').upload(fileName, photoFile, { upsert: true });
            if (upErr) throw upErr;
            
            // 2. Дістаємо публічне посилання на це фото
            const { data: urlData } = supabase.storage.from('district-photos').getPublicUrl(fileName);
            
            // 3. РОБИМО ЗАПИС У БАЗУ ДАНИХ (ось цього кроку нам не вистачало!)
            const { error: dbErr } = await supabase
                .from('district_photos')
                .upsert({ 
                    district_id: row.district_id, 
                    photo_url: urlData.publicUrl, 
                    is_main: true 
                }, { onConflict: 'district_id' });
                
            if (dbErr) throw dbErr;

            alert(t('resultsTable.uploadSuccess', {defaultValue: 'Фото успішно збережено!'}));
            setPhotoFile(null);
        } catch (error) {
            console.error("Помилка завантаження фото:", error);
            alert(t('resultsTable.uploadError', {defaultValue: 'Помилка завантаження'}) + ': ' + error.message);
        } finally { 
            setUploading(false);
        }
    };

    const handleSaveAndHide = async () => {
        try {
            await onSave([row]);
            onRemove(row.district_id); 
        } catch (error) {
            console.error(error);
        } 
    };

    const handleDownloadJson = (e) => {
        e.stopPropagation();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(row, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `${row.district_name}_stats.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
    };

    const handleRemove = (e) => {
        e.stopPropagation();
        onRemove(row.district_id);
    };

    const handleSaveMapData = (updatedPois, updatedCounts) => {
        onEdit(index, 'poi_data', updatedPois);
        Object.keys(updatedCounts).forEach(key => onEdit(index, key, updatedCounts[key]));
        METRIC_GROUPS.flatMap(g => g.fields).forEach(f => {
            if (f.type === 'number' && f.key.includes('_count') && !updatedCounts[f.key]) {
                onEdit(index, f.key, 0);
            }
        });
    };

    return (
        <div className={`${styles.accordionItem} ${row.error ? styles.accordionItemError : ''}`}>
            <MapEditorModal 
                isOpen={isMapEditorOpen} 
                onClose={() => setIsMapEditorOpen(false)} 
                rowData={row}
                onSaveMapData={handleSaveMapData}
            />

            <div className={styles.accordionHeader} onClick={() => setIsOpen(!isOpen)}>
                <div className={styles.headerLeft}>
                    <strong className={styles.headerTitle}>{row.district_name}</strong> 
                    {row.population !== undefined && <span className={styles.popBadge}>👥 {row.population || 0}</span>}
                </div>
<div className={styles.headerRight}>
    {row.air_quality > 0 && <span className={styles.airBadge}>🍃 AQI: {row.air_quality}</span>}
    <button type="button" onClick={handleDownloadJson} className={styles.actionBtn}>📥 JSON</button>
    
    {/* ОНОВЛЕНО: Тепер кнопка GIS показується завжди, якщо є хоч якісь гео-дані або точки */}
    {(row.geojson || row.poi_data || row.parsed_pois) && (
        <button type="button" onClick={(e) => { e.stopPropagation(); setIsMapEditorOpen(true); }} className={`${styles.actionBtn} ${styles.gisBtn}`}>
            🗺️ GIS
        </button>
    )}
    
    <button type="button" onClick={handleRemove} className={`${styles.actionBtn} ${styles.deleteBtn}`}>🗑️</button>
    <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>▼</span>
</div>
            </div>

            <div className={`${styles.accordionBody} ${isOpen ? styles.open : ''}`}>
                <div className={styles.accordionInner}>
                    <div className={styles.accordionContent}>
                        <div className={styles.gridContainer}>
                            {METRIC_GROUPS.map(group => {
                                const hasFields = group.fields.some(f => row[f.key] !== undefined);
                                if (!hasFields) return null;
                                return (
                                    <StatGroup 
                                        key={group.id} 
                                        label={group.label} 
                                        icon={group.icon} 
                                        bgColor={group.bgColor} 
                                        data={row} 
                                        onChange={(k, v) => onEdit(index, k, v)} 
                                        fields={group.fields.filter(f => !f.hideInResults)} 
                                    />
                                );
                            })}
                        </div>
                        <div className={styles.footerRow}>
                            <div className={styles.photoBox}>
                                <span className={styles.photoLabel}>{t('resultsTable.photoLabel')}</span>
                                <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} style={{fontSize: '0.85rem', color: 'var(--text-muted)'}} />
                                <button type="button" onClick={handlePhotoUpload} disabled={!photoFile || uploading} className={`${uiStyles.btn} ${uiStyles.btnCancel}`} style={{padding: '6px 12px'}}>
                                    {uploading ? t('resultsTable.uploading') : t('resultsTable.uploadBtn')}
                                </button>
                            </div>
                            <button type="button" onClick={handleSaveAndHide} className={`${uiStyles.btn} ${uiStyles.btnSuccess}`}>
                                {t('resultsTable.saveRow')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(DistrictRow);