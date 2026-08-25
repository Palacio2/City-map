// src/pages/admin/core/api/adminGeoApi.ts
import { supabase } from '@supabaseClient';

export async function invokeAdminApi<T = unknown>(
    endpoint: string,
    body: Record<string, unknown>
): Promise<T> {
    const { data, error } = await supabase.functions.invoke(endpoint, { body });
    if (error || data?.error) throw new Error(error?.message || data?.error);
    return (data?.data !== undefined ? data.data : data) as T;
}

export const adminGeoApi = {
    getCountries: () => invokeAdminApi<unknown[]>('admin-geo-list', { action: 'get_countries' }),
    getCities: (countryId: string) => invokeAdminApi<unknown[]>('admin-geo-list', { action: 'get_cities', countryId }),
    getDistricts: (cityId: string) => invokeAdminApi<unknown[]>('admin-geo-list', { action: 'get_districts', cityId }),
    createDistricts: (cityId: string, names: string[]) => invokeAdminApi('admin-geo-manage', { action: 'create_districts', payload: { cityId, names } }),
    deleteDistrict: (districtId: string) => invokeAdminApi('admin-geo-manage', { action: 'delete_district', payload: { districtId } }),
    importGeoJson: (cityId: string, features: Record<string, unknown>[]) => invokeAdminApi('admin-geo-manage', { action: 'import_geojson', payload: { cityId, features } }),
    getCitiesList: (mapMode: boolean = false) => invokeAdminApi<{cities: { id: string; name: string; countryName?: string }[]}>('admin-cities-list', { mapMode }),
    getMapData: (cityId: string) => invokeAdminApi('admin-map-data', { cityId }),
    manageDistrict: (body: Record<string, unknown>) => invokeAdminApi('admin-district-manage', body),
};