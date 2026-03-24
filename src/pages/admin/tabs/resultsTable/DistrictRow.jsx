import React, { useState } from 'react';
import { supabase } from '@supabaseClient';
import { api } from '../../../../services/api';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import MapEditorModal from '../map/MapEditorModal';
import { DynamicFormRenderer } from '../../ui/DynamicFormRenderer';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useTranslation } from 'react-i18next';
import { useModals } from '../../ui/ModalContext';

const DistrictRow = ({ row, onEdit, onSave, onRemove }) => {
    const { t } = useTranslation('adminResults');
    const { showAlert } = useModals();
    const { fieldsConfig } = useDynamicFields();
    
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
            
            const publicUrl = await api.storage.uploadDistrictPhoto(fileName, photoFile);
            
            const { error: dbErr } = await supabase
                .from('district_photos')
                .upsert({ 
                    district_id: row.district_id, 
                    photo_url: publicUrl, 
                    is_main: true 
                }, { onConflict: 'district_id' });
                
            if (dbErr) throw dbErr;

            showAlert(t('common.success', {defaultValue: 'Успіх'}), t('resultsTable.uploadSuccess', {defaultValue: 'Фото успішно збережено!'}), 'success');
            setPhotoFile(null);
        } catch (error) {
            console.error(error);
            showAlert(t('common.error', {defaultValue: 'Помилка'}), t('resultsTable.uploadError', {defaultValue: 'Помилка завантаження'}) + ': ' + error.message, 'error');
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
        onEdit(row.district_id, 'poi_data', updatedPois);
        Object.keys(updatedCounts).forEach(key => onEdit(row.district_id, key, updatedCounts[key]));
        
        (fieldsConfig || []).forEach(f => {
            if (f.data_type === 'integer' && f.field_code.includes('_count') && !updatedCounts[f.field_code]) {
                onEdit(row.district_id, f.field_code, 0);
            }
        });
    };

    const actionBtnBase = "py-1.5 px-3 rounded-md text-[0.85rem] font-bold cursor-pointer transition-all shadow-sm border flex items-center gap-1.5";

    return (
        <div className={`bg-surface rounded-xl border transition-all overflow-hidden shadow-sm hover:shadow-md hover:border-textMuted/50 ${row.error ? 'border-l-4 border-l-danger border-y-border border-r-border' : 'border-border'}`}>
            <MapEditorModal 
                isOpen={isMapEditorOpen} 
                onClose={() => setIsMapEditorOpen(false)} 
                rowData={row}
                onSaveMapData={handleSaveMapData}
            />

            <div className="flex justify-between items-center p-4 sm:px-6 cursor-pointer select-none bg-surface transition-colors hover:bg-main/50" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-3">
                    <strong className="text-[1.05rem] text-textMain font-extrabold tracking-tight">{row.district_name}</strong> 
                    {row.population !== undefined && <Badge variant="primary">👥 {row.population || 0}</Badge>}
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                    {row.air_quality > 0 && <Badge variant="success">🍃 AQI: {row.air_quality}</Badge>}
                    
                    <button type="button" onClick={handleDownloadJson} className={`${actionBtnBase} bg-surface border-border text-textMuted hover:bg-main hover:text-textMain`}>
                        📥 <span className="hidden sm:inline">JSON</span>
                    </button>
                    
                    {(row.geojson || row.poi_data || row.parsed_pois) && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setIsMapEditorOpen(true); }} className={`${actionBtnBase} text-primary border-blue-500/30 bg-blue-500/5 hover:bg-primary hover:text-white hover:border-primary`}>
                            🗺️ <span className="hidden sm:inline">GIS</span>
                        </button>
                    )}
                    
                    <button type="button" onClick={handleRemove} className={`${actionBtnBase} text-danger border-red-500/30 bg-red-500/5 hover:bg-danger hover:text-white hover:border-danger`}>
                        🗑️
                    </button>
                    
                    <div className={`text-textMuted text-[0.8rem] ml-2 transition-transform duration-300 flex items-center justify-center w-6 h-6 rounded-full bg-main ${isOpen ? 'rotate-180 bg-blue-500/10 text-primary' : ''}`}>▼</div>
                </div>
            </div>

            <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="px-4 sm:px-6 pb-6 border-t border-border mt-0 pt-6 bg-main/30">
                        
                        <DynamicFormRenderer 
    fieldsConfig={(fieldsConfig || []).filter(f => f.is_visible_form === true)} 
    formData={row} 
    onChange={(code, value) => onEdit(row.district_id, code, value)} 
/>

                        <div className="mt-8 pt-6 border-t border-border flex justify-between items-center flex-wrap gap-4">
                            <div className="flex gap-4 items-center bg-surface py-3 px-5 rounded-xl border border-border shadow-sm w-full md:w-auto">
                                <div className="w-10 h-10 bg-blue-500/10 text-primary rounded-lg flex items-center justify-center text-[1.2rem]">
                                    📸
                                </div>
                                <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                                    <span className="font-bold text-textMain text-[0.9rem] leading-none">{t('resultsTable.photoLabel')}</span>
                                    <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} className="text-[0.8rem] text-textMuted font-medium w-[200px]" />
                                </div>
                                <Button variant="cancel" type="button" onClick={handlePhotoUpload} disabled={!photoFile || uploading} className="!py-2 !px-4 !text-[0.85rem] shrink-0">
                                    {uploading ? t('resultsTable.uploading') : t('resultsTable.uploadBtn')}
                                </Button>
                            </div>
                            <Button variant="success" type="button" onClick={handleSaveAndHide} className="w-full md:w-auto !py-3 !px-8">
                                {t('resultsTable.saveRow')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(DistrictRow);