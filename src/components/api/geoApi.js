import { supabase } from '@supabaseClient';

export const geoApi = {
  async getDistrictGeoData(districtId) {
    try {
      const { data, error } = await supabase
        .from('district_geo_data')
        .select('geojson, poi_data')
        .eq('district_id', districtId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }
      
      return data || { geojson: null, poi_data: [] };
    } catch (err) {
      console.error("Geo API Error:", err.message);
      throw new Error("Не вдалося завантажити геодані району");
    }
  }
};