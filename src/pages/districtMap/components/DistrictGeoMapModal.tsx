import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { FiX, FiFilter } from 'react-icons/fi';
import Loader from '@components/loader/Loader';
import { useGeoMapData } from '../hooks/useGeoMapData';
import { GeoMapSidebar } from './GeoMapSidebar';
import { MapMarkers } from './MapMarkers';
import type { ProcessedGeoData, DistrictGeoMapModalProps } from '../types/geo';
import type { DynamicDistrictConfig } from '@config/districtFields';

const GEOJSON_STYLE = { color: '#c5a47e', weight: 3, fillColor: '#c5a47e', fillOpacity: 0.15, dashArray: '6, 6' };

const getEmojiForType = (type: string, config: DynamicDistrictConfig | null): string => {
  if (!config || !type) return '📍';
  const searchType = type.endsWith('_count') ? type : `${type}_count`;
  const exactType = type.replace('_count', '');
  for (const category of Object.values(config)) {
    const field = category.fields.find(f => f.dbKey === searchType || f.dbKey === exactType || f.dbKey === type);
    if (field && field.icon) return field.icon;
  }
  return '📍';
};

const MapUpdater = ({ geoData }: { readonly geoData: ProcessedGeoData | null }) => {
  const map = useMap();
  useEffect(() => {
    if (!geoData || !map) return;
    let bounds: L.LatLngBounds | null = null;
    if (geoData.geojson) {
      bounds = L.geoJSON(geoData.geojson as GeoJsonObject).getBounds();
    } else if (geoData.poi_data && geoData.poi_data.length > 0) {
      bounds = L.latLngBounds(geoData.poi_data.map(p => p.coord));
    }
    if (bounds?.isValid()) {
      const timer = setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds as L.LatLngBounds, { padding: [30, 30], maxZoom: 16 });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [geoData, map]);
  return null;
};

export default function DistrictGeoMapModal({ isOpen, onClose, districtId, districtName }: DistrictGeoMapModalProps) {
  const { t } = useTranslation('db');
  const {
    geoData,
    isLoading,
    availableTypes,
    filteredPois,
    activeFilters,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    toggleFilter,
    toggleAll,
    config
  } = useGeoMapData(districtId, isOpen);

  if (!isOpen) return null;
  const safeGeoData = geoData ?? null;

  let mapContent;
  if (isLoading) {
    mapContent = (
      <div className="w-full h-full flex items-center justify-center bg-surface">
        <Loader />
      </div>
    );
  } else if (availableTypes.length === 0 && !safeGeoData?.geojson) {
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
          geoData={safeGeoData}
          isMobileFilterOpen={isMobileFilterOpen}
          setIsMobileFilterOpen={setIsMobileFilterOpen}
          toggleAll={toggleAll}
          toggleFilter={toggleFilter}
          getEmojiForType={(type) => getEmojiForType(type, config)}
        />
        <div className="flex-1 relative h-full">
          {availableTypes.length > 0 && (
            <button
              type="button"
              className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-surface text-textMain border border-borderClient py-3 px-6 rounded-full font-heading font-bold text-[0.95rem] flex items-center justify-center gap-2.5 shadow-hover cursor-pointer"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              <FiFilter size={20} /><span>{t('district.map.filters')}</span>
            </button>
          )}
          <MapContainer center={[52, 19]} zoom={6} className="w-full h-full z-0" zoomControl={true} maxZoom={18}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MapUpdater geoData={safeGeoData} />
            {Boolean(safeGeoData?.geojson) && <GeoJSON data={safeGeoData!.geojson as GeoJsonObject} style={GEOJSON_STYLE} />}
            <MapMarkers pois={filteredPois} config={config} />
          </MapContainer>
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-[8px] z-[3000] flex items-center justify-center md:p-6 animate-fadeIn">
      <button
        type="button"
        className="absolute inset-0 w-full h-full bg-transparent border-none appearance-none cursor-default z-0"
        onClick={onClose}
        aria-label={t('district.actions.close')}
        tabIndex={-1}
      />
      <dialog
        open
        className="relative z-10 bg-surface w-full max-w-[1400px] h-[100dvh] md:h-[90vh] md:rounded-xl flex flex-col overflow-hidden shadow-modal animate-slideUp border-none p-0 m-0"
        onClick={e => e.stopPropagation()}
        aria-labelledby="geo-modal-title"
      >
        <div className="flex justify-between items-center py-5 px-6 bg-body border-b border-borderClient shrink-0">
          <h3 id="geo-modal-title" className="m-0 font-heading text-xl md:text-2xl text-textMain font-bold tracking-wide">
            {districtName}
          </h3>
          <button
            type="button"
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
    </div>
  );
}