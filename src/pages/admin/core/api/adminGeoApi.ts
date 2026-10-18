import { GeoEntity } from '@admin/core/types/geo.types';
import { invokeAdminApi } from './adminApiClient';

export { invokeAdminApi };

export const adminGeoApi = {
    getCountries: () => invokeAdminApi<GeoEntity[]>('admin-geo-list', { action: 'get_countries' }),
    getCities: (countryId: string) => invokeAdminApi<GeoEntity[]>('admin-geo-list', { action: 'get_cities', countryId }),
    getDistricts: (cityId: string) => invokeAdminApi<GeoEntity[]>('admin-geo-list', { action: 'get_districts', cityId }),
    createDistricts: (cityId: string, names: string[]) => invokeAdminApi('admin-geo-manage', { action: 'create_districts', payload: { cityId, names } }),
    deleteDistrict: (districtId: string) => invokeAdminApi('admin-geo-manage', { action: 'delete_district', payload: { districtId } }),
    importGeoJson: (cityId: string, features: Record<string, unknown>[]) => invokeAdminApi<{ count: number }>('admin-geo-manage', { action: 'import_geojson', payload: { cityId, features } }),
    getCitiesList: (mapMode: boolean = false) => invokeAdminApi<{cities: { id: string; name: string; countryName?: string }[]}>('admin-cities-list', { mapMode }),
    getMapData: (cityId: string) => invokeAdminApi('admin-map-data', { cityId }),
    manageDistrict: (body: Record<string, unknown>) => invokeAdminApi('admin-district-manage', body),
    createCountry: (name: string) => invokeAdminApi<GeoEntity>('admin-geo-manage', { action: 'create_country', payload: { name } }),
    createCity: (name: string, countryId: string) => invokeAdminApi<GeoEntity>('admin-geo-manage', { action: 'create_city', payload: { name, countryId } }),
    createDistrict: (name: string, cityId: string) => invokeAdminApi<GeoEntity>('admin-geo-manage', { action: 'create_district', payload: { name, cityId } }),
    deleteCountry: (id: string) => invokeAdminApi('admin-geo-manage', { action: 'delete_country', payload: { id } }),
    deleteCity: (id: string) => invokeAdminApi('admin-geo-manage', { action: 'delete_city', payload: { id } }),
    getDistrictData: (districtId: string) => invokeAdminApi<Record<string, unknown>>('admin-district-manage', { action: 'get', districtId }),
    updateDistrictStatus: (id: string, is_available: boolean) => invokeAdminApi('admin-district-manage', { action: 'save', districtId: id, payload: { is_available } }),
    getDistrictPhoto: (districtId: string) => invokeAdminApi<string | null>('admin-district-manage', { action: 'get_photo', districtId }),
    saveDistrictPhoto: (districtId: string, photoUrl: string) => invokeAdminApi('admin-district-manage', { action: 'save', districtId, payload: { photo_url: photoUrl } })
};