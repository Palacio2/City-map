import { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet/dist/leaflet.css';
import { FaSave, FaTrash, FaMousePointer, FaGlobe } from 'react-icons/fa';
import BaseModal from '../../ui/BaseModal';
import { Button } from '../../ui/Button';
import { CustomSelect, SelectOption } from '../../ui/CustomSelect';
import { MapFitBounds, createEmojiIcon } from '../../utils/mapHelpers';
import { useMapEditor } from '../../hooks/useMapEditor';

export default function MapEditorModal({ isOpen, onClose, rowData, onSaveMapData }: any) {
    const logic = useMapEditor(isOpen, rowData, onSaveMapData, onClose);

    const poiOptions: SelectOption[] = useMemo(() => [
        { value: '', label: logic.t('admin_map.editor.select_type') },
        ...logic.poiFields.map((f: any) => ({ value: f.key, label: f.label || f.key, icon: f.icon }))
    ], [logic.poiFields, logic.t]);

    if (!isOpen) return null;

    const modalTitle = (
        <div className="flex items-center gap-2">
            <FaGlobe className="text-primary text-sm" />
            <span className="text-sm font-semibold text-textMain">
                {logic.t('admin_map.editor.title')}: {rowData?.name}
            </span>
        </div>
    );

    const modalActions = (
        <>
            <Button variant="cancel" size="sm" onClick={onClose}>
                {logic.t('admin_map.editor.cancel')}
            </Button>
            <Button variant="success" size="sm" onClick={logic.handleSave}>
                <FaSave className="text-xs" /> {logic.t('admin_map.editor.save')}
            </Button>
        </>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="90vw" actions={modalActions} bodyStyle={{ padding: 0 }}>
            <div className="flex flex-col md:flex-row h-[75vh] w-full relative overflow-hidden bg-main">
                
                <div className="w-full md:w-80 bg-surface border-r border-border flex flex-col h-auto md:h-full z-10 overflow-y-auto scrollbar-thin">
                    <div className="p-3 border-b border-border bg-main/40 flex flex-col gap-2">
                        <span className="text-xs font-semibold text-textMain">
                            {logic.t('admin_map.editor.adding_poi')}
                        </span>
                        <CustomSelect
                            options={poiOptions}
                            value={logic.newPoiType}
                            onChange={(val) => logic.setNewPoiType(val)}
                            size="sm"
                        />
                        <Button
                            variant={logic.isAddingMode ? 'danger' : 'primary'}
                            size="sm"
                            disabled={!logic.newPoiType}
                            onClick={() => logic.setIsAddingMode(!logic.isAddingMode)}
                            className="w-full mt-1"
                        >
                            {logic.isAddingMode ? logic.t('admin_map.editor.cancel') : <><FaMousePointer className="text-xs" /> {logic.t('admin_map.editor.click_map')}</>}
                        </Button>
                    </div>

                    
                    <div className="p-3 flex flex-col gap-3">
                        <span className="text-xs font-semibold text-textMain">
                            {logic.t('admin_map.editor.legend_filters')}
                        </span>
                        {(logic.metricGroups || []).map((group: any) => {
                            const groupPois = group.fields.map((f: any) => {
                                const shortKey = f.key.replace('_count', '');
                                const count = logic.localPois.filter((p: any) => p[2] === shortKey || p[2] === f.key).length;
                                return { ...f, count };
                            }).filter((f: any) => f.count > 0);

                            if (groupPois.length === 0) return null;

                            return (
                                <div key={group.id} className="flex flex-col gap-1">
                                    <span className="text-[10px] font-mono text-textMuted uppercase">{group.title}</span>
                                    {groupPois.map((field: any) => (
                                        <button
                                            key={field.key}
                                            onClick={() => logic.handleFilterToggle(field.key)}
                                            className={`flex items-center justify-between p-1.5 rounded border text-xs text-left transition-colors ${
                                                logic.activeFilters[field.key] !== false 
                                                    ? 'bg-primary-subtle border-primary/30 text-primary font-medium' 
                                                    : 'bg-main border-border text-textMuted opacity-60'
                                            }`}
                                        >
                                            <span className="flex items-center gap-1.5 truncate">
                                                <span>{field.icon}</span>
                                                <span className="truncate">{field.label}</span>
                                            </span>
                                            <span className="font-mono text-[11px] shrink-0 ml-1">{field.count}</span>
                                        </button>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>

                
                <div className="flex-1 relative z-1 h-full">
                    <MapContainer center={[52.23, 21.01]} zoom={13} className={`w-full h-full ${logic.isAddingMode ? 'cursor-crosshair' : ''}`} ref={logic.mapRef}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        {rowData?.geojson && (
                            <>
                                <GeoJSON data={rowData.geojson} style={{ color: '#3b82f6', weight: 1.5, fillOpacity: 0.1 }} />
                                <MapFitBounds mapData={[{ geojson: rowData.geojson }]} pois={logic.localPois} />
                            </>
                        )}
                        <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50} showCoverageOnHover={false}>
                            {logic.filteredPois.map((poi: any) => (
                                <Marker
                                    key={poi.originalIndex}
                                    position={[poi[0], poi[1]]}
                                    icon={createEmojiIcon(poi[2], poi[3], logic.fieldsConfig, 28)}
                                    eventHandlers={{ click: () => logic.setSelectedPoiIndex(poi.originalIndex) }}
                                >
                                    <Tooltip direction="top" offset={[0, -14]} className="modern-tooltip">
                                        <div className="text-center font-medium text-xs text-textMain">
                                            {logic.getFieldByPoiType(poi[2])?.label || poi[2]}
                                        </div>
                                    </Tooltip>
                                </Marker>
                            ))}
                        </MarkerClusterGroup>
                        {logic.isAddingMode && (
                            <div 
                                className="absolute inset-0 z-[400] cursor-crosshair" 
                                onClick={(e: any) => {
                                    const map = logic.mapRef.current;
                                    if(map) logic.handleMapClick({ latlng: map.mouseEventToLatLng(e) });
                                }} 
                            />
                        )}
                    </MapContainer>

                    
                    {logic.selectedPoiIndex !== null && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-surface p-3 rounded-xl shadow-dropdown border border-border flex items-center gap-3">
                            <span className="text-xs font-medium text-textMain flex items-center gap-1.5">
                                <span>{logic.getFieldByPoiType(logic.localPois[logic.selectedPoiIndex][2])?.icon}</span>
                                <span>{logic.getFieldByPoiType(logic.localPois[logic.selectedPoiIndex][2])?.label}</span>
                            </span>
                            <Button variant="danger" size="sm" onClick={() => logic.handleDeletePoi(logic.selectedPoiIndex!)}>
                                <FaTrash className="text-xs" /> Видалити
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
}