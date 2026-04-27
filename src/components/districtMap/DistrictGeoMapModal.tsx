import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { geoApi } from '@api/geoApi';
import { FiX, FiFilter } from 'react-icons/fi';
import Loader from '@components/loader/Loader';
import { useSubscription } from '@subscription/SubscriptionContext';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { DynamicDistrictConfig } from '@config/districtFields';
import { GeoMapSidebar } from './GeoMapSidebar';

export interface PoiData {
  type: string;
  coord: [number, number];
}

export interface ProcessedGeoData {
  geojson?: any;
  poi_data: PoiData[];
}

export interface DistrictGeoMapModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly districtId?: string | number;
  readonly districtName?: string;
}

export const getEmojiForType = (type: string, config: DynamicDistrictConfig | null): string => {
  if (!config || !type) return '📍';
  
  const searchType = type.endsWith('_count') ? type : `${type}_count`;
  const exactType = type.replace('_count', '');

  for (const category of Object.values(config)) {
    const field = category.fields.find(f => f.dbKey === searchType || f.dbKey === exactType || f.dbKey === type);
    if (field && field.icon) return field.icon;
  }
  return '📍';
};

const ICON_CACHE: Record<string, L.DivIcon> = {};

const getCachedIcon = (type: string, config: DynamicDistrictConfig | null): L.DivIcon => {
  if (!ICON_CACHE[type]) {
    const emoji = getEmojiForType(type, config);
    const htmlString = `
      <div class="flex items-center justify-center w-8 h-8 bg-white border-2 border-slate-300 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] text-[16px]">
        ${emoji}
      </div>
    `;
    ICON_CACHE[type] = L.divIcon({ 
      html: htmlString, 
      className: 'custom-poi-icon bg-transparent border-none', 
      iconSize: [32, 32], 
      iconAnchor: [16, 16], 
      tooltipAnchor: [0, -16] 
    });
  }
  return ICON_CACHE[type];
};

const createCustomClusterIcon = (cluster: any): L.DivIcon => {
  return L.divIcon({
    html: `<div class="bg-accent text-white rounded-full w-10 h-10 flex items-center justify-center font-bold font-sans border-2 border-white shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
            ${cluster.getChildCount()}
          </div>`,
    className: 'custom-marker-cluster bg-transparent border-none',
    iconSize: L.point(40, 40, true),
  });
};

const GEOJSON_STYLE = { color: '#c5a47e', weight: 3, fillColor: '#c5a47e', fillOpacity: 0.15, dashArray: '6, 6' };

const MapUpdater: React.FC<{ geoData: ProcessedGeoData | null }> = ({ geoData }) => {
  const map = useMap();
  useEffect(() => {
    if (!geoData || !map) return;
    let bounds: L.LatLngBounds | null = null;
    try {
      if (geoData.geojson) {
        bounds = L.geoJSON(geoData.geojson).getBounds();
      } else if (geoData.poi_data && geoData.poi_data.length > 0) {
        bounds = L.latLngBounds(geoData.poi_data.map(p => p.coord));
      }
      if (bounds?.isValid()) {
        const timer = setTimeout(() => {
          if ((map as any)._container) {
            map.invalidateSize();
            map.fitBounds(bounds as L.LatLngBounds, { padding: [30, 30], maxZoom: 16 });
          }
        }, 250);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Map boundary error:', e);
    }
  }, [geoData, map]);
  return null;
};

const FastMapMarkers: React.FC<{ pois: PoiData[], t: any, config: DynamicDistrictConfig | null }> = ({ pois, t, config }) => {
  const map = useMap();
  useEffect(() => {
    if (!pois || pois.length === 0) return;
    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true, 
      iconCreateFunction: createCustomClusterIcon,
      maxClusterRadius: 40, 
      showCoverageOnHover: false, 
      disableClusteringAtZoom: 17, 
      spiderfyOnMaxZoom: true
    });

    const leafletMarkers = pois.map(poi => {
      const marker = L.marker(poi.coord, { icon: getCachedIcon(poi.type, config) });
      
      // === ОНОВЛЕНИЙ БЛОК ПЕРЕКЛАДУ ПОЧИНАЄТЬСЯ ТУТ ===
      const baseType = poi.type || 'default';
      const withCount = baseType.endsWith('_count') ? baseType : `${baseType}_count`;
      const withoutCount = baseType.replace('_count', '');
      
      const labelText = t([
        `common.fields.${withCount}`,
        withCount,
        `common.fields.${withoutCount}`,
        withoutCount
      ], { 
        defaultValue: withoutCount 
      });
      // === ОНОВЛЕНИЙ БЛОК ПЕРЕКЛАДУ ЗАКІНЧУЄТЬСЯ ТУТ ===
      
      marker.bindTooltip(`<strong>${labelText}</strong>`, { 
        direction: 'top', 
        className: 'font-body font-semibold capitalize border-none shadow-md rounded-md px-3 py-1.5 bg-surface text-textMain' 
      });
      return marker;
    });

    clusterGroup.addLayers(leafletMarkers);
    map.addLayer(clusterGroup);
    return () => { map.removeLayer(clusterGroup); };
  }, [pois, map, t, config]);
  return null;
};

const parseArrayPoi = (rawPoi: any[]): PoiData | null => {
  const str = rawPoi.find(item => typeof item === 'string');
  const nums = rawPoi.filter(item => typeof item === 'number');
  if (str && nums.length >= 2) {
    const lat = nums[0] > 40 ? nums[0] : nums[1];
    const lon = nums[0] > 40 ? nums[1] : nums[0];
    return { type: str, coord: [lat, lon] };
  }
  return null;
};

const parseObjectPoi = (rawPoi: Record<string, any>): PoiData | null => {
  const type = rawPoi.type || rawPoi.key || rawPoi.dbKey;
  if (rawPoi.coord && Array.isArray(rawPoi.coord)) {
    const lat = rawPoi.coord[0] > 40 ? rawPoi.coord[0] : rawPoi.coord[1];
    const lon = rawPoi.coord[0] > 40 ? rawPoi.coord[1] : rawPoi.coord[0];
    if (type && lat && lon) {
      return { type, coord: [lat, lon] };
    }
  }
  return null;
};

const processPoiNormalization = (rawPoi: any): PoiData | null => {
  if (!rawPoi) return null;
  try {
    if (Array.isArray(rawPoi)) return parseArrayPoi(rawPoi);
    if (typeof rawPoi === 'object') return parseObjectPoi(rawPoi);
  } catch (e) {
    console.warn('POI Normalization Error:', e);
  }
  return null;
};

const getFilteredPois = (pois: PoiData[], isRealtor: boolean, isFree: boolean, config: DynamicDistrictConfig | null): PoiData[] => {
  if (!config) return pois; 
  
  return pois.filter(poi => {
    if (isRealtor) return true;
    let isPremiumPoi = false;
    let isRealtorPoi = false;
    let found = false;

    for (const cat of Object.values(config)) {
      const field = cat.fields.find(f => f.dbKey === poi.type || f.dbKey === `${poi.type}_count`);
      if (field) {
        found = true;
        if (field.isRealtorOnly) isRealtorPoi = true;
        else if (cat.isPremium || field.isPremiumField) isPremiumPoi = true;
        break;
      }
    }

    if (!found) isPremiumPoi = true;
    return isFree ? (!isPremiumPoi && !isRealtorPoi) : !isRealtorPoi;
  });
};

export default function DistrictGeoMapModal({ isOpen, onClose, districtId, districtName }: DistrictGeoMapModalProps) {
  const { t } = useTranslation('db');
  const { isFree, isRealtor } = useSubscription();
  const { config } = useFiltersConfig(); 
  
  const [geoData, setGeoData] = useState<ProcessedGeoData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !districtId) return;
    let isMounted = true;
    setLoading(true);

    const fetchGeo = async () => {
      try {
        const data = await geoApi.getDistrictGeoData(districtId as string);
        if (!isMounted) return;

        let rawPois = data?.poi_data || [];
        if (typeof rawPois === 'string') {
          try { 
            rawPois = JSON.parse(rawPois); 
          } catch (e) { 
            console.warn('Failed to parse POI data string', e);
            rawPois = []; 
          }
        }

        const normalized = (Array.isArray(rawPois) ? rawPois : [])
          .map(processPoiNormalization)
          .filter((p): p is PoiData => p !== null);

        const allowed = getFilteredPois(normalized, isRealtor, isFree, config);
        
        setGeoData({ geojson: data?.geojson, poi_data: allowed });
        const types = [...new Set(allowed.map(p => p.type))].sort((a, b) => a.localeCompare(b));
        setActiveFilters(types); 
      } catch (err) {
        console.warn("Error loading map data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGeo();
    return () => { isMounted = false; };
  }, [isOpen, districtId, isFree, isRealtor, config]);

  const availableTypes = useMemo(() => {
    return [...new Set(geoData?.poi_data?.map(p => p.type) || [])].sort((a, b) => a.localeCompare(b));
  }, [geoData]);

  const filteredPois = useMemo(() => {
    if (!geoData?.poi_data || activeFilters.length === 0) return [];
    return geoData.poi_data.filter(poi => activeFilters.includes(poi.type));
  }, [geoData, activeFilters]);

  const toggleFilter = useCallback((type: string) => {
    setActiveFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  }, []);

  const toggleAll = useCallback(() => {
    setActiveFilters(prev => prev.length === availableTypes.length ? [] : availableTypes);
  }, [availableTypes]);

  if (!isOpen) return null;

  let mapContent;
  if (loading) {
    mapContent = (
      <div className="w-full h-full flex items-center justify-center bg-surface">
        <Loader />
      </div>
    );
  } else if (availableTypes.length === 0 && !geoData?.geojson) {
    mapContent = (
      <div className="w-full h-full flex items-center justify-center bg-surface font-heading text-textSecondary text-xl">
        {t('district.status.no_data')}
      </div>
    );
  } else {
    mapContent = (
      <>
        <GeoMapSidebar 
          availableTypes={availableTypes}
          activeFilters={activeFilters}
          geoData={geoData}
          isMobileFilterOpen={isMobileFilterOpen}
          setIsMobileFilterOpen={setIsMobileFilterOpen}
          toggleAll={toggleAll}
          toggleFilter={toggleFilter}
          getEmojiForType={(type) => getEmojiForType(type, config)}
          t={t}
        />

        <div className="flex-1 relative h-full">
          {availableTypes.length > 0 && (
            <button className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-fixed)] bg-surface text-textMain border border-borderClient py-3 px-6 rounded-full font-heading font-bold text-[0.95rem] flex items-center justify-center gap-2.5 shadow-hover cursor-pointer" onClick={() => setIsMobileFilterOpen(true)}>
              <FiFilter size={20} /><span>{t('district.map.filters')}</span>
            </button>
          )}
          <MapContainer center={[52, 19]} zoom={6} className="w-full h-full z-[var(--z-base)]" zoomControl={true} maxZoom={18}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; Carto' />
            <MapUpdater geoData={geoData} />
            {geoData?.geojson && <GeoJSON data={geoData.geojson} style={GEOJSON_STYLE} />}
            <FastMapMarkers pois={filteredPois} t={t} config={config} />
          </MapContainer>
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0f1014d9] backdrop-blur-[8px] z-[var(--z-modal-overlay)] flex items-center justify-center md:p-6 animate-fadeIn">
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-transparent border-none appearance-none cursor-default z-0"
        onClick={onClose}
        aria-label={t('district.actions.close')}
        tabIndex={-1}
      />
      <dialog 
        open
        className="relative z-10 bg-surface w-full max-w-[1400px] h-[100dvh] md:h-[90vh] md:rounded-[var(--radius-md)] flex flex-col overflow-hidden shadow-modal animate-slideUp border-none p-0 m-0" 
        onClick={e => e.stopPropagation()}
        aria-labelledby="geo-modal-title"
      >
        <div className="flex justify-between items-center py-5 px-6 bg-body border-b border-borderClient shrink-0">
          <h3 id="geo-modal-title" className="m-0 font-heading text-xl md:text-2xl text-textMain font-bold tracking-wide">
            {districtName}
          </h3>
          <button 
            className="bg-black/5 hover:bg-danger/10 border-none text-textSecondary hover:text-danger w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105" 
            onClick={onClose}
            aria-label={t('district.actions.close')}
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="flex-1 flex flex-row relative overflow-hidden bg-body">
          {mapContent}
        </div>
      </dialog>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-accent); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent-color); }
      `}</style>
    </div>
  );
}