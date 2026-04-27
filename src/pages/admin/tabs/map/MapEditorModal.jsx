import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster'; // 👈 ОСЬ ЦЕЙ РЯДОК БУВ ПРОПУЩЕНИЙ!
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { FaTimes, FaSave, FaTrash, FaMousePointer } from 'react-icons/fa';
import { Button } from '../../ui/Button';
import { normalizePoiData, MapFitBounds, createEmojiIcon } from '../../utils/mapHelpers';
import { useTranslation } from 'react-i18next';

export default function MapEditorModal({ isOpen, onClose, rowData, onSaveMapData }) {
    const { t } = useTranslation('db');
    const { metricGroups, fieldsConfig } = useDynamicFields();
    
    const [activeFilters, setActiveFilters] = useState({});
    const [localPois, setLocalPois] = useState([]);
    const [selectedPoiIndex, setSelectedPoiIndex] = useState(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newPoiType, setNewPoiType] = useState('');
    const mapRef = useRef(null);

    const getFieldByPoiType = useCallback((type) => {
        const cleanType = type.replace('_count', '');
        return fieldsConfig?.find(f => f.key === cleanType || f.key === `${cleanType}_count`);
    }, [fieldsConfig]);

    useEffect(() => {
        if (isOpen) {
            const pois = normalizePoiData(rowData?.poi_data);
            setLocalPois(pois);
            
            const initialFilters = {};
            pois.forEach(p => {
                const type = p[2];
                if (type) {
                    initialFilters[type] = true;
                    initialFilters[`${type}_count`] = true;
                    initialFilters[type.replace('_count', '')] = true;
                }
            });

            if (fieldsConfig) {
                fieldsConfig.forEach(f => {
                    if (initialFilters[f.key] === undefined) initialFilters[f.key] = true;
                });
            }
            
            setActiveFilters(initialFilters);
            setIsAddingMode(false);
            setNewPoiType('');
            setSelectedPoiIndex(null);
        }
    }, [isOpen, rowData, fieldsConfig]);

    const handleMapClick = useCallback((e) => {
        if (!isAddingMode || !newPoiType) return;
        const { lat, lng } = e.latlng;
        
        if (rowData?.geojson) {
            const pt = turf.point([lng, lat]);
            const poly = rowData.geojson.type === 'Feature' ? rowData.geojson : turf.feature(rowData.geojson);
            if (!turf.booleanPointInPolygon(pt, poly)) {
                alert(t('admin_map.editor.out_of_bounds'));
                return;
            }
        }
        
        const typeToSave = newPoiType.replace('_count', '');
        setLocalPois(prev => [...prev, [lat, lng, typeToSave, 'manual']]);
        setActiveFilters(prev => ({...prev, [typeToSave]: true, [`${typeToSave}_count`]: true}));
        setIsAddingMode(false);
        setNewPoiType('');
    }, [isAddingMode, newPoiType, rowData, t]);

    const handleDeletePoi = useCallback((index) => {
        setLocalPois(prev => prev.filter((_, i) => i !== index));
        setSelectedPoiIndex(null);
    }, []);

    const handleSave = useCallback(() => {
        const updatedCounts = {};
        if (fieldsConfig) {
            fieldsConfig.forEach(f => {
                const shortKey = f.key.replace('_count', '');
                const count = localPois.filter(p => p[2] === shortKey || p[2] === f.key).length;
                updatedCounts[f.key] = count;
            });
        }
        onSaveMapData(localPois, updatedCounts);
        onClose();
    }, [fieldsConfig, localPois, onSaveMapData, onClose]);

    const filteredPois = useMemo(() => {
        return localPois.map((poi, idx) => ({ ...poi, originalIndex: idx })).filter(poi => {
            const type = poi[2];
            return activeFilters[type] !== false;
        });
    }, [localPois, activeFilters]);

    const poiFields = useMemo(() => {
        return (fieldsConfig || []).filter(f => f.is_osm || f.data_type === 'number');
    }, [fieldsConfig]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-surface w-full max-w-7xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border">
                <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-main/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-primary text-[1.2rem] shadow-inner">🌍</div>
                        <div>
                            <h2 className="m-0 text-[1.2rem] font-extrabold text-textMain tracking-tight">
                                {t('admin_map.editor.title')}: {rowData?.name}
                            </h2>
                            <p className="m-0 text-[0.8rem] text-textMuted font-bold">{rowData?.district_name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="cancel" onClick={onClose} className="!px-5 !py-2 !rounded-xl">
                            <FaTimes size={12} className="mr-2"/> {t('admin_map.editor.cancel')}
                        </Button>
                        <Button variant="success" onClick={handleSave} className="!px-6 !py-2 !rounded-xl shadow-md">
                            <FaSave size={12} className="mr-2"/> {t('admin_map.editor.save')}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    <div className="w-[320px] bg-surface border-r border-border flex flex-col h-full z-10 overflow-y-auto">
                        <div className="p-4 border-b border-border bg-main sticky top-0 z-20">
                            <h3 className="font-bold text-[0.9rem] mb-2 text-textMain">{t('admin_map.editor.adding_poi')}</h3>
                            <div className="flex flex-col gap-2">
                                <select value={newPoiType} onChange={e => setNewPoiType(e.target.value)} className="w-full p-2 bg-surface border border-border rounded-md text-[0.85rem]">
                                    <option value="">{t('admin_map.editor.select_type')}</option>
                                    {poiFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                                </select>
                                <Button disabled={!newPoiType} onClick={() => setIsAddingMode(!isAddingMode)} className={`w-full !py-2 ${isAddingMode ? '!bg-danger' : '!bg-primary'}`}>
                                    {isAddingMode ? t('admin_map.editor.cancel') : <><FaMousePointer className="inline mr-2"/> {t('admin_map.editor.click_map')}</>}
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 flex flex-col gap-4">
                            <h3 className="font-bold text-[0.9rem] text-textMain">{t('admin_map.editor.legend_filters')}</h3>
                            {(metricGroups || []).map(group => {
                                const groupPois = group.fields.map(f => {
                                    const shortKey = f.key.replace('_count', '');
                                    const count = localPois.filter(p => p[2] === shortKey || p[2] === f.key).length;
                                    return { ...f, count };
                                }).filter(f => f.count > 0);
                                if (groupPois.length === 0) return null;
                                return (
                                    <div key={group.id} className="flex flex-col gap-1">
                                        <div className="text-[0.75rem] font-bold text-textMuted uppercase mb-1">{group.title}</div>
                                        {groupPois.map(field => (
                                            <button 
                                                key={field.key} 
                                                onClick={() => {
                                                    const val = !activeFilters[field.key];
                                                    setActiveFilters(prev => ({...prev, [field.key]: val, [field.key.replace('_count', '')]: val}));
                                                }}
                                                className={`flex items-center justify-between p-2 rounded-lg border text-[0.8rem] ${activeFilters[field.key] !== false ? 'bg-primary/5 border-primary/20' : 'bg-main border-transparent opacity-50'}`}
                                            >
                                                <span className="flex items-center gap-2">{field.icon} {field.label}</span>
                                                <span className="font-bold">{field.count}</span>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 relative z-1">
                        <MapContainer center={[52.23, 21.01]} zoom={13} className={`w-full h-full ${isAddingMode ? 'cursor-crosshair' : ''}`} ref={mapRef}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                            {rowData?.geojson && (
                                <>
                                    <GeoJSON data={rowData.geojson} style={{ color: '#3b82f6', weight: 2, fillOpacity: 0.05 }} />
                                    <MapFitBounds mapData={[{ geojson: rowData.geojson }]} pois={localPois} />
                                </>
                            )}
                            {/* 🚀 МАГІЯ КЛАСТЕРІВ ТУТ */}
                            <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50} showCoverageOnHover={false}>
                                {filteredPois.map((poi) => (
                                    <Marker 
                                        key={poi.originalIndex} 
                                        position={[poi[0], poi[1]]} 
                                        icon={createEmojiIcon(poi[2], poi[3], fieldsConfig, 32)}
                                        eventHandlers={{ click: () => setSelectedPoiIndex(poi.originalIndex) }}
                                    >
                                        <Tooltip direction="top" offset={[0, -16]} className="modern-tooltip">
                                            <div className="font-bold">{getFieldByPoiType(poi[2])?.label || poi[2]}</div>
                                            <div className="text-[0.7rem] opacity-70">
                                                {t('admin_map.editor.source')}: {poi[3] === 'manual' ? t('admin_map.editor.manual') : t('admin_map.editor.parser')}
                                            </div>
                                        </Tooltip>
                                    </Marker>
                                ))}
                            </MarkerClusterGroup>
                            {isAddingMode && <div className="absolute inset-0 z-[400] cursor-crosshair" onClick={(e) => {
                                const map = mapRef.current;
                                if(map) handleMapClick({latlng: map.mouseEventToLatLng(e)});
                            }} />}
                        </MapContainer>

                        {selectedPoiIndex !== null && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-surface/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-border min-w-[250px] animate-[slideUp_0.2s_ease-out]">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-extrabold text-textMain text-[1rem]">
                                        {getFieldByPoiType(localPois[selectedPoiIndex][2])?.icon} {getFieldByPoiType(localPois[selectedPoiIndex][2])?.label}
                                    </span>
                                    <button onClick={() => setSelectedPoiIndex(null)} className="w-8 h-8 rounded-full bg-main flex items-center justify-center text-textMuted hover:text-danger transition-colors"><FaTimes size={12}/></button>
                                </div>
                                <Button variant="danger" onClick={() => handleDeletePoi(selectedPoiIndex)} className="w-full !py-2.5 text-[0.9rem] flex items-center justify-center gap-2 !rounded-xl">
                                    <FaTrash size={14}/> {t('admin_map.editor.delete_poi')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`.modern-tooltip { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: 1px solid var(--border); box-shadow: var(--shadow-sm); border-radius: var(--radius-md); padding: 8px 12px; color: var(--text-main); font-size: 0.85rem; } @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(0, 0); } }`}</style>
        </div>
    );
}