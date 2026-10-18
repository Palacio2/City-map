import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Map as LeafletMap } from 'leaflet';
import type { Layer } from 'leaflet';
import type { GeoJsonObject, Feature } from 'geojson';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapFitBounds, createEmojiIcon } from '@admin/core/utils/mapHelpers';
import { GeoFeatureData, NormalizedPoiPoint } from '@admin/core/types/geo.types';
import { FormattedFieldItem } from '@admin/core/types/ui.types';

export interface LeafletGeoViewerProps {
    mapData?: GeoFeatureData[];
    singleGeoJson?: Record<string, unknown> | null;
    pois?: (NormalizedPoiPoint & { originalIndex?: number })[];
    activeLayer?: 'polygons' | 'markers' | 'all';
    fieldsConfig?: FormattedFieldItem[];
    getLabelForKey?: (key: string) => string;
    isAddingMode?: boolean;
    onMapClick?: (e: { latlng: { lat: number; lng: number } }) => void;
    onMarkerClick?: (index: number) => void;
    mapRef?: React.RefObject<LeafletMap>;
}

const escapeHTML = (str: string) => str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[tag] || tag));

export const LeafletGeoViewer: React.FC<LeafletGeoViewerProps> = ({
    mapData = [],
    singleGeoJson,
    pois = [],
    activeLayer = 'all',
    fieldsConfig,
    getLabelForKey,
    isAddingMode = false,
    onMapClick,
    onMarkerClick,
    mapRef
}) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const checkTheme = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const tileUrl = isDarkMode
        ? "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
        
    const showPolygons = activeLayer === 'polygons' || activeLayer === 'all';
    const showMarkers = activeLayer === 'markers' || activeLayer === 'all';

    const geoJsonStyle = useCallback((feature?: Feature) => ({
        color: (feature?.properties?.fillColor as string) || '#3388ff',
        weight: 2,
        fillOpacity: 0.18,
        fillColor: (feature?.properties?.fillColor as string) || '#3388ff',
    }), []);

    const onEachGeoFeature = useCallback((feature: Feature, layer: Layer) => {
        if (feature.properties?.name) {
            const safeName = escapeHTML(feature.properties.name);
            layer.bindTooltip(
                `<div class="text-center font-sans font-semibold text-xs">${safeName}</div>`,
                { direction: "top", sticky: true, className: "modern-tooltip" }
            );
        }
    }, []);

    const renderPolygons = useMemo(() => {
        if (!showPolygons) return null;
        if (singleGeoJson) {
            return <GeoJSON key="single-geojson" data={(singleGeoJson as unknown) as GeoJsonObject} style={{ color: '#c25e26', weight: 2, fillOpacity: 0.15 }} />;
        }
        
        if (mapData.length > 0) {
            const featureCollection = {
                type: "FeatureCollection" as const,
                features: mapData.map(dist => {
                    const geo = dist.geojson as Record<string, unknown>;
                    return geo.type === 'Feature'
                        ? { ...geo, properties: { ...(geo.properties as Record<string, unknown>), name: dist.name, fillColor: dist.fillColor } }
                        : { type: "Feature", geometry: geo, properties: { name: dist.name, fillColor: dist.fillColor } };
                })
            };
            
            const uniqueKey = `geojson-${mapData.length}-${activeLayer}`;
            return (
                <GeoJSON
                    key={uniqueKey}
                    data={(featureCollection as unknown) as GeoJsonObject}
                    style={geoJsonStyle}
                    onEachFeature={onEachGeoFeature}
                />
            );
        }
        return null;
    }, [mapData, singleGeoJson, showPolygons, geoJsonStyle, onEachGeoFeature, activeLayer]);

    return (
        <MapContainer
            center={[52.23, 21.01]}
            zoom={6}
            className={`w-full h-full z-10 ${isAddingMode ? 'cursor-crosshair' : ''}`}
            zoomControl={!isAddingMode}
            ref={mapRef as React.Ref<LeafletMap>}
        >
            <TileLayer url={tileUrl} maxZoom={19} />
            {renderPolygons}
            
            <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50} showCoverageOnHover={false}>
                {(showMarkers ? pois : []).map((poi, idx: number) => {
                    const originalIndex = poi.originalIndex !== undefined ? poi.originalIndex : idx;
                    return (
                        <Marker
                            key={originalIndex}
                            position={[poi[0], poi[1]]}
                            icon={createEmojiIcon(poi[2], poi[3], fieldsConfig, 28)}
                            eventHandlers={{ click: () => onMarkerClick?.(originalIndex) }}
                        >
                            <Tooltip direction="top" offset={[0, -14]} className="modern-tooltip">
                                <div className="text-center font-semibold text-xs text-textMain">
                                    {getLabelForKey ? getLabelForKey(poi[2]) : poi[2]}
                                </div>
                            </Tooltip>
                        </Marker>
                    );
                })}
            </MarkerClusterGroup>
            
            <MapFitBounds mapData={mapData} geojson={singleGeoJson} pois={pois} />
            {isAddingMode && onMapClick && (
                <div
                    className="absolute inset-0 z-[400]"
                    onClick={(e: React.MouseEvent) => {
                        if (mapRef && 'current' in mapRef && mapRef.current) {
                            onMapClick({ latlng: mapRef.current.mouseEventToLatLng(e.nativeEvent) });
                        }
                    }}
                />
            )}
        </MapContainer>
    );
};