import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSubscription } from '@subscription/context/SubscriptionContext';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { processPoiNormalization } from '../utils/poiParser';
import { geoApi } from '../api/geoApi';
import type { PoiData, ProcessedGeoData } from '../types/geo';
import type { DynamicDistrictConfig } from '@config/districtFields';

const getFilteredPois = (pois: PoiData[], isRealtor: boolean, isFree: boolean, config: DynamicDistrictConfig | null): PoiData[] => {
  if (!config) return [];
  return pois.filter(poi => {
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
    if (!found) return false;
    if (isRealtor) return true;
    return isFree ? (!isPremiumPoi && !isRealtorPoi) : !isRealtorPoi;
  });
};

export const useGeoMapData = (districtId: string | number | undefined, isOpen: boolean) => {
  const { isFree, isRealtor } = useSubscription();
  const { config } = useFiltersConfig();
  const [selection, setSelection] = useState<{ key: string; values: string[] } | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const { data: rawGeoData, isLoading } = useQuery<ProcessedGeoData | null>({
    queryKey: ['geoData', districtId, isFree, isRealtor],
    queryFn: async ({ signal }) => {
      if (!districtId) return null;
      const data = await geoApi.getDistrictGeoData(String(districtId), signal);
      let rawPois = data?.poi_data || [];
      if (typeof rawPois === 'string') {
        try {
          rawPois = JSON.parse(rawPois);
        } catch {
          rawPois = [];
        }
      }
      const normalized = (Array.isArray(rawPois) ? rawPois : [])
        .map(processPoiNormalization)
        .filter((p): p is PoiData => p !== null);
      return { geojson: data?.geojson, poi_data: normalized };
    },
    enabled: isOpen && !!districtId && !!config,
    staleTime: 10 * 60 * 1000,
  });

  const geoData = useMemo(() => rawGeoData ? {
    ...rawGeoData, poi_data: getFilteredPois(rawGeoData.poi_data, isRealtor, isFree, config),
  } : null, [rawGeoData, isRealtor, isFree, config]);

  const availableTypes = useMemo(() => {
    return [...new Set(geoData?.poi_data?.map(p => p.type) || [])].sort((a, b) => a.localeCompare(b));
  }, [geoData]);

  const selectionKey = JSON.stringify([districtId, isFree, isRealtor, availableTypes]);
  const activeFilters = selection?.key === selectionKey ? selection.values : availableTypes;

  const filteredPois = useMemo(() => {
    if (!geoData?.poi_data || activeFilters.length === 0) return [];
    const filterSet = new Set(activeFilters);
    return geoData.poi_data.filter(poi => filterSet.has(poi.type));
  }, [geoData, activeFilters]);

  const toggleFilter = useCallback((type: string) => {
    if (!availableTypes.includes(type)) return;
    setSelection(previous => {
      const values = previous?.key === selectionKey ? previous.values : availableTypes;
      return { key: selectionKey, values: values.includes(type) ? values.filter(t => t !== type) : [...values, type] };
    });
  }, [selectionKey, availableTypes]);

  const toggleAll = useCallback(() => {
    setSelection(previous => {
      const values = previous?.key === selectionKey ? previous.values : availableTypes;
      return { key: selectionKey, values: values.length === availableTypes.length ? [] : availableTypes };
    });
  }, [selectionKey, availableTypes]);

  return {
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
  };
};
