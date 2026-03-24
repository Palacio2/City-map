import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { FaTimes, FaSave, FaTrash } from 'react-icons/fa';
import { Button } from '../../ui/Button';
import { normalizePoiData, MapFitBounds, createEmojiIcon } from '../../utils/mapHelpers';

export default function MapEditorModal({ isOpen, onClose, rowData, onSaveMapData }) {
    const { t } = useTranslation('adminManual');
    const { metricGroups, fieldsConfig } = useDynamicFields();
    
    const [activeFilters, setActiveFilters] = useState({});
    const [localPois, setLocalPois] = useState([]);
    const [selectedPoiIndex, setSelectedPoiIndex] = useState(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [newPoiType, setNewPoiType] = useState('');
    const mapRef = useRef(null);

    const getFieldByPoiType = (type) => {
        const cleanType = type.replace('_count', '');
        return fieldsConfig?.find(f => f.key === cleanType || f.key === `${cleanType}_count`);
    };

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

    const handleMapClick = (e) => {
        if (!isAddingMode || !newPoiType) return;
        const { lat, lng } = e.latlng;
        
        if (rowData?.geojson) {
            const pt = turf.point([lng, lat]);
            const poly = rowData.geojson.type === 'Feature' ? rowData.geojson : turf.feature(rowData.geojson);
            if (!turf.booleanPointInPolygon(pt, poly)) {
                alert("Точка знаходиться за межами району!");
                return;
            }
        }
        
        const typeToSave = newPoiType.replace('_count', '');
        setLocalPois(prev => [...prev, [lat, lng, typeToSave, 'manual']]);
        setActiveFilters(prev => ({...prev, [typeToSave]: true, [`${typeToSave}_count`]: true}));
        setIsAddingMode(false);
        setNewPoiType('');
    };

    const handleDeletePoi = (index) => {
        setLocalPois(prev => prev.filter((_, i) => i !== index));
        setSelectedPoiIndex(null);
    };

    const handleSave = () => {
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
    };

    const filteredPois = useMemo(() => {
        return localPois.map((poi, idx) => ({ ...poi, originalIndex: idx })).filter(poi => {
            const type = poi[2];
            return activeFilters[type] !== false;
        });
    }, [localPois, activeFilters]);

    if (!isOpen) return null;

    const poiFields = (fieldsConfig || []).filter(f => f.is_osm || f.data_type === 'number');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-surface w-full max-w-7xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border">
                <div className="flex justify-between items-center p-4 px-6 border-b border-border bg-main">
                    <h2 className="text-xl font-bold text-textMain m-0">GIS Редактор: {rowData?.name}</h2>
                    <div className="flex items-center gap-4">
                        <Button variant="success" onClick={handleSave} className="!py-2"><FaSave /> Зберегти</Button>
                        <button onClick={onClose} className="p-2 text-textMuted hover:text-danger bg-surface rounded-md border border-border"><FaTimes size={18} /></button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    <div className="w-[320px] bg-surface border-r border-border flex flex-col h-full z-10 overflow-y-auto">
                        <div className="p-4 border-b border-border bg-main sticky top-0 z-20">
                            <h3 className="font-bold text-[0.9rem] mb-2 text-textMain">Додати об'єкт</h3>
                            <div className="flex flex-col gap-2">
                                <select value={newPoiType} onChange={e => setNewPoiType(e.target.value)} className="w-full p-2 bg-surface border border-border rounded-md text-[0.85rem]">
                                    <option value="">Оберіть тип...</option>
                                    {poiFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                                </select>
                                <Button disabled={!newPoiType} onClick={() => setIsAddingMode(!isAddingMode)} className={`w-full !py-2 ${isAddingMode ? '!bg-danger' : '!bg-primary'}`}>
                                    {isAddingMode ? 'Скасувати' : 'Вказати на карті'}
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 flex flex-col gap-4">
                            <h3 className="font-bold text-[0.9rem] text-textMain">Легенда та фільтри</h3>
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
                                                    setActiveFilters(prev => ({
                                                        ...prev, [field.key]: val, [field.key.replace('_count', '')]: val
                                                    }));
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
                        <MapContainer center={[52.23, 21.01]} zoom={13} className="w-full h-full" ref={mapRef}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                            {rowData?.geojson && (
                                <>
                                    <GeoJSON data={rowData.geojson} style={{ color: '#3b82f6', weight: 2, fillOpacity: 0.05 }} />
                                    <MapFitBounds geojson={rowData.geojson} />
                                </>
                            )}
                            
                            {filteredPois.map((poi) => (
                                <Marker 
                                    key={poi.originalIndex} 
                                    position={[poi[0], poi[1]]} 
                                    icon={createEmojiIcon(poi[2], poi[3], fieldsConfig, 32)}
                                    eventHandlers={{ click: () => setSelectedPoiIndex(poi.originalIndex) }}
                                >
                                    <Tooltip direction="top" offset={[0, -16]}>
                                        <div className="font-bold">{getFieldByPoiType(poi[2])?.label || poi[2]}</div>
                                        <div className="text-[0.7rem] opacity-70">Джерело: {poi[3] === 'manual' ? 'Ручне' : 'Парсер'}</div>
                                    </Tooltip>
                                </Marker>
                            ))}

                            {isAddingMode && <div className="absolute inset-0 z-[400] cursor-crosshair" onClick={(e) => {
                                const map = mapRef.current;
                                if(map) handleMapClick({latlng: map.mouseEventToLatLng(e)});
                            }} />}
                        </MapContainer>

                        {selectedPoiIndex !== null && (
                            <div className="absolute top-4 right-4 z-[1000] bg-surface p-4 rounded-lg shadow-xl border border-border min-w-[200px] animate-[fadeIn_0.2s_ease-out]">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-textMain">{getFieldByPoiType(localPois[selectedPoiIndex][2])?.label}</span>
                                    <button onClick={() => setSelectedPoiIndex(null)} className="text-textMuted hover:text-danger transition-colors"><FaTimes/></button>
                                </div>
                                <Button variant="danger" onClick={() => handleDeletePoi(selectedPoiIndex)} className="w-full !py-2 text-[0.85rem] flex items-center justify-center gap-2">
                                    <FaTrash size={12}/> Видалити точку
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}