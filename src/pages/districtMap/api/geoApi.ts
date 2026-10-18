import { supabase } from '@supabaseClient';
import type { ProcessedGeoData } from '../types/geo';

export const geoApi = {
  async getDistrictGeoData(districtId: string | number, signal?: AbortSignal): Promise<ProcessedGeoData> {
    const { data, error } = await supabase.functions.invoke('get-district-geo', {
      body: { districtId: String(districtId) }, signal,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data || { geojson: null, poi_data: [] };
  }
};
