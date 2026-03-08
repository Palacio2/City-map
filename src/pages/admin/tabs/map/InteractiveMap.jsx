import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { ICON_MAP, getLabelForKey, createEmojiIcon } from './mapIcons';
import styles from './InteractiveMap.module.css';
import { useTranslation } from 'react-i18next';

const createCustomClusterIcon = (cluster) => {
    return L.divIcon({
        html: `<div style="background-color: var(--primary, #3b82f6); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: sans-serif; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                ${cluster.getChildCount()}
              </div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
};

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
            } catch {} 
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

function EditorFastMarkers({ pois, t, onRemovePoi, onUpdatePoi }) {
    const map = useMap();
    const callbacksRef = useRef({ onRemovePoi, onUpdatePoi });

    useEffect(() => {
        callbacksRef.current = { onRemovePoi, onUpdatePoi };
    }, [onRemovePoi, onUpdatePoi]);

    useEffect(() => {
        if (!pois || pois.length === 0) return;
        const clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            iconCreateFunction: createCustomClusterIcon,
            maxClusterRadius: 40,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            disableClusteringAtZoom: 17
        });

        const leafletMarkers = pois.map(poi => {
            const isManual = poi.source === 'manual';
            const marker = L.marker([poi.coord[1], poi.coord[0]], { 
                icon: createEmojiIcon(poi.type, poi.source),
                draggable: isManual
            });
            
            const labelText = getLabelForKey(poi.type);
            const tagClass = poi.source === 'parser' ? styles.tagParser : styles.tagManual;
            const sourceText = poi.source === 'parser' ? t('interactiveMap.parserTag') : t('interactiveMap.manualTag');
            const actionText = isManual ? t('interactiveMap.dragToDelete') : t('interactiveMap.clickToDelete');
            const actionClass = isManual ? styles.tooltipAction : styles.tooltipActionAlert;

            marker.bindTooltip(`
                <div class="${styles.tooltipContent}">
                    <div class="${styles.tooltipTitle}">${labelText}</div>
                    <span class="${tagClass}">${sourceText}</span>
                    <div class="${actionClass}">${actionText}</div>
                </div>
            `, { direction: 'top', className: styles.customTooltip, offset: [0, -15] });
            
            marker.on('click', () => {
                if (callbacksRef.current.onRemovePoi) callbacksRef.current.onRemovePoi(poi.id);
            });

            marker.on('dragend', (e) => {
                const position = e.target.getLatLng();
                if (callbacksRef.current.onUpdatePoi) {
                    callbacksRef.current.onUpdatePoi(poi.id, [position.lng, position.lat]);
                }
            });

            return marker;
        });

        clusterGroup.addLayers(leafletMarkers);
        map.addLayer(clusterGroup);

        return () => map.removeLayer(clusterGroup);
    }, [pois, map, t]);

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

                <EditorFastMarkers 
                    pois={pois} 
                    t={t} 
                    onRemovePoi={onRemovePoi} 
                    onUpdatePoi={onUpdatePoi} 
                />

                <MapClickHandler onMapClick={onAddPoi} activeMetric={activeMetric} />
            </MapContainer>
        </div>
    );
}