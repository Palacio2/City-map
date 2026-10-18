// src/pages/admin/features/map/MapEditorModal.tsx
import { useMemo } from 'react';
import { FaTrash, FaMousePointer, FaGlobe, FaCheckCircle } from 'react-icons/fa';
import BaseModal from '@admin/core/ui/BaseModal';
import { Button } from '@admin/core/ui/Button';
import { CustomSelect, SelectOption } from '@admin/core/ui/CustomSelect';
import { LeafletGeoViewer } from '@admin/core/ui/LeafletGeoViewer';
import { useMapEditor } from '@admin/features/map/useMapEditor';
import { NormalizedPoiPoint } from '@admin/core/types/geo.types';
import { FormattedFieldItem } from '@admin/core/types/ui.types';
import { Map as LeafletMap } from 'leaflet';

interface MapEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    rowData: { id: string; name: string; geojson?: unknown; [key: string]: unknown } | null;
    onSaveMapData: (pois: NormalizedPoiPoint[], counts: Record<string, number>) => void;
    readOnly?: boolean;
}

export default function MapEditorModal({ isOpen, onClose, rowData, onSaveMapData, readOnly }: MapEditorModalProps) {
    const logic = useMapEditor(isOpen, rowData, onSaveMapData, onClose);

    const poiOptions: SelectOption[] = useMemo(() => [
        { value: '', label: logic.t('admin_map.editor.select_type') },
        ...logic.poiFields.map((f: FormattedFieldItem) => ({ value: f.key, label: f.label || f.key, icon: f.icon as React.ReactNode }))
    ], [logic]);

    if (!isOpen) return null;

    return (
        <BaseModal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                <div className="flex items-center gap-2">
                    <FaGlobe className="text-primary text-sm" />
                    <span className="text-sm font-bold text-textMain">{logic.t('admin_map.editor.title')}: {rowData?.name}</span>
                </div>
            } 
            maxWidth="90vw" 
            actions={!readOnly && (
                <>
                    <Button variant="cancel" size="sm" onClick={onClose}>{logic.t('admin_map.editor.cancel')}</Button>
                    <Button variant="success" size="sm" onClick={logic.handleSave}>
                        <FaCheckCircle className="text-xs" /> {logic.t('admin_map.editor.apply', 'Застосувати')}
                    </Button>
                </>
            )} 
            noPadding
        >
            <div className="flex flex-col md:flex-row h-[75vh] w-full relative overflow-hidden bg-main">
                <div className="w-full md:w-80 bg-surface border-r border-[#d6ccbf] dark:border-[#4a3f37] flex flex-col h-auto md:h-full z-10 overflow-y-auto scrollbar-thin">
                    {!readOnly && (
                        <div className="p-4 border-b border-[#d6ccbf] dark:border-[#4a3f37] bg-main/50 flex flex-col gap-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted">{logic.t('admin_map.editor.adding_poi')}</span>
                            <CustomSelect options={poiOptions} value={logic.newPoiType} onChange={(val) => logic.setNewPoiType(String(val))} size="sm" />
                            <Button variant={logic.isAddingMode ? 'danger' : 'primary'} size="sm" disabled={!logic.newPoiType} onClick={() => logic.setIsAddingMode(!logic.isAddingMode)} className="w-full mt-1">
                                {logic.isAddingMode ? logic.t('admin_map.editor.cancel') : <><FaMousePointer className="text-xs" /> {logic.t('admin_map.editor.click_map')}</>}
                            </Button>
                        </div>
                    )}
                    <div className="p-4 flex flex-col gap-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted">{logic.t('admin_map.editor.legend_filters')}</span>
                        {(logic.metricGroups || []).map((group: { id: string; title: string; fields: FormattedFieldItem[] }) => {
                            const groupPois = group.fields.map((f: FormattedFieldItem) => {
                                const shortKey = f.key.replace('_count', '');
                                const count = logic.localPois.filter((p: NormalizedPoiPoint) => p[2] === shortKey || p[2] === f.key).length;
                                return { ...f, count };
                            }).filter((f: FormattedFieldItem & { count: number }) => f.count > 0);

                            if (groupPois.length === 0) return null;
                            return (
                                <div key={group.id} className="flex flex-col gap-1">
                                    <span className="text-[10px] font-mono text-textMuted uppercase font-bold">{group.title}</span>
                                    {groupPois.map((field: FormattedFieldItem & { count: number }) => (
                                        <button key={field.key} onClick={() => logic.handleFilterToggle(field.key)} className={`flex items-center justify-between p-2 rounded-xl border text-xs text-left transition-all ${logic.activeFilters[field.key] !== false ? 'bg-primary-subtle border-primary/30 text-primary font-semibold' : 'bg-surface border-[#d6ccbf] dark:border-[#4a3f37] text-textMuted opacity-60'}`}>
                                            <span className="flex items-center gap-2 truncate"><span>{field.icon as React.ReactNode}</span><span className="truncate">{field.label}</span></span>
                                            <span className="font-mono text-[11px] shrink-0 ml-1 font-bold">{field.count}</span>
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex-1 relative z-1 h-full">
                    <LeafletGeoViewer
                        singleGeoJson={rowData?.geojson as Record<string, unknown>}
                        pois={logic.filteredPois}
                        fieldsConfig={logic.fieldsConfig}
                        getLabelForKey={(type) => logic.getFieldByPoiType(type)?.label || type}
                        isAddingMode={logic.isAddingMode}
                        onMapClick={logic.handleMapClick}
                        onMarkerClick={logic.setSelectedPoiIndex}
                        mapRef={logic.mapRef as React.RefObject<LeafletMap>}
                    />
                    {logic.selectedPoiIndex !== null && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-surface p-3.5 rounded-2xl shadow-xl border border-[#d6ccbf] dark:border-[#4a3f37] flex items-center gap-3.5">
                            <span className="text-xs font-semibold text-textMain flex items-center gap-2">
                                <span>{logic.getFieldByPoiType(logic.localPois[logic.selectedPoiIndex][2])?.icon as React.ReactNode}</span>
                                <span>{logic.getFieldByPoiType(logic.localPois[logic.selectedPoiIndex][2])?.label}</span>
                            </span>
                            {!readOnly && (
                                <Button variant="danger" size="sm" onClick={() => logic.handleDeletePoi(logic.selectedPoiIndex!)}>
                                    <FaTrash className="text-xs" /> {logic.t('admin_map.editor.delete')}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
}