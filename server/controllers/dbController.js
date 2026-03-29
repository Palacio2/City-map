import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';
import { generateDashboardStats } from "../services/dashboardService.js";
import { PARSER_CONFIG } from "../config/parserConfig.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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
        const { data, error } = await supabase.from('districts').select(`*, district_filter_data (last_updated)`).eq('city_id', req.params.cityId).order('name');
        if (error) throw error;
        const formattedData = data.map(d => ({ 
            ...d, 
            last_updated: d.district_filter_data?.length > 0 ? d.district_filter_data[0].last_updated : null 
        }));
        res.json(formattedData);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getCityMapData = async (req, res) => {
    try {
        const { data: dists, error: dErr } = await supabase.from('districts').select('id, name, is_available').eq('city_id', req.params.cityId);
        if (dErr) throw dErr;
        if (!dists || dists.length === 0) return res.json([]);

        const distIds = dists.map(d => d.id);
        const { data: geo, error: gErr } = await supabase.from('district_geo_data').select('district_id, geojson, poi_data').in('district_id', distIds);
        if (gErr) throw gErr;

        const result = dists.map(d => ({
            ...d,
            geojson: geo?.find(g => g.district_id === d.id)?.geojson || null,
            poi_data: geo?.find(g => g.district_id === d.id)?.poi_data || []
        }));
        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteCountry = async (req, res) => {
    try {
        const { error } = await supabase.from('countries').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) { res.status(400).json({ error: error.message }); }
};

export const getDistrictData = async (req, res) => {
    try {
        const { data: filterData } = await supabase.from('district_filter_data').select('*').eq('district_id', req.params.districtId).maybeSingle();
        const { data: geoData } = await supabase.from('district_geo_data').select('*').eq('district_id', req.params.districtId).maybeSingle();
        res.json({ 
            district_id: req.params.districtId, 
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
        const { name, cityId } = req.body;
        if (!name || !cityId) return res.status(400).json({ error: "Missing name or cityId" });

        if (PARSER_CONFIG.FILTERS.INVALID_DISTRICT_TERMS.some(term => name.toLowerCase().includes(term))) {
            return res.json({ ignored: true, message: "Ignored invalid district name" });
        }

        const { data: existingDistrict, error: searchError } = await supabase
            .from('districts')
            .select('*')
            .eq('name', name)
            .eq('city_id', cityId)
            .maybeSingle();

        if (searchError) throw searchError;
        if (existingDistrict) return res.json(existingDistrict);

        const { data, error } = await supabase
            .from('districts')
            .insert([{ name, city_id: cityId }])
            .select()
            .single();
            
        if (error) {
            if (error.code === '23505') { 
                const { data: raceDistrict } = await supabase.from('districts').select('*').eq('name', name).eq('city_id', cityId).single();
                return res.json(raceDistrict);
            }
            throw error;
        }
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
        const { error } = await supabase.from('districts').update({ is_available: req.body.is_available }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const saveResults = async (req, res) => {
    try {
        const filterPayloads = [];
        const now = new Date().toISOString();
        const ignoreFields = ['id', 'name', 'city_id', 'is_available', 'created_at', 'updated_at', 'district_name', 'last_updated', 'district_filter_data', 'district_id'];

        for (const row of req.body.resultsArray) {
            const currentDistrictId = row.district_id || row.id;
            if (!currentDistrictId) continue;

            const { geojson, poi_data, ...rest } = row;
            
            if (geojson !== undefined || poi_data !== undefined) {
                const geoUpdate = { district_id: currentDistrictId };
                if (geojson !== undefined) geoUpdate.geojson = geojson;
                if (poi_data !== undefined) geoUpdate.poi_data = poi_data;
                await supabase.from('district_geo_data').upsert(geoUpdate, { onConflict: 'district_id' });
            }

            const filterData = { district_id: currentDistrictId, last_updated: now, data_updated_at: now };
            Object.keys(rest).forEach(k => { 
                if (rest[k] != null && !ignoreFields.includes(k)) filterData[k] = rest[k]; 
            });
            filterPayloads.push(filterData);
        }

        if (filterPayloads.length) {
            await supabase.from('district_filter_data').upsert(filterPayloads, { onConflict: 'district_id' });
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDashboardStats = async (req, res) => {
    try {
        const stats = await generateDashboardStats();
        res.json(stats);
    } catch (e) { res.status(500).json({ error: e.message }); }
};