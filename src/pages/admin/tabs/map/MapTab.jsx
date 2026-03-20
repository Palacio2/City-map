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
        html: `<div style="background-color: var(--primary, #3b82f6); color: white; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-family: var(--font-body); font-size: 1rem; border: 3px solid white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                ${cluster.getChildCount()}
              </div>`,
        className: 'custom-marker-cluster',
        iconSize: L.point(44, 44, true),
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
                <div style="text-align: center; display: flex; flex-direction: column; gap: 4px;">
                    <strong style="font-size: 1rem; color: var(--text-main); font-weight: 800;">${labelText}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: var(--bg-hover); padding: 2px 6px; border-radius: var(--radius-sm);">
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
        // ВАЖЛИВО: height: calc(100vh - 140px) та minHeight: '600px'
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: '600px', gap: '24px', padding: '0' }}>
             
             <div style={{ 
                 display: 'flex', gap: '20px', background: 'var(--bg-surface)', padding: '24px', 
                 borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', flexWrap: 'wrap', 
                 alignItems: 'center', boxShadow: 'var(--shadow-sm)', flexShrink: 0 // Не даємо шапці стискатися
             }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: 'auto' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--primary)' }}>
                        <FaMap />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: '800', letterSpacing: '-0.01em' }}>{t('mapTab.title')}</h2>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>{t('mapTab.subtitle')}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select 
                        value={selectedCountry} 
                        onChange={e => { setSelectedCountry(e.target.value); setSelectedCity(''); }} 
                        className={uiStyles.input}
                        style={{ width: 'auto', minWidth: '220px' }}
                    >
                        <option value="">{t('mapTab.selectCountry')}</option>
                        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <select 
                        value={selectedCity} 
                        onChange={e => setSelectedCity(e.target.value)} 
                        disabled={!selectedCountry || cities.length === 0} 
                        className={uiStyles.input}
                        style={{ width: 'auto', minWidth: '220px' }}
                    >
                        <option value="">{cities.length === 0 && selectedCountry ? t('mapTab.noCitiesAvailable') : t('mapTab.selectCity')}</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <button onClick={handleReset} className={`${uiStyles.btn} ${uiStyles.btnCancel}`}>
                        <FaSync /> {t('mapTab.reset')}
                    </button>
                </div>
            </div>

            {/* ВАЖЛИВО: minHeight: 0 не дає дітям розпирати цей контейнер */}
            <div style={{ display: 'flex', flex: 1, gap: '24px', overflow: 'hidden', minHeight: 0 }}>
                 {mapData.length > 0 && (
                     <div style={{ width: '340px', height: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', flexShrink: 0 }}>
                             <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '800' }}>{t('mapTab.filtersTitle')}</h3>
                             <div style={{ display: 'flex', gap: '10px' }}>
                                 <button onClick={showAll} className={`${uiStyles.btn}`} style={{ flex: 1, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', fontWeight: '700' }}>{t('mapTab.showAll')}</button>
                                 <button onClick={hideAll} className={`${uiStyles.btn} ${uiStyles.btnCancel}`} style={{ flex: 1 }}>{t('mapTab.hideAll')}</button>
                             </div>
                        </div>
                        {/* Скролл тільки для списку фільтрів */}
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {METRIC_GROUPS.map(group => {
                                const countableFields = group.fields.filter(f => f.type === 'number' && f.key.includes('_count'));
                                if (countableFields.length === 0) return null;

                                return (
                                    <div key={group.id}>
                                        <div style={{ fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>{group.icon}</span> {group.label}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {countableFields.map(m => {
                                                const isVisible = visibleTypes.has(m.key);
                                                return (
                                                    <div 
                                                        key={m.key} 
                                                        onClick={() => toggleVisibility(m.key)}
                                                        style={{ 
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                            padding: '10px 16px', borderRadius: 'var(--radius-sm)',
                                                            cursor: 'pointer', background: isVisible ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-main)',
                                                            border: `2px solid ${isVisible ? 'var(--primary)' : 'var(--border)'}`,
                                                            transition: 'var(--transition)', userSelect: 'none'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '0.95rem', fontWeight: isVisible ? 700 : 500, color: isVisible ? 'var(--text-main)' : 'var(--text-muted)' }}>{m.label}</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.1rem', color: isVisible ? 'var(--primary)' : 'var(--text-muted)', opacity: isVisible ? 1 : 0.5 }}>
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

                {/* Карта займає 100% висоти свого батька */}
                <div style={{ flex: 1, position: 'relative', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    {!selectedCity ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', color: 'var(--text-muted)' }}>
                            <div style={{ width: '80px', height: '80px', background: 'var(--bg-surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                                <FaMap style={{ fontSize: '2.5rem', opacity: 0.6 }} />
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{t('mapTab.placeholder')}</div>
                        </div>
                    ) : loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', color: 'var(--primary)' }}>
                            <div style={{ width: '48px', height: '48px', border: '4px solid rgba(59, 130, 246, 0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }}></div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('mapTab.loading')}</div>
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : mapData.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--warning)', background: 'rgba(234, 179, 8, 0.1)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                            <div style={{ fontSize: '2.5rem' }}>⚠️</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('mapTab.noData')}</div>
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
                                        fillColor: dist.fillColor, fillOpacity: 0.4 
                                    }}
                                    onEachFeature={(feature, layer) => {
                                        layer.bindTooltip(`
                                            <div style="text-align:center; display: flex; flex-direction: column; gap: 6px;">
                                                <strong style="font-size:1.15rem; color:var(--text-main); font-weight: 800; letter-spacing: -0.01em;">${dist.name}</strong>
                                                <span style="font-size:0.85rem; font-weight: 700; color: ${dist.is_available ? 'var(--success)' : 'var(--text-muted)'}; background: ${dist.is_available ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-main)'}; padding: 4px 8px; border-radius: var(--radius-sm); border: 1px solid ${dist.is_available ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)'};">
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
                .modern-tooltip { 
                    background: rgba(255,255,255,0.95); 
                    backdrop-filter: blur(8px); 
                    border: 1px solid var(--border); 
                    box-shadow: var(--shadow-lg); 
                    border-radius: var(--radius-md); 
                    padding: 12px 16px; 
                }
                .modern-tooltip::before { border-top-color: rgba(255,255,255,0.95); }
                .leaflet-control-container { display: none; }
                
                /* Кастомізація скролбару для списку фільтрів */
                div[style*="overflow-y: auto"]::-webkit-scrollbar {
                    width: 6px;
                }
                div[style*="overflow-y: auto"]::-webkit-scrollbar-track {
                    background: transparent;
                }
                div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 10px;
                }
                div[style*="overflow-y: auto"]::-webkit-scrollbar-thumb:hover {
                    background: var(--text-muted);
                }
            `}</style>
        </div>
    );
}