import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import * as FaIcons from 'react-icons/fa';

export const COLORS = [
    '#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#d946ef', '#ea580c', '#6366f1'
];

export const assignColorsToFeatures = (validData) => {
    const coloredData = [];
    validData.forEach(d => {
        const usedColors = new Set();
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

export function MapFitBounds({ mapData, geojson, padding = [30, 30], maxZoom = 16, duration = 1 }) {
    const map = useMap();
    
    useEffect(() => {
        let features = [];
        if (mapData && mapData.length > 0) {
            features = mapData.map(d => d.geojson ? d.geojson : d).filter(Boolean);
        } else if (geojson) {
            features = [geojson];
        }

        if (features.length > 0) {
            try {
                const layer = L.geoJSON(features);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding, maxZoom, animate: true, duration });
                }
            } catch (e) {
                console.warn("MapFitBounds error:", e);
            } 
        }
    }, [mapData, geojson, map, padding, maxZoom, duration]);

    return null;
}

export const normalizePoiData = (rawPoi) => {
    let poi = rawPoi;
    while (typeof poi === 'string') {
        try { poi = JSON.parse(poi); } catch(err) { break; }
    }
    if (!poi) return [];

    let flatPois = [];

    if (Array.isArray(poi)) {
        if (poi.length > 0 && poi[0].type === 'Feature') {
            poi.forEach(f => {
                if (f.geometry?.type === 'Point') {
                    flatPois.push([f.geometry.coordinates[1], f.geometry.coordinates[0], f.properties?.type || 'unknown', 'parser']);
                }
            });
        } else {
            flatPois = poi;
        }
    } else if (typeof poi === 'object') {
        if (poi.type === 'FeatureCollection' && Array.isArray(poi.features)) {
            poi.features.forEach(f => {
                if (f.geometry?.type === 'Point') {
                    flatPois.push([f.geometry.coordinates[1], f.geometry.coordinates[0], f.properties?.type || 'unknown', 'parser']);
                }
            });
        } else {
            Object.keys(poi).forEach(type => {
                const points = poi[type];
                if (Array.isArray(points)) {
                    points.forEach(pt => {
                        if (Array.isArray(pt)) flatPois.push([pt[0], pt[1], type, 'parser']);
                        else if (typeof pt === 'object' && pt !== null) {
                            flatPois.push([pt.lat ?? pt[0], pt.lng ?? pt.lon ?? pt[1], type, 'parser']);
                        }
                    });
                }
            });
        }
    }

    return flatPois.map(p => {
        if (!p) return null;
        let lat, lng, type, source;

        if (Array.isArray(p)) {
            lat = parseFloat(p[0]); lng = parseFloat(p[1]); type = p[2]; source = p[3] || 'parser';
        } else if (typeof p === 'object') {
            lat = parseFloat(p.lat ?? p[0]); lng = parseFloat(p.lng ?? p.lon ?? p[1]); type = p.type ?? p[2]; source = p.source ?? p[3] ?? 'parser';
        }

        if (isNaN(lat) || isNaN(lng) || !type) return null;
        
        if ((lat > 14 && lat < 40 && lng > 44 && lng < 55)) {
            const temp = lat; lat = lng; lng = temp;
        }
        return [lat, lng, type, source];
    }).filter(Boolean);
};

export const createEmojiIcon = (key, source, fieldsConfig, size = 28, dbIconMap = null) => {
    let iconValue = dbIconMap?.[key]?.icon;
    
    // ВИПРАВЛЕНИЙ ПОШУК: Ігноруємо _count щоб завжди знаходити правильну іконку в базі
    if (!iconValue && fieldsConfig) {
        const cleanKey = key.replace('_count', '');
        const field = Array.isArray(fieldsConfig) 
            ? fieldsConfig.find(f => {
                const fKeyClean = (f.key || f.field_code || '').replace('_count', '');
                return fKeyClean === cleanKey;
            })
            : fieldsConfig[cleanKey] || fieldsConfig[`${cleanKey}_count`];
            
        iconValue = field?.icon;
    }
    
    // Якщо іконки немає навіть в базі, ставимо запасну пінеску
    iconValue = iconValue || '📍';
    
    // Автоматично підбираємо колір для рамки маркера на основі його типу
    const getCategoryColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
        return COLORS[hash % COLORS.length];
    };

    const uniqueColor = getCategoryColor(key);
    const borderColor = source === 'manual' ? '#3b82f6' : uniqueColor;
    const bgColor = source === 'manual' ? '#dbeafe' : '#ffffff';
    const fontSize = size > 28 ? 16 : 14;
    
    let htmlContent = iconValue;

    // ПІДТРИМКА FONT AWESOME: Якщо в базі написано "FaSchool", малюємо векторну іконку
    if (typeof iconValue === 'string' && iconValue.startsWith('Fa') && FaIcons[iconValue]) {
        const IconComponent = FaIcons[iconValue];
        htmlContent = renderToString(<IconComponent style={{ color: uniqueColor, width: '100%', height: '100%' }} />);
    }
    
    return L.divIcon({
        html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${borderColor};background-color:${bgColor};box-shadow:0 2px 4px rgba(0,0,0,0.1);font-size:${fontSize}px; z-index: 1000; padding: ${iconValue.startsWith('Fa') ? '4px' : '0'};">${htmlContent}</div>`,
        className: 'custom-emoji-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2)]
    });
};