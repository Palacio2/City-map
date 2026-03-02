import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../../../services/api';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function MapTab() {
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [mapData, setMapData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.geo.getCountries().then(setCountries).catch(() => {});
    }, []);

    useEffect(() => {
        if (selectedCountry) {
            api.geo.getCities(selectedCountry).then(setCities).catch(() => {});
        } else {
            setCities([]);
            setSelectedCity('');
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (selectedCity) {
            setLoading(true);
            api.geo.getCityMapData(selectedCity)
                .then(data => setMapData(data.filter(d => d.geojson)))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else {
            setMapData([]);
        }
    }, [selectedCity]);

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

    const handleReset = () => {
        setSelectedCountry('');
        setSelectedCity('');
        setMapData([]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', alignItems: 'center' }}>
                <select 
                    value={selectedCountry} 
                    onChange={e => { setSelectedCountry(e.target.value); setSelectedCity(''); }} 
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '250px', fontSize: '1rem' }}
                >
                    <option value="">-- Оберіть країну --</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select 
                    value={selectedCity} 
                    onChange={e => setSelectedCity(e.target.value)} 
                    disabled={!selectedCountry} 
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '250px', fontSize: '1rem' }}
                >
                    <option value="">-- Оберіть місто --</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <button 
                    onClick={handleReset}
                    style={{ padding: '10px 15px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    🔄 Скинути вибір
                </button>
            </div>

            <div style={{ flex: 1, position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!selectedCity ? (
                    <div style={{ color: '#64748b', fontSize: '1.2rem' }}>Оберіть країну та місто для відображення карти</div>
                ) : loading ? (
                    <div style={{ color: '#64748b', fontSize: '1.2rem' }}>⏳ Завантаження меж районів...</div>
                ) : mapData.length === 0 ? (
                    <div style={{ color: '#64748b', fontSize: '1.2rem' }}>У базі немає районів з геоданими (GeoJSON) для цього міста.</div>
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
                                style={{ color: COLORS[idx % COLORS.length], weight: 3, fillColor: COLORS[idx % COLORS.length], fillOpacity: 0.35 }}
                                onEachFeature={(feature, layer) => {
                                    layer.bindTooltip(`<strong>${dist.name}</strong><br/>${dist.is_available ? '👁️ Опубліковано' : '🙈 Приховано'}`, { direction: 'top', sticky: true });
                                }}
                            />
                        ))}
                    </MapContainer>
                )}
            </div>
        </div>
    );
}