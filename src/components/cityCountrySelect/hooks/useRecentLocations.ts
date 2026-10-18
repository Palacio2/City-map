import { useCallback } from 'react';
import type { RecentLocationItem } from '../types';
import { useStorageState } from '@/shared/hooks/useStorageState';

const STORAGE_KEY = 'geo_analyzer_recent_locations';
const MAX_RECENT_ITEMS = 4;

export function useRecentLocations() {
  const [recentLocations, setRecentLocations] = useStorageState<RecentLocationItem[]>(STORAGE_KEY, [], 'localStorage');

  const addRecentLocation = useCallback((country: string, city: string) => {
    if (!country || !city) return;

    setRecentLocations((prev) => {
      const filtered = prev.filter(
        (item) => !(item.country.toLowerCase() === country.toLowerCase() && item.city.toLowerCase() === city.toLowerCase())
      );

      const newItem: RecentLocationItem = {
        id: `${country}_${city}_${Date.now()}`,
        country,
        city,
        timestamp: Date.now(),
      };

      return [newItem, ...filtered].slice(0, MAX_RECENT_ITEMS);
    });
  }, [setRecentLocations]);

  const removeRecentLocation = useCallback((id: string) => {
    setRecentLocations((prev) => prev.filter((item) => item.id !== id));
  }, [setRecentLocations]);

  const clearRecentLocations = useCallback(() => {
    setRecentLocations([]);
  }, [setRecentLocations]);

  return {
    recentLocations,
    addRecentLocation,
    removeRecentLocation,
    clearRecentLocations,
  };
}
