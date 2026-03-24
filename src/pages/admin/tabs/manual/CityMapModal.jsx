import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@supabaseClient';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { normalizePoiData, assignColorsToFeatures, MapFitBounds, createEmojiIcon } from '../../utils/mapHelpers';

export default function CityMapModal({ isOpen, onClose, city }) {
    const { t } = useTranslation('adminManual');
    const { fieldsConfig } = useDynamicFields();
    const [mapData, setMapData] = useState([]);
    const [loading, setLoading] = useState(false);

    const getLabelForKey = (key) => fieldsConfig?.find(f => f.key === key || f.key === `${key}_count`)?.label || key;

    useEffect(() => {
        if (!isOpen || !city) return;
        
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
                console.error('Failed to load map data:', error); 
            } finally { 
                setLoading(false); 
            }
        };
        
        loadData();
    }, [city, isOpen]);

    const renderMarkers = useMemo(() => {
        return mapData.flatMap(district => {
            if (!district.poi_data || district.poi_data.length === 0) return [];
            return district.poi_data.map((poi, idx) => {
                const shortKey = poi[2].replace('_count', '');
                return (
                    <Marker key={`${district.id}-${idx}`} position={[poi[0], poi[1]]} icon={createEmojiIcon(shortKey, poi[3], fieldsConfig, 24)}>
                        <Tooltip direction="top" offset={[0, -12]}>
                            <div className="font-bold text-[0.85rem]">{getLabelForKey(shortKey)}</div>
                            <div className="text-[0.7rem] opacity-70">{district.name}</div>
                        </Tooltip>
                    </Marker>
                );
            });
        });
    }, [mapData, fieldsConfig]);

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={city ? t('manualSidebar.cityMapTitle', { city: city.name }) : 'Карта'} maxWidth="95vw">
            <div className="h-[75vh] w-full relative bg-surface rounded-b-xl overflow-hidden">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3 text-primary">
                            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin"></div>
                            <span className="font-bold text-[1.1rem]">Завантаження ГІС даних...</span>
                        </div>
                    </div>
                ) : (
                    <MapContainer center={[52.23, 21.01]} zoom={11} className="w-full h-full z-10" zoomControl={true}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        {mapData.map(dist => (
                            <GeoJSON key={dist.id} data={dist.geojson} style={{ color: dist.fillColor, weight: 2, fillOpacity: 0.15, fillColor: dist.fillColor }}>
                                <Tooltip direction="top" sticky className="modern-tooltip">
                                    <div className="text-center flex flex-col gap-1.5">
                                        <strong className="text-[1.1rem] text-textMain font-extrabold tracking-tight">{dist.name}</strong>
                                    </div>
                                </Tooltip>
                            </GeoJSON>
                        ))}
                        {renderMarkers}
                        <MapFitBounds mapData={mapData} />
                    </MapContainer>
                )}
            </div>
            <style>{`.modern-tooltip { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: 1px solid var(--border); box-shadow: var(--shadow-sm); border-radius: var(--radius-md); padding: 12px 16px; }`}</style>
        </BaseModal>
    );
}