import { useTranslation } from 'react-i18next';
import { useManualEditor } from '@admin/features/manual-editor/useManualEditor';
import { useDynamicFields } from '@admin/core/hooks/useDynamicFields';
import { DynamicFormRenderer } from '@admin/core/ui/DynamicFormRenderer';
import MapEditorModal from '@admin/features/map/MapEditorModal';
import { Button } from '@admin/core/ui/Button';
import { useActionGuard } from '@admin/core/context/useActionGuard';
import { FaSave, FaTimes, FaMapMarkedAlt, FaImage, FaCheckCircle, FaExclamationTriangle, FaUpload, FaEye, FaEyeSlash } from 'react-icons/fa';

interface StatusBadgeProps {
    status: string;
    label: string;
}

const StatusBadge = ({ status, label }: StatusBadgeProps) => {
    const isGood = status === 'green';
    const isWarn = status === 'yellow';
    return (
        <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold ${
            isGood ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
            isWarn ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400' :
            'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        }`}>
            <span>{label}</span>
            {isGood ? <FaCheckCircle className="text-xs" /> : <FaExclamationTriangle className="text-xs" />}
        </div>
    );
};

import { Entity } from './types';

interface ManualEditorProps {
    selectedCountry: Entity | null;
    selectedCity: Entity | null;
    selectedDistrict: Entity | null;
    setSelectedDistrict: (val: Entity | null) => void;
}

export default function ManualEditor({ selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict }: ManualEditorProps) {
    const { t } = useTranslation('db');
    const { canDo } = useActionGuard();
    const { fieldsConfig } = useDynamicFields();
    const {
        formData, photoPreview, loading, isMapEditorOpen, setIsMapEditorOpen,
        completeness, handleFileChange, handleSave, handleFieldChange,
        handleSaveMapData, handleCancel
    } = useManualEditor(selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict);

    if (!selectedDistrict) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-textMuted bg-surface rounded-3xl border border-[#d6ccbf] dark:border-[#4a3f37] p-8 text-center shadow-xs">
                <div className="w-14 h-14 bg-main rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] flex items-center justify-center text-2xl mb-3 shadow-2xs">
                    📝
                </div>
                <h3 className="text-sm font-bold text-textMain m-0 mb-1">
                    {t('admin_manual.editor.no_district')}
                </h3>
                <p className="text-xs text-textMuted m-0 max-w-xs font-medium">
                    {t('admin_manual.editor.empty_desc')}
                </p>
            </div>
        );
    }

    const healthScore = Object.values(completeness).filter(v => v === 'green').length;
    const healthPercent = Math.round((healthScore / 5) * 100);
    const isPublished = formData.is_available === true;

    return (
        <div className="flex flex-col gap-6">
            <MapEditorModal
                isOpen={isMapEditorOpen}
                onClose={() => setIsMapEditorOpen(false)}
                rowData={{ ...formData, id: selectedDistrict.id, name: selectedDistrict.name }}
                onSaveMapData={handleSaveMapData}
                readOnly={!canDo('manual.gis')}
            />
            <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sticky top-0 z-20 backdrop-blur-md">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary-subtle px-2 py-0.5 rounded-md border border-primary/20">
                            {selectedCity?.name}
                        </span>
                        {!isPublished && (
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                                {t('admin_manual.editor.hidden')}
                            </span>
                        )}
                    </div>
                    <h2 className="m-0 text-base sm:text-lg font-bold text-textMain tracking-tight">
                        {selectedDistrict.name}
                    </h2>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {canDo('manual.save') && (
                        <>
                            <Button
                                variant={isPublished ? "cancel" : "primary"}
                                size="sm"
                                onClick={() => handleFieldChange('is_available', !isPublished)}
                                disabled={loading}
                            >
                                {isPublished ? <><FaEyeSlash /> {t('admin_manual.editor.hide_btn')}</> : <><FaEye /> {t('admin_manual.editor.publish_btn')}</>}
                            </Button>
                            <Button variant="cancel" size="sm" onClick={handleCancel} disabled={loading}>
                                <FaTimes /> {t('admin_manual.editor.cancel_btn')}
                            </Button>
                            <Button variant="success" size="sm" onClick={handleSave} disabled={loading}>
                                <FaSave /> {loading ? '...' : t('admin_manual.editor.save_btn')}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">
                                {t('admin_manual.editor.completeness')}
                            </span>
                            <span className={`text-base font-bold font-mono ${healthPercent === 100 ? 'text-emerald-600' : healthPercent > 50 ? 'text-amber-500' : 'text-rose-600'}`}>
                                {healthPercent}%
                            </span>
                        </div>
                        <div className="w-full bg-main h-2.5 rounded-full overflow-hidden mb-4 border border-[#d6ccbf] dark:border-[#4a3f37]">
                            <div className={`h-full transition-all duration-300 ${healthPercent === 100 ? 'bg-emerald-500' : healthPercent > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${healthPercent}%` }}></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <StatusBadge status={completeness.geo} label={t('admin_manual.status.geo')} />
                        <StatusBadge status={completeness.infra} label={t('admin_manual.status.infra')} />
                        <StatusBadge status={completeness.prices} label={t('admin_manual.status.economy')} />
                        <StatusBadge status={completeness.photo} label={t('admin_manual.status.photo')} />
                    </div>
                </div>

                <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs flex flex-col items-center justify-center text-center gap-2">
                    <div className="w-11 h-11 bg-primary-subtle text-primary rounded-2xl border border-primary/20 flex items-center justify-center text-lg shadow-2xs">
                        <FaMapMarkedAlt />
                    </div>
                    <div>
                        <h4 className="m-0 text-sm font-bold text-textMain">{t('admin_manual.editor.gis_module')}</h4>
                        <p className="m-0 text-xs text-textMuted mt-0.5 font-medium">{t('admin_manual.editor.gis_desc')}</p>
                    </div>
                    {(canDo('manual.gis') || canDo('manual.edit')) && (
                        <Button variant="primary" size="sm" onClick={() => setIsMapEditorOpen(true)} className="mt-1">
                            {t('admin_manual.editor.map_editor')}
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-surface rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#d6ccbf] dark:border-[#4a3f37] bg-main/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FaImage className="text-textMuted text-xs" />
                        <span className="text-xs font-bold text-textMain">{t('admin_manual.editor.photo_title')}</span>
                    </div>
                </div>
                <div className="p-4 sm:p-5 bg-main/20">
                    {photoPreview ? (
                        <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-[#d6ccbf] dark:border-[#4a3f37] group shadow-xs">
                            <img src={photoPreview} alt={selectedDistrict.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {canDo('manual.save') && (
                                    <label className="cursor-pointer bg-surface text-textMain px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-hover transition-colors">
                                        <FaUpload /> {t('admin_manual.editor.change_cover')}
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>
                    ) : (
                        <label className={`flex flex-col items-center justify-center w-full h-64 border border-dashed border-[#d6ccbf] dark:border-[#4a3f37] rounded-2xl bg-surface ${canDo('manual.save') ? 'cursor-pointer hover:bg-hover transition-colors' : 'opacity-50'}`}>
                            <FaUpload className="text-textMuted text-2xl mb-2" />
                            <span className="text-xs font-bold text-primary">{t('admin_manual.editor.upload_cover')}</span>
                            <span className="text-[11px] text-textMuted mt-1 font-medium">{t('admin_manual.editor.upload_hint')}</span>
                            {canDo('manual.save') && <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />}
                        </label>
                    )}
                </div>
            </div>

            <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-[#d6ccbf] dark:border-[#4a3f37] shadow-xs">
                <DynamicFormRenderer
                    fieldsConfig={fieldsConfig || []}
                    formData={formData}
                    onChange={handleFieldChange}
                    readOnly={!canDo('manual.edit')}
                />
            </div>
        </div>
    );
}