import { supabase } from "../utils/supabase.js";
import { authorizeResults } from '../services/parserAuthorization.js';
import { requireAction } from '../../shared/authorization.js';

export const saveResults = async (req, res, next) => {
    try {
        requireAction(req.adminAccess, 'manual.save');
        await authorizeResults(supabase, req.adminAccess, req.body.resultsArray);
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
                requireAction(req.adminAccess, 'manual.gis', 'parser.run_offline');
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
                    if (typeof val === 'number' && !Number.isFinite(val)) throw new Error('Invalid numeric value');
                    filterData[k] = val;
                }
            });

            filterPayloads.push(filterData);
        }

        const rows = filterPayloads.map(metrics => {
            const geo = geoPayloads.find(item => item.district_id === metrics.district_id);
            return { district_id: metrics.district_id, metrics, ...(geo ? { geo } : {}) };
        });
        const { error } = await supabase.rpc('save_district_bundle', { p_actor: req.user.id, p_rows: rows });
        if (error) throw error;
        
        res.json({ success: true });
    } catch (e) { 
        console.error("[DB SAVE ERROR]", e.message);
        next(e);
    }
};
