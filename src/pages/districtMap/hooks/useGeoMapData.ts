import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSubscription } from '@subscription/contex/SubscriptionContext';
import { useFiltersConfig } from '@hooks/useFiltersConfig';
import { processPoiNormalization } from '../utils/poiParser';
import { geoApi } from '../api/geoApi';
import type { PoiData, ProcessedGeoData } from '../types/geo';
import type { DynamicDistrictConfig } from '@config/districtFields';

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

export const useGeoMapData = (districtId: string | number | undefined, isOpen: boolean) => {
  const { isFree, isRealtor } = useSubscription();
  const { config } = useFiltersConfig();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const { data: geoData, isLoading } = useQuery<ProcessedGeoData | null>({
    queryKey: ['geoData', districtId, isFree, isRealtor],
    queryFn: async () => {
      if (!districtId) return null;
      const data = await geoApi.getDistrictGeoData(String(districtId));
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
      const allowed = getFilteredPois(normalized, isRealtor, isFree, config);
      const types = [...new Set(allowed.map(p => p.type))].sort((a, b) => a.localeCompare(b));
      setActiveFilters(types);
      return { geojson: data?.geojson, poi_data: allowed };
    },
    enabled: isOpen && !!districtId && !!config,
    staleTime: 10 * 60 * 1000,
  });

  const availableTypes = useMemo(() => {
    return [...new Set(geoData?.poi_data?.map(p => p.type) || [])].sort((a, b) => a.localeCompare(b));
  }, [geoData]);

  const filteredPois = useMemo(() => {
    if (!geoData?.poi_data || activeFilters.length === 0) return [];
    const filterSet = new Set(activeFilters);
    return geoData.poi_data.filter(poi => filterSet.has(poi.type));
  }, [geoData, activeFilters]);

  const toggleFilter = useCallback((type: string) => {
    setActiveFilters(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  }, []);

  const toggleAll = useCallback(() => {
    setActiveFilters(prev => prev.length === availableTypes.length ? [] : availableTypes);
  }, [availableTypes]);

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