/* eslint-disable react-refresh/only-export-components */
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import * as FaIcons from 'react-icons/fa';
import * as turf from '@turf/turf';
import { GeoFeatureData, MapFitBoundsProps, NormalizedPoiPoint } from '@admin/core/types/geo.types';

export type { GeoFeatureData, MapFitBoundsProps, NormalizedPoiPoint };

export const COLORS: string[] = [
    '#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#d946ef', '#ea580c', '#6366f1'
];

export const assignColorsToFeatures = <T extends GeoFeatureData>(validData: T[]): (T & { fillColor: string })[] => {
    const coloredData: (T & { fillColor: string })[] = [];
    validData.forEach(d => {
        const usedColors = new Set<string>();
        coloredData.forEach(cd => {
            const b1 = d.geojson?.bbox;
            const b2 = cd.geojson?.bbox;
            if (b1 && b2 && !(b2[0] > b1[2] || b2[2] < b1[0] || b2[1] > b1[3] || b2[3] < b1[1])) {
                usedColors.add(cd.fillColor);
            }
        });
        const availableColor = COLORS.find(c => !usedColors.has(c)) || COLORS[Math.floor(Math.random() * COLORS.length)];
        coloredData.push({ ...d, fillColor: availableColor });
    });
    return coloredData;
};

export function MapFitBounds({
    mapData,
    geojson,
    padding = [30, 30],
    maxZoom = 16,
    duration = 1,
    pois
}: MapFitBoundsProps): null {
    const map = useMap();
    useEffect(() => {
        let features: GeoJSON.GeoJsonObject[] = [];
        if (mapData && mapData.length > 0) {
            features = mapData.map(d => (d.geojson ? d.geojson : d) as unknown as GeoJSON.GeoJsonObject).filter(Boolean);
        } else if (geojson) {
            features = [geojson as unknown as GeoJSON.GeoJsonObject];
        }

        if (features.length > 0) {
            try {
                const layer = L.geoJSON(features);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, {
                        padding: padding as L.FitBoundsOptions['padding'],
                        maxZoom,
                        animate: true,
                        duration
                    });
                }
            } catch (e) {
                console.warn("MapFitBounds error:", e);
            }
        } else if (pois && pois.length > 0) {
            try {
                const latLngs = pois.map((p: unknown) => {
                    if (Array.isArray(p)) return [p[0], p[1]] as [number, number];
                    const obj = p as { lat: number; lng: number };
                    return [obj.lat, obj.lng] as [number, number];
                });
                const bounds = L.latLngBounds(latLngs);
                if (bounds.isValid()) {
                    map.fitBounds(bounds, {
                        padding: padding as L.FitBoundsOptions['padding'],
                        maxZoom,
                        animate: true,
                        duration
                    });
                }
            } catch (e) {
                console.warn("MapFitBounds pois error:", e);
            }
        }
    }, [mapData, geojson, pois, map, padding, maxZoom, duration]);
    return null;
}

export const normalizePoiData = (rawPoi: unknown): NormalizedPoiPoint[] => {
    let poi = rawPoi;
    while (typeof poi === 'string') {
        try { poi = JSON.parse(poi); } catch { break; }
    }
    if (!poi) return [];
    
    let flatPois: unknown[] = [];
    if (Array.isArray(poi)) {
        if (poi.length > 0 && poi[0] && typeof poi[0] === 'object' && (poi[0] as {type?: string}).type === 'Feature') {
            poi.forEach((f: { geometry?: { type: string; coordinates: number[] }; properties?: { type?: string } }) => {
                if (f.geometry?.type === 'Point') {
                    flatPois.push([f.geometry.coordinates[1], f.geometry.coordinates[0], f.properties?.type || 'unknown', 'parser']);
                }
            });
        } else {
            flatPois = poi;
        }
    } else if (typeof poi === 'object' && poi !== null) {
        const pObj = poi as { type?: string; features?: Array<{ geometry?: { type: string; coordinates: number[] }; properties?: { type?: string } }>; [key: string]: unknown };
        if (pObj.type === 'FeatureCollection' && Array.isArray(pObj.features)) {
            pObj.features.forEach(f => {
                if (f.geometry?.type === 'Point') {
                    flatPois.push([f.geometry.coordinates[1], f.geometry.coordinates[0], f.properties?.type || 'unknown', 'parser']);
                }
            });
        } else {
            Object.keys(pObj).forEach(type => {
                const points = pObj[type];
                if (Array.isArray(points)) {
                    points.forEach((pt: unknown) => {
                        if (Array.isArray(pt)) flatPois.push([pt[0], pt[1], type, 'parser']);
                        else if (typeof pt === 'object' && pt !== null) {
                            const p = pt as { lat?: number; lng?: number; lon?: number; [index: number]: number };
                            flatPois.push([p.lat ?? p[0], p.lng ?? p.lon ?? p[1], type, 'parser']);
                        }
                    });
                }
            });
        }
    }

    const result: (NormalizedPoiPoint | null)[] = flatPois.map(rawP => {
        if (!rawP) return null;
        let lat: number = NaN, lng: number = NaN, type: string = '', source: string = 'parser';
        if (Array.isArray(rawP)) {
            lat = parseFloat(rawP[0]);
            lng = parseFloat(rawP[1]);
            type = rawP[2];
            source = rawP[3] || 'parser';
        } else if (typeof rawP === 'object') {
            const p = rawP as { lat?: string|number; lng?: string|number; lon?: string|number; type?: string; source?: string; [index: number]: string|number };
            lat = parseFloat((p.lat ?? p[0]) as string);
            lng = parseFloat((p.lng ?? p.lon ?? p[1]) as string);
            type = (p.type ?? p[2]) as string;
            source = (p.source ?? p[3] ?? 'parser') as string;
        }
        if (isNaN(lat) || isNaN(lng) || !type) return null;
        if (lat > 14 && lat < 40 && lng > 44 && lng < 55) {
            const temp = lat; lat = lng; lng = temp;
        }
        return [lat, lng, type, source] as NormalizedPoiPoint;
    });
    
    return result.filter((item): item is NormalizedPoiPoint => item !== null);
};

export const parseAndFixGeoJSON = (d: GeoFeatureData): GeoFeatureData | null => {
    if (!d.geojson) return null;
    try {
        const geo = typeof d.geojson === 'string' ? JSON.parse(d.geojson) : d.geojson;
        if (!geo.bbox) geo.bbox = turf.bbox(geo as turf.AllGeoJSON);
        return {
            ...d,
            geojson: geo,
            poi_data: normalizePoiData(d.poi_data)
        };
    } catch (error) {
        console.warn(`Помилка парсингу geojson для району ${d.name || d.id}:`, error);
        return null;
    }
};

export const createEmojiIcon = (
    key: string,
    source?: string,
    fieldsConfig?: Record<string, { icon?: string }> | { key?: string; field_code?: string; icon?: string }[],
    size: number = 28,
    dbIconMap: Record<string, { icon?: string }> | null = null
): L.DivIcon => {
    let iconValue = dbIconMap?.[key]?.icon;
    if (!iconValue && fieldsConfig) {
        const cleanKey = key.replace('_count', '');
        const field = Array.isArray(fieldsConfig)
            ? fieldsConfig.find((f: { key?: string; field_code?: string; icon?: string }) => {
                const fKeyClean = (f.key || f.field_code || '').replace('_count', '');
                return fKeyClean === cleanKey;
            })
            : fieldsConfig[cleanKey] || fieldsConfig[`${cleanKey}_count`];
        iconValue = field?.icon;
    }
    iconValue = iconValue || '📍';
    const getCategoryColor = (str: string): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
        return COLORS[hash % COLORS.length];
    };
    
    const uniqueColor = getCategoryColor(key);
    const borderColor = source === 'manual' ? '#3b82f6' : uniqueColor;
    const bgColor = source === 'manual' ? '#dbeafe' : '#ffffff';
    const fontSize = size > 28 ? 16 : 14;
    let htmlContent = iconValue;
    const faIconsRecord = FaIcons as unknown as Record<string, React.ElementType>;
    
    if (typeof iconValue === 'string' && iconValue.startsWith('Fa') && faIconsRecord[iconValue]) {
        const IconComponent = faIconsRecord[iconValue];
        htmlContent = renderToString(<IconComponent style={{ color: uniqueColor, width: '100%', height: '100%' }} />);
    }
    
    return L.divIcon({
        html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;border:2px solid${borderColor};background-color:${bgColor};box-shadow:0 2px 4px rgba(0,0,0,0.1);font-size:${fontSize}px; z-index: 1000; padding: ${iconValue.startsWith('Fa') ? '4px' : '0'};">${htmlContent}</div>`,
        className: 'custom-emoji-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2)]
    });
};