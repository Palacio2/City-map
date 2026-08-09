import { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
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

export default function CityMapModal({ isOpen, onClose, city }: any) {
    const { t } = useTranslation('db');
    const { fieldsConfig } = useDynamicFields();
    const [mapData, setMapData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeLayer, setActiveLayer] = useState('polygons');

    const getLabelForKey = useCallback((key: string) => {
        return fieldsConfig?.find((f: any) => f.key === key || f.key === `${key}_count`)?.label || key;
    }, [fieldsConfig]);

    useEffect(() => {
        if (!isOpen || !city) return;
        setActiveLayer('polygons');
        const loadData = async () => {
            setLoading(true);
            try {
                const { data: res, error } = await supabase.functions.invoke('admin-map-data', { body: { cityId: city.id } });
                if (error || res?.error) throw new Error(res?.error || error.message);
                const validData = (res?.data || []).map((d: any) => {
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
                style={{ color: dist.fillColor, weight: 1.5, fillOpacity: 0.15, fillColor: dist.fillColor }}
            >
                <Tooltip direction="top" className="modern-tooltip">
                    <span className="text-xs font-semibold text-textMain">{dist.name}</span>
                </Tooltip>
            </GeoJSON>
        ));
    }, [mapData, activeLayer]);

    const renderMarkers = useMemo(() => {
        if (activeLayer === 'polygons') return null;
        const markers = mapData.flatMap(district => {
            if (!district.poi_data || district.poi_data.length === 0) return [];
            return district.poi_data.map((poi: any, idx: number) => {
                const shortKey = poi[2].replace('_count', '');
                return (
                    <Marker key={`${district.id}-${idx}`} position={[poi[0], poi[1]]} icon={createEmojiIcon(shortKey, poi[3], fieldsConfig, 24)}>
                        <Tooltip direction="top" offset={[0, -12]} className="modern-tooltip">
                            <div className="flex flex-col text-center">
                                <span className="font-semibold text-xs text-textMain">{getLabelForKey(shortKey)}</span>
                                <span className="text-[10px] text-textMuted">{district.name}</span>
                            </div>
                        </Tooltip>
                    </Marker>
                );
            });
        });

        return (
            <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50} showCoverageOnHover={false}>
                {markers}
            </MarkerClusterGroup>
        );
    }, [mapData, fieldsConfig, getLabelForKey, activeLayer]);

    const titleContent = (
        <div className="flex items-center gap-2">
            <FaMapMarkedAlt className="text-primary text-sm" />
            <span className="text-sm font-semibold text-textMain">{city?.name} — Oгляд картографії</span>
        </div>
    );

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={titleContent} maxWidth="85vw" bodyStyle={{ padding: 0 }}>
            <div className="h-[70vh] w-full relative bg-main overflow-hidden">
                {!loading && mapData.length > 0 && (
                    <div className="absolute top-3 right-3 z-[400] flex bg-surface/90 backdrop-blur-xs p-1 rounded-lg border border-border shadow-subtle">
                        {['polygons', 'markers', 'all'].map(layer => (
                            <button
                                key={layer}
                                onClick={() => setActiveLayer(layer)}
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                    activeLayer === layer ? 'bg-primary text-white' : 'text-textMuted hover:text-textMain'
                                }`}
                            >
                                {layer === 'polygons' && t('admin_map.tab.layer_polygons')}
                                {layer === 'markers' && t('admin_map.tab.layer_markers')}
                                {layer === 'all' && t('admin_map.tab.layer_all')}
                            </button>
                        ))}
                    </div>
                )}
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-50">
                        <div className="flex items-center gap-2 text-textMuted text-xs font-medium">
                            <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
                            <span>{t('admin_map.tab.loading')}</span>
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
        </BaseModal>
    );
}