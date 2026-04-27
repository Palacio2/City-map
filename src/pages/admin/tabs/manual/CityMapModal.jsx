import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster'; // 👈 ОСЬ ЦЕЙ РЯДОК БУВ ПРОПУЩЕНИЙ!
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { normalizePoiData, assignColorsToFeatures, MapFitBounds, createEmojiIcon } from '../../utils/mapHelpers';
import { FaMapMarkedAlt } from 'react-icons/fa';

export default function CityMapModal({ isOpen, onClose, city }) {
    const { t } = useTranslation('db');
    const { fieldsConfig } = useDynamicFields();
    const [mapData, setMapData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeLayer, setActiveLayer] = useState('polygons');

    const getLabelForKey = useCallback((key) => {
        return fieldsConfig?.find(f => f.key === key || f.key === `${key}_count`)?.label || key;
    }, [fieldsConfig]);

    useEffect(() => {
        if (!isOpen || !city) return;
        
        setActiveLayer('polygons');
        
        const loadData = async () => {
            setLoading(true);
            try {
                const { data: res, error } = await supabase.functions.invoke('admin-map-data', { body: { cityId: city.id } });
                if (error || res?.error) throw new Error(res?.error || error.message);
                
                const validData = (res?.data || []).map(d => {
                    if (!d.geojson) return null;
                    try {
                        const geo = typeof d.geojson === 'string' ? JSON.parse(d.geojson) : d.geojson;
                        if (!geo.bbox) geo.bbox = turf.bbox(geo);
                        return { ...d, geojson: geo, poi_data: normalizePoiData(d.poi_data) };
                    } catch (e) { return null; }
                }).filter(Boolean);
                
                setMapData(assignColorsToFeatures(validData));
            } catch (error) { 
                console.error(error); 
            } finally { 
                setLoading(false); 
            }
        };
        
        loadData();
    }, [city, isOpen]);

    const renderPolygons = useMemo(() => {
        if (activeLayer !== 'polygons' && activeLayer !== 'all') return null;

        return mapData.map(dist => (
            <GeoJSON 
                key={dist.id} 
                data={dist.geojson} 
                style={{ color: dist.fillColor, weight: 2, fillOpacity: 0.15, fillColor: dist.fillColor }}
            >
                <Tooltip direction="top" className="modern-tooltip">
                    <div className="text-center flex flex-col gap-1.5">
                        <strong className="text-[1.1rem] text-textMain font-extrabold tracking-tight">{dist.name}</strong>
                    </div>
                </Tooltip>
            </GeoJSON>
        ));
    }, [mapData, activeLayer]);

    const renderMarkers = useMemo(() => {
        if (activeLayer === 'polygons') return null;

        const markers = mapData.flatMap(district => {
            if (!district.poi_data || district.poi_data.length === 0) return [];
            return district.poi_data.map((poi, idx) => {
                const shortKey = poi[2].replace('_count', '');
                return (
                    <Marker key={`${district.id}-${idx}`} position={[poi[0], poi[1]]} icon={createEmojiIcon(shortKey, poi[3], fieldsConfig, 24)}>
                        <Tooltip direction="top" offset={[0, -12]} className="modern-tooltip">
                            <div className="text-center flex flex-col gap-1">
                                <strong className="font-extrabold text-[0.95rem]">{getLabelForKey(shortKey)}</strong>
                                <span className="text-[0.8rem] text-textMuted font-medium">{district.name}</span>
                            </div>
                        </Tooltip>
                    </Marker>
                );
            });
        });

        // 🚀 КЛАСТЕРИ ДЛЯ МІСТА ТУТ
        return (
            <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50} showCoverageOnHover={false}>
                {markers}
            </MarkerClusterGroup>
        );
    }, [mapData, fieldsConfig, getLabelForKey, activeLayer]);

    const titleContent = (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-primary border border-blue-500/20 flex items-center justify-center shadow-inner">
                <FaMapMarkedAlt size={14}/>
            </div>
            <span>{city?.name} - {t('admin_map.tab.layer_all')}</span>
        </div>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={titleContent} maxWidth="90vw" bodyStyle={{ padding: 0 }}>
            <div className="h-[75vh] w-full relative bg-main/50 overflow-hidden">
                {!loading && mapData.length > 0 && (
                    <div className="absolute top-4 right-4 z-[400] flex bg-surface/90 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-border animate-[fadeIn_0.3s_ease-out]">
                        {['polygons', 'markers', 'all'].map(layer => (
                            <button
                                key={layer}
                                onClick={() => setActiveLayer(layer)}
                                className={`px-4 py-1.5 rounded-lg text-[0.85rem] font-bold transition-all flex items-center gap-2 ${activeLayer === layer ? 'bg-primary text-white shadow-sm' : 'text-textMuted hover:text-textMain hover:bg-main'}`}
                            >
                                {layer === 'polygons' && t('admin_map.tab.layer_polygons')}
                                {layer === 'markers' && t('admin_map.tab.layer_markers')}
                                {layer === 'all' && t('admin_map.tab.layer_all')}
                            </button>
                        ))}
                    </div>
                )}
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3 text-primary bg-surface p-6 rounded-2xl shadow-xl border border-border">
                            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                            <span className="font-extrabold text-[1.1rem] text-textMain tracking-tight">
                                {t('admin_map.tab.loading')}
                            </span>
                        </div>
                    </div>
                ) : (
                    <MapContainer center={[52.23, 21.01]} zoom={11} className="w-full h-full z-10" zoomControl={true}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        {renderPolygons}
                        {renderMarkers}
                        <MapFitBounds mapData={mapData} />
                    </MapContainer>
                )}
            </div>
            <style>{`.modern-tooltip { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: 1px solid var(--border); box-shadow: var(--shadow-sm); border-radius: 12px; padding: 8px 14px; color: var(--text-main); }`}</style>
        </BaseModal>
    );
}