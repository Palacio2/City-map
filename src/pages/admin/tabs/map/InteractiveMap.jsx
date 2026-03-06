// InteractiveMap.jsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ICON_MAP, getLabelForKey, createEmojiIcon } from './mapIcons';
import styles from './InteractiveMap.module.css';
import { useTranslation } from 'react-i18next';

function FitBounds({ geojson }) {
    const map = useMap();
    useEffect(() => {
        if (geojson) {
            try {
                const layer = L.geoJSON(geojson);
                const bounds = layer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: true, duration: 1.5 });
                }
            } catch {} // Виправлено Warning
        }
    }, [geojson, map]);
    return null;
}

function MapClickHandler({ onMapClick, activeMetric }) {
    useMapEvents({
        click: (e) => {
            if (activeMetric) onMapClick([e.latlng.lng, e.latlng.lat]);
        }
    });
    return null;
}

export default function InteractiveMap({ geojson, pois = [], activeMetric, onAddPoi, onRemovePoi, onUpdatePoi }) {
    const { t } = useTranslation('admin');

    return (
        <div className={styles.mapWrapper}>
            {activeMetric && (
                <div className={styles.activeMetricBanner}>
                    <div className={styles.bannerPulse}></div>
                    <div className={styles.bannerText}>
                        <span>{t('interactiveMap.adding')}</span>
                        <strong>{ICON_MAP[activeMetric] || ICON_MAP.default} {getLabelForKey(activeMetric)}</strong>
                    </div>
                    <div className={styles.bannerHint}>{t('interactiveMap.escCancel')}</div>
                </div>
            )}

            <MapContainer 
                center={[52.23, 21.01]} 
                zoom={6} 
                className={styles.leafletContainer} 
                zoomControl={false}
                style={{ cursor: activeMetric ? 'crosshair' : 'grab' }}
            >
                <TileLayer 
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                    attribution='© <a href="https://carto.com/">Carto</a>'
                />
                
                <FitBounds geojson={geojson} />
                
                {geojson && (
                    <GeoJSON 
                        data={geojson} 
                        style={{ color: '#3b82f6', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.08, dashArray: '8, 8' }} 
                    />
                )}

                {pois.map((poi) => (
                    <Marker 
                        key={poi.id} 
                        position={[poi.coord[1], poi.coord[0]]} 
                        icon={createEmojiIcon(poi.type, poi.source)}
                        draggable={poi.source === 'manual'}
                        eventHandlers={{ 
                            click: () => onRemovePoi(poi.id),
                            dragend: (e) => {
                                const marker = e.target;
                                const position = marker.getLatLng();
                                if (onUpdatePoi) onUpdatePoi(poi.id, [position.lng, position.lat]);
                            }
                        }}
                    >
                        <Tooltip direction="top" className={styles.customTooltip} offset={[0, -15]}>
                            <div className={styles.tooltipContent}>
                                <div className={styles.tooltipTitle}>{getLabelForKey(poi.type)}</div>
                                <span className={poi.source === 'parser' ? styles.tagParser : styles.tagManual}>
                                    {poi.source === 'parser' ? t('interactiveMap.parserTag') : t('interactiveMap.manualTag')}
                                </span>
                                {poi.source === 'manual' ? (
                                    <div className={styles.tooltipAction}>{t('interactiveMap.dragToDelete')}</div>
                                ) : (
                                    <div className={styles.tooltipActionAlert}>{t('interactiveMap.clickToDelete')}</div>
                                )}
                            </div>
                        </Tooltip>
                    </Marker>
                ))}

                <MapClickHandler onMapClick={onAddPoi} activeMetric={activeMetric} />
            </MapContainer>
        </div>
    );
}