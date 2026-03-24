import React from 'react';
import { useTranslation } from 'react-i18next';
import { useManualEditor } from './useManualEditor';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { DynamicFormRenderer } from '../../ui/DynamicFormRenderer';
import MapEditorModal from '../map/MapEditorModal';
import { Button } from '../../ui/Button';
import { FaSave, FaTimes, FaMapMarkedAlt, FaImage } from 'react-icons/fa';

export default function ManualEditor({ selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict }) {
    const { t } = useTranslation('adminManual');
    const { fieldsConfig } = useDynamicFields();

    const {
        formData, photoPreview, loading, isMapEditorOpen, setIsMapEditorOpen,
        completeness, handleFileChange, handleSaveDistrict, handleFieldChange,
        handleSaveMapData, handleCancel
    } = useManualEditor(selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict);

    if (!selectedDistrict) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-textMuted bg-surface rounded-xl border border-border shadow-sm p-10">
                <span className="text-[3rem] opacity-50 mb-4">📝</span>
                <h3 className="text-[1.2rem] font-bold text-textMain m-0 mb-2">{t('manualEditor.emptyTitle', 'Оберіть район')}</h3>
                <p className="text-[0.95rem] m-0">{t('manualEditor.emptyDesc', 'Виберіть країну, місто та район ліворуч для редагування.')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
            <MapEditorModal
                isOpen={isMapEditorOpen}
                onClose={() => setIsMapEditorOpen(false)}
                rowData={formData}
                onSaveMapData={handleSaveMapData}
            />

            <div className="bg-surface p-5 sm:p-6 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10">
                <div>
                    <h2 className="m-0 text-[1.4rem] text-textMain font-extrabold tracking-tight flex items-center gap-3">
                        {selectedDistrict.name}
                        <span className="text-[0.8rem] font-bold px-2 py-1 rounded-md bg-main border border-border text-textMuted">
                            {selectedCity?.name}
                        </span>
                    </h2>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button variant="cancel" onClick={handleCancel} disabled={loading} className="flex-1 sm:flex-none !py-2">
                        <FaTimes /> {t('common.cancel', 'Скасувати')}
                    </Button>
                    <Button variant="success" onClick={handleSaveDistrict} disabled={loading} className="flex-1 sm:flex-none !py-2">
                        <FaSave /> {loading ? t('common.saving', 'Збереження...') : t('common.save', 'Зберегти')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 flex flex-col gap-6">
                    <DynamicFormRenderer
                        fieldsConfig={(fieldsConfig || []).filter(f => f.is_visible_form)}
                        formData={formData}
                        onChange={handleFieldChange}
                    />
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                        <h3 className="text-[1.05rem] font-bold text-textMain mb-4 flex items-center gap-2"><FaMapMarkedAlt className="text-primary"/> Геодані (GIS)</h3>
                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-main rounded-lg border border-border flex items-center justify-between">
                                <span className="text-[0.9rem] font-medium text-textMuted">Полігон:</span>
                                <span className={`font-bold text-[0.9rem] ${completeness.geo === 'green' ? 'text-success' : 'text-danger'}`}>
                                    {completeness.geo === 'green' ? 'Є дані' : 'Відсутній'}
                                </span>
                            </div>
                            <Button variant="primary" onClick={() => setIsMapEditorOpen(true)} className="w-full !py-2.5">
                                Відкрити GIS Редактор
                            </Button>
                        </div>
                    </div>

                    <div className="bg-surface p-5 rounded-xl border border-border shadow-sm">
                        <h3 className="text-[1.05rem] font-bold text-textMain mb-4 flex items-center gap-2"><FaImage className="text-primary"/> Фото району</h3>
                        <div className="flex flex-col gap-4">
                            {photoPreview ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border group">
                                    <img src={photoPreview} alt={selectedDistrict.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md font-bold text-[0.9rem] backdrop-blur-sm transition-all">
                                            Змінити фото
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-main hover:border-primary/50 transition-all">
                                    <FaImage className="text-[2rem] text-textMuted mb-2 opacity-50" />
                                    <span className="text-[0.9rem] font-bold text-textMain">Завантажити фото</span>
                                    <span className="text-[0.8rem] text-textMuted mt-1">PNG, JPG до 5MB</span>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}