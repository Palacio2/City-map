import React from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ICON_MAP, getLabelForKey, createEmojiIcon } from './mapIcons';
import styles from './InteractiveMap.module.css';

function MapClickHandler({ onMapClick, activeMetric }) {
    useMapEvents({
        click: (e) => {
            if (activeMetric) onMapClick([e.latlng.lng, e.latlng.lat]);
        }
    });
    return null;
}

export default function InteractiveMap({ geojson, pois = [], activeMetric, onAddPoi, onRemovePoi }) {
    
    const getBounds = () => {
        if (!geojson || !geojson.bbox) return [[52.2297, 21.0122], [52.23, 21.013]]; 
        return [ [geojson.bbox[1], geojson.bbox[0]], [geojson.bbox[3], geojson.bbox[2]] ];
    };

    return (
        <div className={styles.mapWrapper}>
            {activeMetric && (
                <div className={styles.activeMetricBanner}>
                    <span className={styles.bannerPulse}></span>
                    🎯 Клікніть на карту, щоб додати: 
                    <strong>{ICON_MAP[activeMetric] || ICON_MAP.default} {getLabelForKey(activeMetric)}</strong>
                </div>
            )}

            <MapContainer bounds={getBounds()} className={styles.leafletContainer} zoomControl={true}>
                <TileLayer 
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                    attribution='&copy; <a href="https://carto.com/">Carto</a>'
                />
                
                {geojson && (
                    <GeoJSON 
                        data={geojson} 
                        style={{ color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.1, dashArray: '6, 6' }} 
                    />
                )}

                {pois.map((poi) => (
                    <Marker 
                        key={poi.id} 
                        position={[poi.coord[1], poi.coord[0]]} 
                        icon={createEmojiIcon(poi.type, poi.source)}
                        eventHandlers={{ click: () => onRemovePoi(poi.id) }}
                    >
                        <Tooltip direction="top" className={styles.customTooltip}>
                            <div className={styles.tooltipContent}>
                                <strong>{getLabelForKey(poi.type)}</strong>
                                <span className={styles.sourceTag}>
                                    {poi.source === 'parser' ? '🤖 Від парсера' : '👤 Додано вручну'}
                                </span>
                                <small className={styles.tooltipHint}>(клік щоб видалити)</small>
                            </div>
                        </Tooltip>
                    </Marker>
                ))}

                <MapClickHandler onMapClick={onAddPoi} activeMetric={activeMetric} />
            </MapContainer>
        </div>
    );
}