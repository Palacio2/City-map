import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@supabaseClient';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { useModals } from '../../ui/ModalContext'; 
import { FaLayerGroup, FaCity, FaGlobe, FaMapMarkedAlt, FaSyncAlt } from 'react-icons/fa';
import { normalizePoiData, assignColorsToFeatures, MapFitBounds, createEmojiIcon } from '../../utils/mapHelpers';

export default function MapTab() {
    const { metricGroups, fieldsConfig } = useDynamicFields();
    const { showAlert } = useModals(); 
    
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [mapData, setMapData] = useState([]);
    const [loadingMap, setLoadingMap] = useState(false);
    const [activeLayer, setActiveLayer] = useState('polygons'); 

    const getLabelForKey = (key) => fieldsConfig?.find(f => f.key === key || f.key === `${key}_count`)?.label || key;

    useEffect(() => {
        supabase.functions.invoke('admin-geo-list', { body: { action: 'get_countries' } })
            .then(({ data }) => setCountries(data?.data || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (selectedCountry) {
            supabase.functions.invoke('admin-geo-list', { body: { action: 'get_cities', countryId: selectedCountry } })
                .then(({ data }) => setCities(data?.data || []))
                .catch(() => {});
            setSelectedCity('');
            setMapData([]);
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (!selectedCity) return setMapData([]);
        
        setLoadingMap(true);
        supabase.functions.invoke('admin-map-data', { body: { cityId: selectedCity } })
            .then(({ data: res, error }) => {
                if (error || res?.error) throw new Error(res?.error || error.message);
                
                const validData = (res?.data || []).map(d => {
                    if (!d.geojson) return null;
                    try {
                        const geo = typeof d.geojson === 'string' ? JSON.parse(d.geojson) : d.geojson;
                        if (!geo.bbox) geo.bbox = turf.bbox(geo);
                        return { ...d, geojson: geo, poi_data: normalizePoiData(d.poi_data) };
                    } catch (e) {
                        return null;
                    }
                }).filter(Boolean);
                
                setMapData(assignColorsToFeatures(validData));
            })
            .catch(e => showAlert('Помилка', `Не вдалося завантажити карту: ${e.message}`, 'error'))
            .finally(() => setLoadingMap(false));
    }, [selectedCity, showAlert]);

    const handleReset = () => { 
        setSelectedCountry(''); 
        setSelectedCity(''); 
        setActiveLayer('polygons'); 
        setMapData([]); 
    };

    const renderMarkers = useMemo(() => {
        if (activeLayer === 'polygons') return null;
        
        return mapData.flatMap(district => 
            (district.poi_data || []).filter(poi => {
                const type = poi[2];
                return activeLayer === type || activeLayer === `${type}_count` || activeLayer === type.replace('_count', '');
            }).map((poi, idx) => {
                const shortKey = poi[2].replace('_count', '');
                return (
                    <Marker key={`${district.id}-${idx}`} position={[poi[0], poi[1]]} icon={createEmojiIcon(shortKey, poi[3], fieldsConfig, 28)}>
                        <Tooltip direction="top" offset={[0, -14]}>
                            <div className="font-bold text-[0.95rem]">{getLabelForKey(shortKey)}</div>
                            <div className="text-[0.8rem] opacity-70">{district.name}</div>
                        </Tooltip>
                    </Marker>
                );
            })
        );
    }, [mapData, activeLayer, fieldsConfig]);

    const selectClass = "p-2.5 bg-surface border border-border rounded-lg text-[0.95rem] font-semibold text-textMain min-w-[200px] outline-none cursor-pointer transition-all shadow-sm hover:border-primary/50 focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border";

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] bg-surface rounded-xl border border-border shadow-sm overflow-hidden relative z-10">
            <div className="flex items-center gap-4 p-4 border-b border-border bg-main flex-wrap relative z-20 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-textMuted flex items-center justify-center bg-surface w-9 h-9 rounded-md border border-border shadow-sm"><FaGlobe /></span>
                    <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className={selectClass}>
                        <option value="">Оберіть країну...</option>
                        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-textMuted flex items-center justify-center bg-surface w-9 h-9 rounded-md border border-border shadow-sm"><FaCity /></span>
                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedCountry} className={selectClass}>
                        <option value="">Оберіть місто...</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div className="h-8 w-[2px] bg-border mx-1 hidden lg:block rounded-full"></div>

                <div className="flex items-center gap-2">
                    <span className="text-textMuted flex items-center justify-center bg-surface w-9 h-9 rounded-md border border-border shadow-sm"><FaLayerGroup /></span>
                    <select value={activeLayer} onChange={e => setActiveLayer(e.target.value)} disabled={!selectedCity || mapData.length === 0} className={selectClass}>
                        <option value="polygons">🗺️ Тільки райони (Границі)</option>
                        {metricGroups.map(group => {
                            const poiFields = group.fields.filter(f => f.is_osm);
                            if (poiFields.length === 0) return null;
                            return (
                                <optgroup key={group.id} label={`${group.icon} ${group.label}`}>
                                    {poiFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                                </optgroup>
                            );
                        })}
                    </select>
                </div>

                {(selectedCountry || selectedCity || activeLayer !== 'polygons') && (
                    <button onClick={handleReset} className="ml-auto flex items-center gap-2 px-4 py-2.5 text-[0.9rem] font-bold text-danger bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-danger hover:text-white transition-all shadow-sm">
                        <FaSyncAlt /> Скинути
                    </button>
                )}
            </div>

            <div className="flex-1 relative z-10 bg-[#e5e7eb]">
                {loadingMap && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface/70 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <span className="font-bold text-primary text-lg">Завантаження карти...</span>
                        </div>
                    </div>
                )}

                <MapContainer center={[52.23, 21.01]} zoom={6} className="w-full h-full z-[1]">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    
                    {mapData.map(d => (
                        <GeoJSON 
                            key={`${d.id}-${activeLayer}`} 
                            data={d.geojson} 
                            style={{ 
                                color: d.fillColor, 
                                fillColor: d.fillColor, 
                                fillOpacity: activeLayer === 'polygons' ? 0.35 : 0.05, 
                                weight: activeLayer === 'polygons' ? 2 : 1, 
                                dashArray: activeLayer === 'polygons' ? '' : '5, 5' 
                            }}
                        >
                            <Tooltip sticky className="custom-tooltip font-bold text-[1rem] py-2 px-3">{d.name}</Tooltip>
                        </GeoJSON>
                    ))}
                    
                    {renderMarkers}
                    <MapFitBounds mapData={mapData} />
                </MapContainer>

                {!selectedCity && !loadingMap && (
                    <div className="absolute inset-0 z-[400] flex items-center justify-center bg-black/10 backdrop-blur-[6px]">
                        <div className="flex flex-col items-center gap-5 text-textMuted max-w-[450px] text-center p-10 border border-border/50 rounded-2xl bg-surface/95 shadow-xl ring-1 ring-black/5">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-1 shadow-inner border border-blue-500/20">
                                <FaMapMarkedAlt className="text-[2.5rem] text-primary" />
                            </div>
                            <h3 className="text-[1.8rem] font-extrabold text-textMain m-0 tracking-tight">Глобальна Карта</h3>
                            <p className="text-[1.05rem] leading-relaxed m-0 text-textMuted/90 font-medium">
                                Оберіть <strong className="text-textMain font-bold">країну</strong> та <strong className="text-textMain font-bold">місто</strong> на панелі зверху, щоб завантажити ГІС-дані.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}