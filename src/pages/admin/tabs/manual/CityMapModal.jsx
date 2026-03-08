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
                        map.fitBounds(bounds, { padding: [30, 30] });
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
            title={`${t('cityMapModal.title', {defaultValue: 'City Map:'})} ${city?.name || ''}`} 
            maxWidth="1000px"
            bodyStyle={{ padding: 0 }}
        >
            <div style={{ width: '100%', height: '65vh', minHeight: '400px', position: 'relative' }}>
                {loading ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600, background: 'var(--bg-main)' }}>
                        {t('cityMapModal.loading', {defaultValue: 'Loading map...'})}
                    </div>
                ) : mapData.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', fontSize: '1.1rem', fontWeight: 600, background: 'var(--bg-main)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
                        {t('cityMapModal.noData', { city: city?.name, defaultValue: 'No map data found' })}
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
                                        <div style="text-align:center;">
                                            <strong style="font-size:1.05rem;color:var(--text-main);">${dist.name}</strong><br/>
                                            <span style="font-size:0.85rem;color:var(--text-muted);margin-top:2px;display:block;">
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
                .modern-tooltip { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: none; box-shadow: var(--shadow-md); border-radius: var(--radius-sm); padding: 8px 14px; }
                .modern-tooltip::before { display: none; }
            `}</style>
        </BaseModal>
    );
}