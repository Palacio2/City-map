import { supabase } from "../utils/supabase.js";
import { generateDashboardStats } from "../services/dashboardService.js";
import { PARSER_CONFIG } from "../config/parserConfig.js";
import { CreateCountrySchema, CreateCitySchema, CreateDistrictSchema, UpdateDistrictStatusSchema } from "../schemas/dbSchema.js";

export const getCountries = async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('countries').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (e) { next(e); }
};

export const getCities = async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('cities').select('*').eq('country_id', req.params.countryId).order('name');
        if (error) throw error;
        res.json(data);
    } catch (e) { next(e); }
};

export const getDistricts = async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('districts').select(`*, district_filter_data (last_updated)`).eq('city_id', req.params.cityId).order('name');
        if (error) throw error;
        const formattedData = data.map(d => ({ 
            ...d, 
            last_updated: d.district_filter_data?.length > 0 ? d.district_filter_data[0].last_updated : null 
        }));
        res.json(formattedData);
    } catch (e) { next(e); }
};

export const getCityMapData = async (req, res, next) => {
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
    } catch (e) { next(e); }
};

export const deleteCountry = async (req, res, next) => {
    try {
        const { error } = await supabase.from('countries').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) { next(error); }
};

export const getDistrictData = async (req, res, next) => {
    try {
        const { data: filterData, error: fErr } = await supabase.from('district_filter_data').select('*').eq('district_id', req.params.districtId).maybeSingle();
        if (fErr) throw fErr;
        const { data: geoData, error: gErr } = await supabase.from('district_geo_data').select('*').eq('district_id', req.params.districtId).maybeSingle();
        if (gErr) throw gErr;
        res.json({ 
            district_id: req.params.districtId, 
            ...(filterData || {}), 
            ...(geoData ? { geojson: geoData.geojson, poi_data: geoData.poi_data } : {}) 
        });
    } catch (e) { next(e); }
};

export const createCountry = async (req, res, next) => {
    try {
        const parsed = CreateCountrySchema.parse(req.body);
        const { data, error } = await supabase.from('countries').insert([{ name: parsed.name }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { 
        if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
        next(e); 
    }
};

export const createCity = async (req, res, next) => {
    try {
        const parsed = CreateCitySchema.parse(req.body);
        const { data, error } = await supabase.from('cities').insert([{ name: parsed.name, country_id: parsed.countryId }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (e) { 
        if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
        next(e); 
    }
};

export const createDistrict = async (req, res, next) => {
    try {
        const parsed = CreateDistrictSchema.parse(req.body);
        const { name, cityId } = parsed;

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
    } catch (e) { 
        if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
        next(e); 
    }
};

export const deleteCity = async (req, res, next) => {
    try {
        const { error } = await supabase.from('cities').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
};

export const deleteDistrict = async (req, res, next) => {
    try {
        const { error } = await supabase.from('districts').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { next(e); }
};

export const updateDistrictStatus = async (req, res, next) => {
    try {
        const parsed = UpdateDistrictStatusSchema.parse(req.body);
        const { error } = await supabase.from('districts').update({ is_available: parsed.is_available }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { 
        if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
        next(e); 
    }
};

export const saveResults = async (req, res, next) => {
    try {
        const filterPayloads = [];
        const geoPayloads = [];
        const now = new Date().toISOString();
        const ignoreFields = ['id', 'name', 'city_id', 'is_available', 'created_at', 'updated_at', 'district_name', 'last_updated', 'district_filter_data', 'district_id'];

        for (const row of req.body.resultsArray) {
            const currentDistrictId = row.district_id || row.id;
            if (!currentDistrictId) continue;

            const { geojson, poi_data, ...rest } = row;
            
            // 1. Готуємо гео-дані для bulk upsert
            if (geojson !== undefined || poi_data !== undefined) {
                const geoUpdate = { district_id: currentDistrictId };
                if (geojson !== undefined) geoUpdate.geojson = geojson;
                if (poi_data !== undefined) geoUpdate.poi_data = poi_data;
                geoPayloads.push(geoUpdate);
            }

            // 2. Готуємо метрики (цифри)
            const filterData = { district_id: currentDistrictId, last_updated: now, data_updated_at: now };
            Object.keys(rest).forEach(k => { 
                if (rest[k] != null && !ignoreFields.includes(k)) {
                    let val = rest[k];
                    if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
                        val = Number(val);
                    }
                    if (typeof val === 'number' && !Number.isInteger(val)) {
                        val = Math.round(val);
                    }
                    filterData[k] = val;
                }
            });

            // ПЕРЕХОПЛЕННЯ НАСЕЛЕННЯ МІСТА:
            // Якщо парсер передав поле 'population' (яке є населенням всього міста),
            // ми дублюємо його в 'city_population'. 
            // Тоді SQL-тригер використає його для розподілу і сам перезапише справжнє населення району в 'population'.
            if (filterData.population !== undefined) {
                filterData.city_population = filterData.population;
            }
            filterPayloads.push(filterData);
        }

        // 3. Виконуємо bulk upsert
        if (geoPayloads.length) {
            const { error: geoErr } = await supabase.from('district_geo_data').upsert(geoPayloads, { onConflict: 'district_id' });
            if (geoErr) throw new Error(`Помилка запису Гео-даних: ${geoErr.message}`);
        }

        if (filterPayloads.length) {
            const { error: filterErr } = await supabase.from('district_filter_data').upsert(filterPayloads, { onConflict: 'district_id' });
            if (filterErr) throw new Error(`Помилка запису метрик: ${filterErr.message}`);
        }
        
        res.json({ success: true });
    } catch (e) { 
        console.error("[DB SAVE ERROR]", e.message);
        next(e);
    }
};

export const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await generateDashboardStats();
        res.json(stats);
    } catch (e) { next(e); }
};