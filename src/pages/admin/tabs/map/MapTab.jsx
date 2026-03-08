import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { api } from '../../../../services/api';
import { METRIC_GROUPS } from '../../config/metricsConfig';
import { FaEye, FaEyeSlash, FaSync, FaMap } from 'react-icons/fa';
import { createEmojiIcon, getLabelForKey } from './mapIcons';
import { useTranslation } from 'react-i18next';
import uiStyles from '../../ui/AdminUI.module.css';
import { useAdmin } from '../../hooks/AdminContext';

const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#d946ef', '#ea580c', '#6366f1'];

const createCustomClusterIcon = (cluster) => {
    return L.divIcon({
        html: `<div style="background-color: var(--primary, #3b82f6); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-family: sans-serif; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                ${cluster.getChildCount()}
              </div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(40, 40, true),
    });
};

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
            } catch {} 
        }
    }, [mapData, map]);
    return null;
}

function AdminFastMarkers({ pois, t }) {
    const map = useMap();
    useEffect(() => {
        if (!pois || pois.length === 0) return;
        const clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            iconCreateFunction: createCustomClusterIcon,
            maxClusterRadius: 40,
            showCoverageOnHover: false,
            disableClusteringAtZoom: 17,
            spiderfyOnMaxZoom: true
        });

        const leafletMarkers = pois.map(poi => {
            const marker = L.marker([poi.coord[1], poi.coord[0]], { 
                icon: createEmojiIcon(poi.type, poi.source) 
            });
            
            const labelText = getLabelForKey(poi.type);
            const sourceText = poi.source === 'parser' ? t('mapTab.fromParser') : t('mapTab.manualAdd');
            
            marker.bindTooltip(`
                <div style="text-align: center;">
                    <strong style="font-size: 0.95rem; color: #1e293b;">${labelText}</strong><br/>
                    <span style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">
                        ${sourceText}
                    </span>
                </div>
            `, { direction: 'top', className: 'modern-tooltip' });
            
            return marker;
        });

        clusterGroup.addLayers(leafletMarkers);
        map.addLayer(clusterGroup);

        return () => map.removeLayer(clusterGroup);
    }, [pois, map, t]);
    return null;
}

export default function MapTab() {
    const { t } = useTranslation('admin');
    
    const { currentAdmin } = useAdmin();
    const isSuperAdmin = currentAdmin?.role === 'super_admin';
    const adminCityIds = currentAdmin?.cities || [];

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
            api.geo.getCities(selectedCountry).then(fetchedCities => {
                if (isSuperAdmin) {
                    setCities(fetchedCities);
                } else {
                    setCities(fetchedCities.filter(c => adminCityIds.includes(c.id)));
                }
            }).catch(() => {});
        } else {
            setCities([]);
            setSelectedCity('');
        }
    }, [selectedCountry, isSuperAdmin, adminCityIds]);

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

    const allVisiblePois = useMemo(() => {
        const list = [];
        mapData.forEach(dist => {
            const pois = dist.poi_data || dist.parsed_pois || [];
            pois.forEach((p, i) => {
                let unpacked;
                if (Array.isArray(p)) {
                    const typeStr = p[2] || 'default';
                    const normalizedType = typeStr.endsWith('_count') ? typeStr : `${typeStr}_count`;
                    unpacked = { id: `${dist.id}-${i}`, coord: [p[1], p[0]], type: normalizedType, source: p[3] || 'parser' };
                } else {
                    const typeStr = p.type || 'default';
                    const normalizedType = typeStr.endsWith('_count') ? typeStr : `${typeStr}_count`;
                    unpacked = { ...p, id: p.id || `${dist.id}-${i}`, type: normalizedType, source: p.source || 'parser' };
                }
                if (visibleTypes.has(unpacked.type)) {
                    list.push(unpacked);
                }
            });
        });
        return list;
    }, [mapData, visibleTypes]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', padding: '0 4px' }}>
             <div style={{ 
                 display: 'flex', gap: '16px', background: 'var(--bg-surface)', padding: '20px', 
                 borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', flexWrap: 'wrap', 
                 alignItems: 'center', boxShadow: 'var(--shadow-sm)' 
             }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'auto' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--primary)' }}>
                        <FaMap />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{t('mapTab.title')}</h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('mapTab.subtitle')}</span>
                    </div>
                </div>

                <select 
                    value={selectedCountry} 
                    onChange={e => { setSelectedCountry(e.target.value); setSelectedCity(''); }} 
                    className={uiStyles.input}
                    style={{ width: 'auto', minWidth: '200px' }}
                >
                    <option value="">{t('mapTab.selectCountry')}</option>
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select 
                    value={selectedCity} 
                    onChange={e => setSelectedCity(e.target.value)} 
                    disabled={!selectedCountry || cities.length === 0} 
                    className={uiStyles.input}
                    style={{ width: 'auto', minWidth: '200px' }}
                >
                    <option value="">{cities.length === 0 && selectedCountry ? t('mapTab.noCitiesAvailable') : t('mapTab.selectCity')}</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <button onClick={handleReset} className={`${uiStyles.btn} ${uiStyles.btnCancel}`}>
                    <FaSync /> {t('mapTab.reset')}
                </button>
            </div>

            <div style={{ display: 'flex', flex: 1, gap: '20px', overflow: 'hidden' }}>
                 {mapData.length > 0 && (
                     <div style={{ width: '300px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                             <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--text-main)' }}>{t('mapTab.filtersTitle')}</h3>
                             <div style={{ display: 'flex', gap: '8px' }}>
                                 <button onClick={showAll} className={`${uiStyles.btn}`} style={{ flex: 1, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>{t('mapTab.showAll')}</button>
                                 <button onClick={hideAll} className={`${uiStyles.btn} ${uiStyles.btnCancel}`} style={{ flex: 1 }}>{t('mapTab.hideAll')}</button>
                             </div>
                        </div>
                        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {METRIC_GROUPS.map(group => {
                                const countableFields = group.fields.filter(f => f.type === 'number' && f.key.includes('_count'));
                                if (countableFields.length === 0) return null;

                                return (
                                    <div key={group.id}>
                                        <div style={{ fontWeight: '700', marginBottom: '10px', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                                            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                                            cursor: 'pointer', background: isVisible ? 'var(--bg-main)' : 'transparent',
                                                            border: `1px solid ${isVisible ? 'var(--border)' : 'transparent'}`,
                                                            transition: 'var(--transition)', userSelect: 'none'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '0.9rem', fontWeight: isVisible ? 600 : 500, color: isVisible ? 'var(--text-main)' : 'var(--text-muted)' }}>{m.label}</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.1rem', color: isVisible ? 'var(--primary)' : 'var(--border)' }}>
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

                <div style={{ flex: 1, position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    {!selectedCity ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-muted)' }}>
                            <FaMap style={{ fontSize: '3rem', opacity: 0.5 }} />
                            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{t('mapTab.placeholder')}</div>
                        </div>
                    ) : loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--primary)' }}>
                            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59, 130, 246, 0.3)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('mapTab.loading')}</div>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : mapData.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--warning)' }}>
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
                            
                            {mapData.map((dist) => (
                                <GeoJSON 
                                    key={`geo-${dist.id}`}
                                    data={dist.geojson} 
                                    style={{ 
                                        color: '#ffffff', weight: 2, opacity: 1, 
                                        fillColor: dist.fillColor, fillOpacity: 0.35 
                                    }}
                                    onEachFeature={(feature, layer) => {
                                        layer.bindTooltip(`
                                            <div style="text-align:center;">
                                                <strong style="font-size:1.1rem;color:var(--text-main);">${dist.name}</strong><br/>
                                                <span style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;display:block;">
                                                    ${dist.is_available ? t('mapTab.published') : t('mapTab.hidden')}
                                                </span>
                                            </div>
                                        `, { direction: 'top', sticky: true, className: 'modern-tooltip' });
                                    }}
                                />
                            ))}

                            <AdminFastMarkers pois={allVisiblePois} t={t} />
                        </MapContainer>
                    )}
                </div>
            </div>
            <style>{`
                .modern-tooltip { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: none; box-shadow: var(--shadow-md); border-radius: var(--radius-md); padding: 10px 16px; }
                .modern-tooltip::before { display: none; }
                .leaflet-control-container { display: none; }
            `}</style>
        </div>
    );
}