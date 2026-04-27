import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster'; // 👈 ОСЬ ЦЕЙ РЯДОК БУВ ПРОПУЩЕНИЙ!
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@supabaseClient';
import { useDynamicFields } from '../../hooks/useDynamicFields';
import { useModals } from '../../ui/ModalContext'; 
import { FaLayerGroup, FaCity, FaGlobe, FaMapMarkedAlt, FaSyncAlt } from 'react-icons/fa';
import { normalizePoiData, assignColorsToFeatures, MapFitBounds, createEmojiIcon } from '../../utils/mapHelpers';
import { useTranslation } from 'react-i18next';

export default function MapTab() {
    const { t } = useTranslation('db');
    const { metricGroups, fieldsConfig } = useDynamicFields();
    const { showAlert } = useModals(); 
    
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [mapData, setMapData] = useState([]);
    const [loadingMap, setLoadingMap] = useState(false);
    const [activeLayer, setActiveLayer] = useState('polygons'); 

    const getLabelForKey = useCallback((key) => {
        return fieldsConfig?.find(f => f.key === key || f.key === `${key}_count`)?.label || key;
    }, [fieldsConfig]);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const { data: cData } = await supabase.functions.invoke('admin-cities-list', { body: {} });
                if (cData?.cities) {
                    const uniqueCountries = [...new Set(cData.cities.map(c => c.countryName).filter(Boolean))];
                    setCountries(uniqueCountries);
                    setCities(cData.cities);
                }
            } catch (err) { console.error(err); }
        };
        fetchInitial();
    }, []);

    const fetchMapData = async () => {
        if (!selectedCity) return;
        setLoadingMap(true);
        try {
            const { data: res, error } = await supabase.functions.invoke('admin-map-data', { body: { cityId: selectedCity } });
            if (error || res?.error) throw new Error(res?.error || error.message);
            
            const validData = (res?.data || []).map(d => {
                if (!d.geojson) return null;
                try {
                    const geo = typeof d.geojson === 'string' ? JSON.parse(d.geojson) : d.geojson;
                    if (!geo.bbox) geo.bbox = turf.bbox(geo);
                    return {
                        ...d,
                        geojson: geo,
                        poi_data: normalizePoiData(d.poi_data)
                    };
                } catch (e) { return null; }
            }).filter(Boolean);

            setMapData(assignColorsToFeatures(validData));
        } catch (err) {
            showAlert(t('common.error'), err.message, 'error');
        } finally {
            setLoadingMap(false);
        }
    };

    useEffect(() => { fetchMapData(); }, [selectedCity]);

    const renderMarkers = useMemo(() => {
        if (activeLayer !== 'markers' && activeLayer !== 'all') return null;
        const markers = mapData.flatMap(dist => dist.poi_data.map((poi, idx) => {
            if (!poi || poi.length < 3) return null;
            return (
                <Marker key={`${dist.id}-${idx}`} position={[poi[0], poi[1]]} icon={createEmojiIcon(poi[2], poi[3], fieldsConfig)}>
                    <Tooltip direction="top" className="modern-tooltip">
                        <div className="text-center font-bold">
                            {getLabelForKey(poi[2])} <span className="text-textMuted font-medium ml-1">({dist.name})</span>
                        </div>
                    </Tooltip>
                </Marker>
            );
        }).filter(Boolean));

        // 🚀 КЛАСТЕРИ ДЛЯ ГОЛОВНОЇ КАРТИ
        return (
            <MarkerClusterGroup chunkedLoading={true} maxClusterRadius={50} showCoverageOnHover={false}>
                {markers}
            </MarkerClusterGroup>
        );
    }, [mapData, activeLayer, fieldsConfig, getLabelForKey]);

    const filteredCities = useMemo(() => {
        if (!selectedCountry) return cities;
        return cities.filter(c => c.countryName === selectedCountry);
    }, [cities, selectedCountry]);

    return (
        <div className="flex flex-col w-full h-[calc(100vh-120px)] animate-[fadeIn_0.3s_ease-out] relative rounded-2xl overflow-hidden shadow-sm border border-border">
            <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap gap-3 items-center justify-between bg-surface/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-border">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-main rounded-lg px-2 py-1.5 border border-border/50 w-full sm:w-auto">
                        <FaGlobe className="text-primary ml-2" />
                        <select 
                            className="bg-transparent border-none text-[0.85rem] font-bold text-textMain outline-none cursor-pointer pr-2 w-full sm:w-[150px]"
                            value={selectedCountry} onChange={e => { setSelectedCountry(e.target.value); setSelectedCity(''); }}
                        >
                            <option value="">{t('admin_map.tab.country')}</option>
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-main rounded-lg px-2 py-1.5 border border-border/50 w-full sm:w-auto">
                        <FaCity className="text-primary ml-2" />
                        <select 
                            className="bg-transparent border-none text-[0.85rem] font-bold text-textMain outline-none cursor-pointer pr-2 w-full sm:w-[180px]"
                            value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedCountry}
                        >
                            <option value="">{t('admin_map.tab.city')}</option>
                            {filteredCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                    <div className="flex bg-main rounded-lg p-1 border border-border/50">
                        {['polygons', 'markers', 'all'].map(layer => (
                            <button
                                key={layer}
                                onClick={() => setActiveLayer(layer)}
                                className={`px-4 py-1.5 rounded-md text-[0.8rem] font-bold transition-all ${activeLayer === layer ? 'bg-surface shadow-sm text-primary' : 'text-textMuted hover:text-textMain'}`}
                            >
                                {layer === 'polygons' && t('admin_map.tab.layer_polygons')}
                                {layer === 'markers' && t('admin_map.tab.layer_markers')}
                                {layer === 'all' && t('admin_map.tab.layer_all')}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={fetchMapData} 
                        disabled={!selectedCity || loadingMap}
                        className="bg-surface border border-border text-textMuted w-9 h-9 rounded-lg flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm disabled:opacity-50"
                        title={t('admin_map.tab.refresh')}
                    >
                        <FaSyncAlt className={loadingMap ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="w-full h-full bg-main/30 relative">
                <MapContainer center={[52.23, 21.01]} zoom={6} className="w-full h-full z-10" zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    {(activeLayer === 'polygons' || activeLayer === 'all') && mapData.map(dist => (
                        <GeoJSON key={dist.id} data={dist.geojson} style={{ color: dist.fillColor, weight: 2, fillOpacity: 0.15, fillColor: dist.fillColor }}>
                            <Tooltip direction="top" sticky className="modern-tooltip">
                                <strong className="text-[1.1rem] text-textMain font-extrabold tracking-tight block px-2 py-1">{dist.name}</strong>
                            </Tooltip>
                        </GeoJSON>
                    ))}
                    {renderMarkers}
                    <MapFitBounds mapData={mapData} />
                </MapContainer>

                {!selectedCity && !loadingMap && (
                    <div className="absolute inset-0 z-[400] flex items-center justify-center bg-surface/40 backdrop-blur-[4px]">
                        <div className="flex flex-col items-center gap-4 text-center p-8 border border-border rounded-3xl bg-surface/95 shadow-2xl max-w-[450px]">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center shadow-inner border border-blue-500/20">
                                <FaMapMarkedAlt className="text-[3rem] text-primary" />
                            </div>
                            <h3 className="text-[1.6rem] font-extrabold text-textMain m-0 tracking-tight">{t('admin_map.tab.empty_title')}</h3>
                            <p className="text-[0.95rem] leading-relaxed m-0 text-textMuted font-medium px-4">
                                {t('admin_map.tab.empty_desc')}
                            </p>
                        </div>
                    </div>
                )}
                
                {loadingMap && (
                    <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-surface/50 backdrop-blur-sm">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-primary rounded-full animate-spin mb-4 shadow-lg"></div>
                        <span className="font-extrabold text-[1.2rem] text-textMain tracking-tight bg-surface px-6 py-2 rounded-full border border-border shadow-sm">
                            {t('admin_map.tab.loading')}
                        </span>
                    </div>
                )}
            </div>
            <style>{`.modern-tooltip { background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: 1px solid var(--border); box-shadow: var(--shadow-sm); border-radius: 8px; padding: 6px; color: var(--text-main); }`}</style>
        </div>
    );
}