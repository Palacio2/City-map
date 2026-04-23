import React from 'react';
import { useTranslation } from 'react-i18next';
import { useManualEditor } from './useManualEditor';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { DynamicFormRenderer } from '../../ui/DynamicFormRenderer';
import MapEditorModal from '../map/MapEditorModal';
import { Button } from '../../ui/Button';
import { FaSave, FaTimes, FaMapMarkedAlt, FaImage, FaCheckCircle, FaExclamationTriangle, FaUpload, FaEye, FaEyeSlash } from 'react-icons/fa';

const StatusBadge = ({ status, label }) => {
    const isGood = status === 'green';
    const isWarn = status === 'yellow';
    return (
        <div className={`flex items-center justify-between p-2.5 rounded-xl border text-[0.8rem] font-bold transition-all shadow-sm ${isGood ? 'bg-emerald-500/10 border-emerald-500/20 text-success' : isWarn ? 'bg-amber-500/10 border-amber-500/20 text-[#d97706]' : 'bg-red-500/10 border-red-500/20 text-danger'}`}>
            <span>{label}</span>
            {isGood ? <FaCheckCircle size={14} /> : <FaExclamationTriangle size={14} />}
        </div>
    );
};

export default function ManualEditor({ selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict }) {
    const { t } = useTranslation('db'); 
    const { fieldsConfig } = useDynamicFields();

    const {
        formData, photoPreview, loading, isMapEditorOpen, setIsMapEditorOpen,
        completeness, handleFileChange, handleSave, handleFieldChange,
        handleSaveMapData, handleCancel
    } = useManualEditor(selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict);

    if (!selectedDistrict) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-textMuted bg-surface rounded-2xl border border-border shadow-sm p-10 relative overflow-hidden animate-[fadeIn_0.3s_ease-out]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]"></div>
                <div className="w-20 h-20 bg-main rounded-2xl border border-border shadow-inner flex items-center justify-center mb-6 relative z-10">
                    <span className="text-[3rem] opacity-70 drop-shadow-sm">📝</span>
                </div>
                <h3 className="text-[1.3rem] font-extrabold text-textMain m-0 mb-2 relative z-10 tracking-tight">
                    {t('admin_manual.editor.no_district')}
                </h3>
                <p className="text-[0.95rem] m-0 font-medium relative z-10 opacity-80">
                    {t('admin_manual.editor.empty_desc')}
                </p>
            </div>
        );
    }

    const healthScore = Object.values(completeness).filter(v => v === 'green').length;
    const healthPercent = Math.round((healthScore / 5) * 100);
    const isPublished = formData.is_available === true;

    return (
        <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
            <MapEditorModal
                isOpen={isMapEditorOpen}
                onClose={() => setIsMapEditorOpen(false)}
                rowData={{ ...formData, name: selectedDistrict?.name }} 
                onSaveMapData={handleSaveMapData}
            />

            <div className="bg-surface/95 p-4 sm:p-5 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-[50] backdrop-blur-md">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[0.7rem] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            {selectedCity?.name}
                        </span>
                        {!isPublished && (
                            <span className="text-[0.7rem] font-extrabold uppercase tracking-wider text-danger bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                {t('admin_manual.editor.hidden')}
                            </span>
                        )}
                    </div>
                    <h2 className="m-0 text-[1.5rem] text-textMain font-extrabold tracking-tight">
                        {selectedDistrict.name}
                    </h2>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                    <Button 
                        variant={isPublished ? "cancel" : "primary"} 
                        onClick={() => handleFieldChange('is_available', !isPublished)} 
                        disabled={loading} 
                        className={`flex-1 sm:flex-none !py-2 !px-4 !text-[0.85rem] ${isPublished ? '!bg-main/50' : ''}`}
                    >
                        {isPublished ? <><FaEyeSlash className="mr-1"/> {t('admin_manual.editor.hide_btn')}</> : <><FaEye className="mr-1"/> {t('admin_manual.editor.publish_btn')}</>}
                    </Button>
                    
                    <Button variant="cancel" onClick={handleCancel} disabled={loading} className="flex-1 sm:flex-none !py-2 !px-4 !text-[0.85rem]">
                        <FaTimes className="mr-1"/> {t('admin_manual.editor.cancel_btn')}
                    </Button>
                    
                    <Button variant="success" onClick={handleSave} disabled={loading} className="w-full sm:w-auto !py-2 !px-6 !text-[0.85rem] shadow-md">
                        <FaSave className="mr-1"/> {loading ? '...' : t('admin_manual.editor.save_btn')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[0.9rem] font-extrabold uppercase tracking-widest text-textMuted m-0">
                                {t('admin_manual.editor.completeness')}
                            </h3>
                            <span className={`text-[1.4rem] font-black ${healthPercent === 100 ? 'text-success' : healthPercent > 50 ? 'text-[#f59e0b]' : 'text-danger'}`}>{healthPercent}%</span>
                        </div>
                        <div className="w-full bg-main h-3 rounded-full overflow-hidden shadow-inner mb-6">
                            <div className={`h-full transition-all duration-1000 ${healthPercent === 100 ? 'bg-success' : healthPercent > 50 ? 'bg-[#f59e0b]' : 'bg-danger'}`} style={{ width: `${healthPercent}%` }}></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <StatusBadge status={completeness.geo} label={t('admin_manual.status.geo')} />
                        <StatusBadge status={completeness.infra} label={t('admin_manual.status.infra')} />
                        <StatusBadge status={completeness.prices} label={t('admin_manual.status.economy')} />
                        <StatusBadge status={completeness.photo} label={t('admin_manual.status.photo')} />
                    </div>
                </div>

                <div className="bg-surface rounded-2xl border border-border shadow-sm group relative overflow-hidden flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-blue-500/5 transition-opacity group-hover:bg-blue-500/10"></div>
                    <div className="relative flex flex-col items-center justify-center text-center gap-4 w-full h-full">
                        <div className="w-16 h-16 bg-surface shadow-sm rounded-2xl border border-border flex items-center justify-center text-primary text-[2rem] group-hover:scale-110 transition-transform">
                            <FaMapMarkedAlt />
                        </div>
                        <div>
                            <h4 className="m-0 text-[1.2rem] font-extrabold text-textMain">{t('admin_manual.editor.gis_module')}</h4>
                            <p className="m-0 text-[0.85rem] text-textMuted mt-1.5 font-medium px-4">{t('admin_manual.editor.gis_desc')}</p>
                        </div>
                        <Button variant="primary" onClick={() => setIsMapEditorOpen(true)} className="w-full max-w-[200px] mt-2 !py-2.5 !shadow-md !bg-[#8b5cf6] hover:!bg-[#7c3aed] !shadow-[#8b5cf6]/30">
                            {t('admin_manual.editor.map_editor')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-border bg-main/50 shrink-0 flex items-center justify-between">
                    <h3 className="text-[0.85rem] font-extrabold uppercase tracking-widest text-textMuted m-0 flex items-center gap-2">
                        <FaImage /> {t('admin_manual.editor.photo_title')}
                    </h3>
                </div>
                
                <div className="p-4 flex-1 flex items-center justify-center relative bg-main/20 min-h-[350px] md:min-h-[450px]">
                    {photoPreview ? (
                        <div className="relative w-full h-full min-h-[350px] md:min-h-[450px] rounded-xl overflow-hidden border border-border group shadow-inner">
                            <img src={photoPreview} alt={selectedDistrict.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                <label className="cursor-pointer bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-[0.95rem] shadow-xl flex items-center gap-2 hover:bg-main transition-transform transform translate-y-4 group-hover:translate-y-0">
                                    <FaUpload /> {t('admin_manual.editor.change_cover')}
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full min-h-[350px] border-2 border-dashed border-primary/30 bg-blue-500/5 rounded-2xl cursor-pointer hover:bg-blue-500/10 hover:border-primary/60 transition-all group">
                            <div className="w-16 h-16 bg-surface rounded-2xl shadow-sm border border-border flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                <FaUpload size={24} />
                            </div>
                            <span className="text-[1.1rem] font-extrabold text-primary">{t('admin_manual.editor.upload_cover')}</span>
                            <span className="text-[0.85rem] text-textMuted mt-2 font-medium">
                                {t('admin_manual.editor.upload_hint')}
                            </span>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    )}
                </div>
            </div>

            <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-border shadow-sm">
                <DynamicFormRenderer
                    fieldsConfig={fieldsConfig || []}
                    formData={formData}
                    onChange={handleFieldChange}
                />
            </div>
        </div>
    );
}