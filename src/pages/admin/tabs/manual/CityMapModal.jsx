import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../../../services/api';
import styles from './EntityModal.module.css';

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
            } catch (e) {}
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
        } catch (e) {}
        setLoading(false);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: '900px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className={styles.title} style={{ margin: 0 }}>🗺️ Карта міста {city?.name}</h3>
                    <button onClick={onClose} className={`${styles.btn} ${styles.cancelBtn}`} style={{ padding: '6px 12px' }}>Закрити</button>
                </div>
                
                <div style={{ width: '100%', height: '65vh', minHeight: '400px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
                    {loading ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1.1rem', fontWeight: 600, background: '#f8fafc' }}>
                            ⏳ Завантаження геоданих...
                        </div>
                    ) : mapData.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '1.1rem', fontWeight: 600, background: '#f8fafc' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
                            Для міста {city?.name} ще не імпортовано межі районів.
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
                                                <strong style="font-size:1.05rem;color:#0f172a;">${dist.name}</strong><br/>
                                                <span style="font-size:0.85rem;color:#64748b;margin-top:2px;display:block;">
                                                    ${dist.is_available ? '🟢 Опубліковано' : '⚪ Приховано'}
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
                    .modern-tooltip { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: none; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-radius: 12px; padding: 8px 14px; }
                    .modern-tooltip::before { display: none; }
                `}</style>
            </div>
        </div>,
        document.body
    );
}