import { useEffect, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useTranslation } from 'react-i18next';
import type { PoiData } from '../types/geo';
import type { DynamicDistrictConfig } from '@config/districtFields';

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

  const emojiMap = useMemo(() => {
    const map = new Map<string, string>();
    if (config) {
      Object.values(config).forEach(category => {
        category.fields.forEach(field => {
          if (field.icon) {
            map.set(field.dbKey, field.icon);
          }
        });
      });
    }
    return map;
  }, [config]);

  const getEmojiForType = useCallback((type: string): string => {
    if (!type) return '📍';
    const searchType = type.toLowerCase();
    const exactType = type.replace('_count', '');
    return emojiMap.get(searchType) || emojiMap.get(exactType) || emojiMap.get(type) || '📍';
  }, [emojiMap]);

  const createPoiIcon = useCallback((type: string): L.DivIcon => {
    const emoji = getEmojiForType(type);
    const content = document.createElement('div');
    content.className = 'flex items-center justify-center w-8 h-8 bg-white border-2 border-slate-300 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] text-[16px]';
    content.textContent = emoji;
    return L.divIcon({
      html: content,
      className: 'custom-poi-icon bg-transparent border-none',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      tooltipAnchor: [0, -16]
    });
  }, [getEmojiForType]);

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
      const marker = L.marker(poi.coord, { icon: createPoiIcon(poi.type) });
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
      const tooltip = document.createElement('strong');
      tooltip.textContent = labelText;
      marker.bindTooltip(tooltip, {
        direction: 'top',
        className: 'font-body font-semibold capitalize border-none shadow-md rounded-md px-3 py-1.5 bg-surface text-textMain'
      });
      return marker;
    });

    clusterGroup.addLayers(leafletMarkers);
    map.addLayer(clusterGroup);

    return () => {
      clusterGroup.clearLayers();
      map.removeLayer(clusterGroup);
    };
  }, [pois, map, t, emojiMap, createPoiIcon]);

  return null;
};
