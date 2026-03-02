import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const getCountries = async (req, res) => {
    try {
        const { data, error } = await supabase.from('countries').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getCities = async (req, res) => {
    try {
        const { data, error } = await supabase.from('cities').select('*').eq('country_id', req.params.countryId).order('name');
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDistricts = async (req, res) => {
    try {
        const { data, error } = await supabase.from('districts').select('*').eq('city_id', req.params.cityId).order('name');
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getCityMapData = async (req, res) => {
    try {
        const { data: dists, error: dErr } = await supabase.from('districts').select('id, name, is_available').eq('city_id', req.params.cityId);
        if (dErr) throw dErr;
        if (!dists || dists.length === 0) return res.json([]);

        const distIds = dists.map(d => d.id);
        const { data: geo, error: gErr } = await supabase.from('district_geo_data').select('district_id, geojson').in('district_id', distIds);
        if (gErr) throw gErr;

        const result = dists.map(d => ({
            ...d,
            geojson: geo?.find(g => g.district_id === d.id)?.geojson || null
        }));
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDistrictData = async (req, res) => {
    try {
        const { districtId } = req.params;
        const { data: filterData, error: filterErr } = await supabase.from('district_filter_data').select('*').eq('district_id', districtId).maybeSingle();
        if (filterErr) throw filterErr;
        
        const { data: geoData, error: geoErr } = await supabase.from('district_geo_data').select('*').eq('district_id', districtId).maybeSingle();
        if (geoErr) throw geoErr;

        res.json({
            district_id: districtId,
            ...(filterData || {}),
            ...(geoData ? { geojson: geoData.geojson, poi_data: geoData.poi_data } : {})
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createCountry = async (req, res) => {
    try {
        const { data, error } = await supabase.from('countries').insert([{ name: req.body.name }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createCity = async (req, res) => {
    try {
        const { data, error } = await supabase.from('cities').insert([{ name: req.body.name, country_id: req.body.countryId }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createDistrict = async (req, res) => {
    try {
        const { data, error } = await supabase.from('districts').insert([{ name: req.body.name, city_id: req.body.cityId }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteCity = async (req, res) => {
    try {
        const { error } = await supabase.from('cities').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteDistrict = async (req, res) => {
    try {
        const { error } = await supabase.from('districts').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const updateDistrictStatus = async (req, res) => {
    try {
        const { is_available } = req.body;
        const { error } = await supabase.from('districts').update({ is_available }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const saveResults = async (req, res) => {
    try {
        const { resultsArray } = req.body;
        for (const row of resultsArray) {
            const { 
                district_name, error: rowError, bbox, parsed_pois, manual_pois, poi_points, 
                geojson, poi_data, district_id, ...restProps 
            } = row;
            
            const finalPoiData = poi_data !== undefined ? poi_data : (parsed_pois !== undefined ? parsed_pois : (poi_points !== undefined ? poi_points : undefined));
            const now = new Date().toISOString();
            
            if (geojson !== undefined || finalPoiData !== undefined) {
                const geoPayload = { district_id };
                if (geojson !== undefined) geoPayload.geojson = geojson;
                if (finalPoiData !== undefined) geoPayload.poi_data = finalPoiData;
                
                const { error: geoErr } = await supabase.from('district_geo_data').upsert(geoPayload, { onConflict: 'district_id' });
                if (geoErr) throw geoErr;
            }

            const filterPayload = { district_id, last_updated: now, data_updated_at: now };
            Object.keys(restProps).forEach(key => {
                if (restProps[key] !== undefined && restProps[key] !== null) {
                    filterPayload[key] = restProps[key];
                }
            });

            const { error: filterErr } = await supabase.from('district_filter_data').upsert(filterPayload, { onConflict: 'district_id' });
            if (filterErr) throw filterErr;
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDashboardStats = async (req, res) => {
    try {
        const { count: countriesCount } = await supabase.from('countries').select('*', { count: 'exact', head: true });
        const { count: citiesCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
        
        const { data: districts, error: distErr } = await supabase.from('districts').select('id, name, is_available, cities(name)');
        if (distErr) throw distErr;

        const { data: photos } = await supabase.from('district_photos').select('district_id');
        const { data: geos } = await supabase.from('district_geo_data').select('district_id, geojson');

        const photoSet = new Set((photos || []).map(p => p.district_id));
        const geoSet = new Set((geos || []).filter(g => g.geojson).map(g => g.district_id));

        const problematicDistricts = districts.filter(d => !photoSet.has(d.id) || !geoSet.has(d.id)).map(d => ({
            id: d.id,
            name: d.name,
            cityName: d.cities?.name || 'Невідомо',
            missingPhoto: !photoSet.has(d.id),
            missingGeo: !geoSet.has(d.id),
            isAvailable: d.is_available
        }));

        res.json({
            totalCountries: countriesCount || 0,
            totalCities: citiesCount || 0,
            totalDistricts: districts.length || 0,
            publishedDistricts: districts.filter(d => d.is_available).length,
            problematicDistricts
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};