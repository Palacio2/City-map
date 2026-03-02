import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../../../services/api';
import styles from './EntityModal.module.css';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

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
            setMapData(data.filter(d => d.geojson));
        } catch (e) {}
        setLoading(false);
    };

    if (!isOpen) return null;

    const getBounds = () => {
        if (mapData.length === 0) return [[52.2297, 21.0122], [52.23, 21.013]];
        let allCoords = [];
        mapData.forEach(d => {
            if (d.geojson && d.geojson.bbox) {
                allCoords.push([d.geojson.bbox[1], d.geojson.bbox[0]]);
                allCoords.push([d.geojson.bbox[3], d.geojson.bbox[2]]);
            }
        });
        if (allCoords.length > 0) return allCoords;
        return [[52.2297, 21.0122], [52.23, 21.013]];
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose} style={{ zIndex: 99999 }}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ width: '90vw', height: '90vh', maxWidth: '1200px', display: 'flex', flexDirection: 'column', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 className={styles.title} style={{ margin: 0 }}>🗺️ Карта міста: {city?.name}</h3>
                    <button onClick={onClose} className={`${styles.btn} ${styles.cancelBtn}`}>Закрити</button>
                </div>
                
                <div style={{ flex: 1, position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {loading ? (
                        <div style={{ fontSize: '1.2rem', color: '#64748b' }}>⏳ Завантаження меж районів...</div>
                    ) : mapData.length === 0 ? (
                        <div style={{ fontSize: '1.2rem', color: '#64748b' }}>У базі немає районів з геоданими (GeoJSON) для цього міста.</div>
                    ) : (
                        <MapContainer bounds={getBounds()} style={{ height: '100%', width: '100%' }} zoomControl={true}>
                            <TileLayer 
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                                attribution='&copy; <a href="https://carto.com/">Carto</a>'
                            />
                            {mapData.map((dist, idx) => (
                                <GeoJSON 
                                    key={dist.id} 
                                    data={dist.geojson} 
                                    style={{ 
                                        color: COLORS[idx % COLORS.length], 
                                        weight: 3, 
                                        fillColor: COLORS[idx % COLORS.length], 
                                        fillOpacity: 0.35 
                                    }}
                                    onEachFeature={(feature, layer) => {
                                        layer.bindTooltip(`<strong>${dist.name}</strong><br/>${dist.is_available ? '👁️ Опубліковано' : '🙈 Приховано'}`, { direction: 'top', sticky: true });
                                    }}
                                />
                            ))}
                        </MapContainer>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}