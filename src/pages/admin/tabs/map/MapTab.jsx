import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../../../services/api';
import { METRIC_GROUPS } from '../../config/metricsConfig';
import { FaEye, FaEyeSlash, FaSync, FaMap } from 'react-icons/fa';
import { createEmojiIcon, getLabelForKey } from './mapIcons';
import { useTranslation } from 'react-i18next';

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
                        map.fitBounds(bounds, { padding: [40, 40], animate: true, duration: 1.5 });
                    }
                }
            } catch {} // Виправлено Warning (e)
        }
    }, [mapData, map]);
    return null;
}

export default function MapTab() {
    const { t } = useTranslation('admin');
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [mapData, setMapData] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const allMetricKeys = METRIC_GROUPS.flatMap(g => g.fields).filter(f => f.type === 'number' && f.key.includes('_count')).map(f => f.key);
    
    const [visibleTypes, setVisibleTypes] = useState(() => {
        const saved = localStorage.getItem('global_map_visible_types');
        return saved ? new Set(JSON.parse(saved)) : new Set(allMetricKeys);
    });

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
                .then(data => {
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
                })
                .catch(() => {})
                .finally(() => setLoading(false));
        } else {
            setMapData([]);
        }
    }, [selectedCity]);

    const handleReset = () => {
        setSelectedCountry('');
        setSelectedCity('');
        setMapData([]);
    };

    const toggleVisibility = (key) => {
        setVisibleTypes(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            localStorage.setItem('global_map_visible_types', JSON.stringify(Array.from(next)));
            return next;
        });
    };

    const showAll = () => {
        const allSet = new Set(allMetricKeys);
        setVisibleTypes(allSet);
        localStorage.setItem('global_map_visible_types', JSON.stringify(Array.from(allSet)));
    };

    const hideAll = () => {
        setVisibleTypes(new Set());
        localStorage.setItem('global_map_visible_types', JSON.stringify([]));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', padding: '0 4px' }}>
             <div style={{ 
                 display: 'flex', gap: '16px', background: '#ffffff', padding: '20px', 
                 borderRadius: '16px', border: '1px solid #e2e8f0', flexWrap: 'wrap', 
                 alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' 
             }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'auto' }}>
                    <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#3b82f6' }}>
                        <FaMap />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{t('mapTab.title')}</h2>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('mapTab.subtitle')}</span>
                    </div>
                </div>

                <select 
                    value={selectedCountry} 
                    onChange={e => { setSelectedCountry(e.target.value); setSelectedCity(''); }} 
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '220px', fontSize: '0.95rem', background: '#f8fafc', outline: 'none', cursor: 'pointer', fontWeight: 500, color: '#334155' }}
                >
                    <option value="">{t('mapTab.selectCountry')}</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select 
                    value={selectedCity} 
                    onChange={e => setSelectedCity(e.target.value)} 
                    disabled={!selectedCountry} 
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '220px', fontSize: '0.95rem', background: selectedCountry ? '#f8fafc' : '#f1f5f9', outline: 'none', cursor: selectedCountry ? 'pointer' : 'not-allowed', fontWeight: 500, color: '#334155', opacity: selectedCountry ? 1 : 0.6 }}
                >
                    <option value="">{t('mapTab.selectCity')}</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <button 
                    onClick={handleReset}
                    style={{ padding: '12px 20px', borderRadius: '12px', border: 'none', background: '#f1f5f9', color: '#475569', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', fontSize: '0.95rem' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                >
                    <FaSync /> {t('mapTab.reset')}
                </button>
            </div>

            <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden' }}>
                 {mapData.length > 0 && (
                     <div style={{ width: '300px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                             <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#0f172a' }}>{t('mapTab.filtersTitle')}</h3>
                             <div style={{ display: 'flex', gap: '8px' }}>
                                 <button onClick={showAll} style={{ flex: 1, padding: '8px', fontSize: '0.85rem', fontWeight: 600, background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>{t('mapTab.showAll')}</button>
                                 <button onClick={hideAll} style={{ flex: 1, padding: '8px', fontSize: '0.85rem', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>{t('mapTab.hideAll')}</button>
                             </div>
                        </div>
                        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {METRIC_GROUPS.map(group => {
                                const countableFields = group.fields.filter(f => f.type === 'number' && f.key.includes('_count'));
                                if (countableFields.length === 0) return null;

                                return (
                                    <div key={group.id}>
                                        <div style={{ fontWeight: '700', marginBottom: '10px', color: '#334155', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{group.icon}</span> {group.label}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {countableFields.map(m => {
                                                const isVisible = visibleTypes.has(m.key);
                                                return (
                                                    <div 
                                                        key={m.key} 
                                                        onClick={() => toggleVisibility(m.key)}
                                                        style={{ 
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                            padding: '8px 12px', borderRadius: '10px',
                                                            cursor: 'pointer', background: isVisible ? '#f8fafc' : 'transparent',
                                                            border: `1px solid ${isVisible ? '#e2e8f0' : 'transparent'}`,
                                                            transition: 'all 0.2s ease', userSelect: 'none'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '0.9rem', fontWeight: isVisible ? 600 : 500, color: isVisible ? '#0f172a' : '#64748b' }}>{m.label}</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.1rem', color: isVisible ? '#3b82f6' : '#cbd5e1' }}>
                                                            {isVisible ? <FaEye /> : <FaEyeSlash />}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                     </div>
                 )}

                <div style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                    {!selectedCity ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#94a3b8' }}>
                            <FaMap style={{ fontSize: '3rem', opacity: 0.5 }} />
                            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{t('mapTab.placeholder')}</div>
                        </div>
                    ) : loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: '#3b82f6' }}>
                            <div style={{ width: '40px', height: '40px', border: '3px solid #bfdbfe', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('mapTab.loading')}</div>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : mapData.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#f59e0b' }}>
                            <div style={{ fontSize: '2rem' }}>⚠️</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{t('mapTab.noData')}</div>
                        </div>
                    ) : (
                        <MapContainer center={[52.23, 21.01]} zoom={6} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                            <TileLayer 
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                                attribution='© <a href="https://carto.com/">Carto</a>'
                            />
                            <MapTabFitBounds mapData={mapData} />
                            {mapData.map((dist) => {
                                const pois = dist.poi_data || dist.parsed_pois || [];
                                const unpackedPois = pois.map((p, i) => {
                                    if (Array.isArray(p)) {
                                        const typeStr = p[2] || 'default';
                                        const normalizedType = typeStr.endsWith('_count') ? typeStr : `${typeStr}_count`;
                                        return { id: `${dist.id}-${i}`, coord: [p[1], p[0]], type: normalizedType, source: p[3] || 'parser' };
                                    }
                                    const typeStr = p.type || 'default';
                                    const normalizedType = typeStr.endsWith('_count') ? typeStr : `${typeStr}_count`;
                                    return { ...p, id: p.id || `${dist.id}-${i}`, type: normalizedType, source: p.source || 'parser' };
                                });

                                return (
                                    <React.Fragment key={dist.id}>
                                        <GeoJSON 
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
                                                        <strong style="font-size:1.1rem;color:#0f172a;">${dist.name}</strong><br/>
                                                        <span style="font-size:0.85rem;color:#64748b;margin-top:4px;display:block;">
                                                            ${dist.is_available ? t('mapTab.published') : t('mapTab.hidden')}
                                                        </span>
                                                    </div>
                                                `, { direction: 'top', sticky: true, className: 'modern-tooltip' });
                                            }}
                                        />
                                        {unpackedPois.filter(p => visibleTypes.has(p.type)).map((poi) => (
                                            <Marker 
                                                key={poi.id} 
                                                position={[poi.coord[1], poi.coord[0]]} 
                                                icon={createEmojiIcon(poi.type, poi.source)}
                                            >
                                                <Tooltip direction="top" className="modern-tooltip">
                                                    <div style={{ textAlign: 'center' }}>
                                                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{getLabelForKey(poi.type)}</strong><br/>
                                                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                                            {poi.source === 'parser' ? t('mapTab.fromParser') : t('mapTab.manualAdd')}
                                                        </span>
                                                    </div>
                                                </Tooltip>
                                            </Marker>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </MapContainer>
                    )}
                </div>
            </div>
            <style>{`
                .modern-tooltip { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: none; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-radius: 12px; padding: 10px 16px; }
                .modern-tooltip::before { display: none; }
                .leaflet-control-container { display: none; }
            `}</style>
        </div>
    );
}