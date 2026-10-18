import type { PoiData } from '../types/geo';

const parseArrayPoi = (rawPoi: unknown[]): PoiData | null => {
  const str = rawPoi.find((item): item is string => typeof item === 'string');
  const nums = rawPoi.filter((item): item is number => typeof item === 'number');
  
  if (str && nums.length >= 2) {
    const lat = nums[0];
    const lon = nums[1];
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return { type: str, coord: [lat, lon] };
  }
  return null;
};

const parseObjectPoi = (rawPoi: Record<string, unknown>): PoiData | null => {
  const type = String(rawPoi.type || rawPoi.key || rawPoi.dbKey || '');
  const coord = rawPoi.coord;

  if (Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
    const lat = coord[0];
    const lon = coord[1];
    if (type && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { type, coord: [lat, lon] };
    }
  }
  return null;
};

export const processPoiNormalization = (rawPoi: unknown): PoiData | null => {
  if (!rawPoi) return null;
  
  if (Array.isArray(rawPoi)) {
    return parseArrayPoi(rawPoi);
  }
  
  if (typeof rawPoi === 'object') {
    return parseObjectPoi(rawPoi as Record<string, unknown>);
  }
  
  return null;
};
