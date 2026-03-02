import React, { useState } from 'react';
import { supabase } from '@supabaseClient'; // Тільки для Storage
import { METRIC_GROUPS } from '../../config/metricsConfig';
import MapEditorModal from '../map/MapEditorModal';
import StatGroup from './StatGroup';
import styles from './ResultsTable.module.css';

export default function DistrictRow({ row, index, onEdit, onSave, onRemove }) {
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
            
            // Upload to storage ONLY
            const { error: upErr } = await supabase.storage.from('district-photos').upload(fileName, photoFile, { upsert: true });
            if (upErr) throw upErr;
            
            const { data } = supabase.storage.from('district-photos').getPublicUrl(fileName);
            
            // Замість прямого запису в БД, зберігаємо урл у стані рядка для бекенду (або просто повідомляємо про успіх)
            // Реальний запис в district_photos повинен бути інтегрований у фінальний saveParsedResults на бекенді.
            // Наразі просто сповіщаємо, що фото завантажено.
            alert("Фото завантажено у сховище. Натисніть 'Зберегти зміни і прибрати' щоб застосувати результати.");
            setPhotoFile(null);
        } catch (e) {
            console.error(e);
            alert("Помилка завантаження фото");
        } finally { 
            setUploading(false);
        }
    };

    const handleSaveAndHide = async () => {
        try {
            await onSave([row]);
            onRemove(row.district_id); 
        } catch (e) {}
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
        Object.keys(updatedCounts).forEach(key => {
            onEdit(index, key, updatedCounts[key]);
        });
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
                    {row.population !== undefined && <span className={styles.headerSub}>(Pop: {row.population || 0})</span>}
                </div>
                <div className={styles.headerRight}>
                    {row.air_quality > 0 && <span className={styles.airBadge}>🍃 AQI: {row.air_quality}</span>}
                    <button type="button" onClick={handleDownloadJson} className={styles.actionIconBtn} title="Завантажити JSON">📥 JSON</button>
                    {row.geojson && (
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIsMapEditorOpen(true); }} 
                            className={styles.actionIconBtn} 
                            style={{background: '#4f46e5'}}
                        >
                            🗺️ GIS Редактор
                        </button>
                    )}
                    <button type="button" onClick={handleRemove} className={`${styles.actionIconBtn} ${styles.dangerIconBtn}`} title="Прибрати з результатів">🗑️</button>
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
                                <span className={styles.photoLabel}>📸 Фото для БД:</span>
                                <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className={styles.fileInput} />
                                <button type="button" onClick={handlePhotoUpload} disabled={!photoFile || uploading} className={`${styles.btn} ${styles.primaryBtn}`}>
                                    {uploading ? '⏳...' : 'Завантажити в Storage'}
                                </button>
                            </div>
                            <button type="button" onClick={handleSaveAndHide} className={`${styles.btn} ${styles.saveBtn} ${styles.saveRowBtn}`}>
                                💾 Зберегти зміни і прибрати
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}