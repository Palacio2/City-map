import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useTranslation } from 'react-i18next';
import type { PoiData } from '../types/geo';
import type { DynamicDistrictConfig } from '@config/districtFields';

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

const createPoiIcon = (type: string, config: DynamicDistrictConfig | null): L.DivIcon => {
  const emoji = getEmojiForType(type, config);
  const htmlString = `
    <div class="flex items-center justify-center w-8 h-8 bg-white border-2 border-slate-300 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] text-[16px]">
      ${emoji}
    </div>
  `;
  return L.divIcon({
    html: htmlString,
    className: 'custom-poi-icon bg-transparent border-none',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    tooltipAnchor: [0, -16]
  });
};

const createCustomClusterIcon = (cluster: L.MarkerCluster): L.DivIcon => {
  return L.divIcon({
    html: `<div class="bg-accent text-white rounded-full w-10 h-10 flex items-center justify-center font-bold font-sans border-2 border-white shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
            ${cluster.getChildCount()}
          </div>`,
    className: 'custom-marker-cluster bg-transparent border-none',
    iconSize: L.point(40, 40, true),
  });
};

interface MapMarkersProps {
  readonly pois: PoiData[];
  readonly config: DynamicDistrictConfig | null;
}

export const MapMarkers = ({ pois, config }: MapMarkersProps) => {
  const map = useMap();
  const { t } = useTranslation('db');

  useEffect(() => {
    if (!pois || pois.length === 0) return;

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      iconCreateFunction: createCustomClusterIcon,
      maxClusterRadius: 80, // Increased radius to group more markers and reduce DOM nodes
      showCoverageOnHover: false,
      disableClusteringAtZoom: 18, // Don't disable clustering too early
      spiderfyOnMaxZoom: true
    });

    const leafletMarkers = pois.map(poi => {
      const marker = L.marker(poi.coord, { icon: createPoiIcon(poi.type, config) });
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
      marker.bindTooltip(`<strong>${labelText}</strong>`, {
        direction: 'top',
        className: 'font-body font-semibold capitalize border-none shadow-md rounded-md px-3 py-1.5 bg-surface text-textMain'
      });
      return marker;
    });

    clusterGroup.addLayers(leafletMarkers);
    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [pois, map, t, config]);

  return null;
};