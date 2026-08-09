// @ts-nocheck
import { supabase } from '@supabaseClient';
import type { ProcessedGeoData } from '../types/geo';

export const geoApi = {
  async getDistrictGeoData(districtId: string | number): Promise<ProcessedGeoData> {
    const { data, error } = await supabase
      .from('district_geo_data')
      .select('geojson, poi_data')
      .eq('district_id', String(districtId))
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data || { geojson: null, poi_data: [] };
  }
};
