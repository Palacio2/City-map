import { supabase } from "../utils/supabase.js";

export const generateDashboardStats = async () => {
    const { count: countriesCount } = await supabase.from('countries').select('*', { count: 'exact', head: true });
    const { count: citiesCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
    
    const { data: districts, error: distErr } = await supabase.from('districts').select(`
        id, name, is_available, cities(name),
        district_filter_data (last_updated)
    `);
    if (distErr) throw distErr;

    const { data: photos } = await supabase.from('district_photos').select('district_id');
    const { data: geos } = await supabase.from('district_geo_data').select('district_id, geojson');

    const photoSet = new Set((photos || []).map(p => p.district_id));
    const geoSet = new Set((geos || []).filter(g => g.geojson).map(g => g.district_id));

    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const problematicDistricts = [];
    const outdatedDistricts = [];

    districts.forEach(d => {
        const isMissingPhoto = !photoSet.has(d.id);
        const isMissingGeo = !geoSet.has(d.id);
        const lastUpdatedStr = d.district_filter_data?.length > 0 ? d.district_filter_data[0].last_updated : null;
        
        const baseDistrict = {
            id: d.id,
            name: d.name,
            cityName: d.cities?.name || 'Невідомо',
            isAvailable: d.is_available,
            lastUpdated: lastUpdatedStr
        };

        if (isMissingPhoto || isMissingGeo) {
            problematicDistricts.push({
                ...baseDistrict,
                missingPhoto: isMissingPhoto,
                missingGeo: isMissingGeo
            });
        }

        if (d.is_available) {
            if (!lastUpdatedStr || new Date(lastUpdatedStr) < sixMonthsAgo) {
                outdatedDistricts.push(baseDistrict);
            }
        }
    });

    return {
        totalCountries: countriesCount || 0,
        totalCities: citiesCount || 0,
        totalDistricts: districts.length || 0,
        publishedDistricts: districts.filter(d => d.is_available).length,
        problematicDistricts,
        outdatedDistricts
    };
};