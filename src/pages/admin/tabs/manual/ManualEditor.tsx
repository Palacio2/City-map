import { useTranslation } from 'react-i18next';
import { useManualEditor } from './useManualEditor';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { DynamicFormRenderer } from '../../ui/DynamicFormRenderer';
import MapEditorModal from '../map/MapEditorModal';
import { Button } from '../../ui/Button';
import { FaSave, FaTimes, FaMapMarkedAlt, FaImage, FaCheckCircle, FaExclamationTriangle, FaUpload, FaEye, FaEyeSlash } from 'react-icons/fa';

const StatusBadge = ({ status, label }: any) => {
    const isGood = status === 'green';
    const isWarn = status === 'yellow';
    return (
        <div className={`flex items-center justify-between p-2 rounded-lg border text-xs font-medium ${
            isGood ? 'bg-success-subtle border-success/20 text-success' : 
            isWarn ? 'bg-warning-subtle border-warning/20 text-warning' : 
            'bg-danger-subtle border-danger/20 text-danger'
        }`}>
            <span>{label}</span>
            {isGood ? <FaCheckCircle className="text-xs" /> : <FaExclamationTriangle className="text-xs" />}
        </div>
    );
};

export default function ManualEditor({ selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict }: any) {
    const { t } = useTranslation('db');
    const { fieldsConfig } = useDynamicFields();
    const {
        formData, photoPreview, loading, isMapEditorOpen, setIsMapEditorOpen,
        completeness, handleFileChange, handleSave, handleFieldChange,
        handleSaveMapData, handleCancel
    } = useManualEditor(selectedCountry, selectedCity, selectedDistrict, setSelectedDistrict);

    if (!selectedDistrict) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-textMuted bg-surface rounded-xl border border-border p-8 text-center">
                <div className="w-12 h-12 bg-main rounded-xl border border-border flex items-center justify-center text-xl mb-3">
                    📝
                </div>
                <h3 className="text-sm font-semibold text-textMain m-0 mb-1">
                    {t('admin_manual.editor.no_district')}
                </h3>
                <p className="text-xs text-textMuted m-0 max-w-xs">
                    {t('admin_manual.editor.empty_desc')}
                </p>
            </div>
        );
    }

    const healthScore = Object.values(completeness).filter(v => v === 'green').length;
    const healthPercent = Math.round((healthScore / 5) * 100);
    const isPublished = formData.is_available === true;

    return (
        <div className="flex flex-col gap-5">
            <MapEditorModal
                isOpen={isMapEditorOpen}
                onClose={() => setIsMapEditorOpen(false)}
                rowData={{ ...formData, name: selectedDistrict?.name }}
                onSaveMapData={handleSaveMapData}
            />

            <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sticky top-0 z-20">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary-subtle px-1.5 py-0.5 rounded border border-primary/20">
                            {selectedCity?.name}
                        </span>
                        {!isPublished && (
                            <span className="text-[10px] font-mono uppercase tracking-wider text-danger bg-danger-subtle px-1.5 py-0.5 rounded border border-danger/20">
                                {t('admin_manual.editor.hidden')}
                            </span>
                        )}
                    </div>
                    <h2 className="m-0 text-base font-semibold text-textMain tracking-tight">
                        {selectedDistrict.name}
                    </h2>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
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
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-textMuted uppercase tracking-wider">
                                {t('admin_manual.editor.completeness')}
                            </span>
                            <span className={`text-base font-semibold ${healthPercent === 100 ? 'text-success' : healthPercent > 50 ? 'text-warning' : 'text-danger'}`}>{healthPercent}%</span>
                        </div>
                        <div className="w-full bg-main h-2 rounded-full overflow-hidden mb-4">
                            <div className={`h-full transition-all duration-300 ${healthPercent === 100 ? 'bg-success' : healthPercent > 50 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${healthPercent}%` }}></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <StatusBadge status={completeness.geo} label={t('admin_manual.status.geo')} />
                        <StatusBadge status={completeness.infra} label={t('admin_manual.status.infra')} />
                        <StatusBadge status={completeness.prices} label={t('admin_manual.status.economy')} />
                        <StatusBadge status={completeness.photo} label={t('admin_manual.status.photo')} />
                    </div>
                </div>

                <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col items-center justify-center text-center gap-2">
                    <div className="w-10 h-10 bg-primary-subtle text-primary rounded-lg border border-primary/20 flex items-center justify-center text-lg">
                        <FaMapMarkedAlt />
                    </div>
                    <div>
                        <h4 className="m-0 text-sm font-semibold text-textMain">{t('admin_manual.editor.gis_module')}</h4>
                        <p className="m-0 text-xs text-textMuted mt-0.5">{t('admin_manual.editor.gis_desc', 'Редагувати точкові об\'єкти інфраструктури та полігон району')}</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setIsMapEditorOpen(true)} className="mt-1">
                        {t('admin_manual.editor.map_editor')}
                    </Button>
                </div>
            </div>

            
            <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-main/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FaImage className="text-textMuted text-xs" />
                        <span className="text-xs font-semibold text-textMain">{t('admin_manual.editor.photo_title')}</span>
                    </div>
                </div>
                <div className="p-4 bg-main/20">
                    {photoPreview ? (
                        <div className="relative w-full h-80 rounded-lg overflow-hidden border border-border group shadow-2xs">
                            <img src={photoPreview} alt={selectedDistrict.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <label className="cursor-pointer bg-surface text-textMain px-3.5 py-2 rounded-lg text-xs font-medium shadow-subtle flex items-center gap-2 hover:bg-hover transition-colors">
                                    <FaUpload /> {t('admin_manual.editor.change_cover')}
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-64 border border-dashed border-border rounded-lg cursor-pointer hover:bg-hover transition-colors">
                            <FaUpload className="text-textMuted text-2xl mb-2" />
                            <span className="text-xs font-medium text-primary">{t('admin_manual.editor.upload_cover')}</span>
                            <span className="text-[11px] text-textMuted mt-1">{t('admin_manual.editor.upload_hint')}</span>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    )}
                </div>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle">
                <DynamicFormRenderer
                    fieldsConfig={fieldsConfig || []}
                    formData={formData}
                    onChange={handleFieldChange}
                />
            </div>
        </div>
    );
}