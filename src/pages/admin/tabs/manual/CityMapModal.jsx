import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../../../services/api';
import { useTranslation } from 'react-i18next';
import BaseModal from '../../ui/BaseModal';

const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#d946ef', '#ea580c', '#6366f1'];

function MapTabFitBounds({ mapData }) {
    const map = useMap();
    useEffect(() => {
        if (mapData && mapData.length > 0) {
            try {
                const features = mapData.map(d => d.geojson).filter(Boolean);
                if (features.length > 0) {
                    const layer = L.geoJSON(features);
                    const bounds = layer.getBounds();
                    if (bounds.isValid()) {
                        map.fitBounds(bounds, { padding: [30, 30], animate: true, duration: 1 });
                    }
                }
            } catch {} 
        }
    }, [mapData, map]);
    return null;
}

function FixMapSize() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 250);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

export default function CityMapModal({ isOpen, onClose, city }) {
    const { t } = useTranslation('admin');
    const [mapData, setMapData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && city) loadData();
        else setMapData([]);
    }, [isOpen, city]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.geo.getCityMapData(city.id);
            const validData = data.filter(d => d.geojson);
            
            const coloredData = [];
            validData.forEach(d => {
                const usedColors = new Set();
                coloredData.forEach(cd => {
                    const b1 = d.geojson.bbox;
                    const b2 = cd.geojson.bbox;
                    if (b1 && b2 && !(b2[0] > b1[2] || b2[2] < b1[0] || b2[1] > b1[3] || b2[3] < b1[1])) {
                        usedColors.add(cd.fillColor);
                    }
                });
                const availableColor = COLORS.find(c => !usedColors.has(c)) || COLORS[Math.floor(Math.random() * COLORS.length)];
                coloredData.push({ ...d, fillColor: availableColor });
            });

            setMapData(coloredData);
        } catch {} 
        setLoading(false);
    };

    return (
        <BaseModal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🗺️ {t('cityMapModal.title', {defaultValue: 'City Map:'})}</span>
                    <strong style={{ color: 'var(--primary)' }}>{city?.name || ''}</strong>
                </div>
            }
            maxWidth="1000px"
            bodyStyle={{ padding: 0 }}
        >
            <div style={{ width: '100%', height: '70vh', minHeight: '450px', position: 'relative' }}>
                {loading ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', background: 'var(--bg-main)', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59, 130, 246, 0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }}></div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('cityMapModal.loading', {defaultValue: 'Loading map...'})}</div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : mapData.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', background: 'var(--bg-main)', gap: '16px' }}>
                        <div style={{ fontSize: '2.5rem', background: 'rgba(234, 179, 8, 0.1)', padding: '20px', borderRadius: '50%' }}>⚠️</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('cityMapModal.noData', { city: city?.name, defaultValue: 'No map data found' })}</div>
                    </div>
                ) : (
                    <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                        <TileLayer 
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                            attribution='&copy; <a href="https://carto.com/">Carto</a>'
                        />
                        <FixMapSize />
                        <MapTabFitBounds mapData={mapData} />
                        {mapData.map((dist) => (
                            <GeoJSON 
                                key={dist.id} 
                                data={dist.geojson} 
                                style={{ 
                                    color: '#ffffff', 
                                    weight: 2, 
                                    opacity: 1,
                                    fillColor: dist.fillColor, 
                                    fillOpacity: 0.35 
                                }}
                                onEachFeature={(feature, layer) => {
                                    layer.bindTooltip(`
                                        <div style="text-align:center; display: flex; flex-direction: column; gap: 4px;">
                                            <strong style="font-size:1.1rem; color:var(--text-main); font-weight: 800;">${dist.name}</strong>
                                            <span style="font-size:0.85rem; font-weight: 600; color:${dist.is_available ? 'var(--success)' : 'var(--text-muted)'}; background:${dist.is_available ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-hover)'}; padding: 2px 8px; border-radius: var(--radius-sm);">
                                                ${dist.is_available ? t('cityMapModal.published', {defaultValue: 'Published'}) : t('cityMapModal.hidden', {defaultValue: 'Hidden'})}
                                            </span>
                                        </div>
                                    `, { direction: 'top', sticky: true, className: 'modern-tooltip' });
                                }}
                            />
                        ))}
                    </MapContainer>
                )}
            </div>
            <style>{`
                .modern-tooltip { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: 1px solid var(--border); box-shadow: var(--shadow-md); border-radius: var(--radius-md); padding: 10px 14px; }
                .modern-tooltip::before { border-top-color: rgba(255,255,255,0.95); }
                .leaflet-control-container { display: none; }
            `}</style>
        </BaseModal>
    ); 
}