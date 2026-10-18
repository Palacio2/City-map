import { getSourceAdapter } from './sources/index.js';
import { evaluateField, castDataType } from './parserEngine.js';
import { queueService } from './queueService.js';
import { supabase } from '../utils/supabase.js';
const canonicalSource = source => source === 'osm_pbf' ? 'osm' : source === 'otodom' ? 'scraper' : source;

export const runUniversalParser = async (config, logger) => {
    const { data: allFields, error: fieldsError } = await supabase.from('fields_config').select('*').eq('is_active', true);
    if (fieldsError || !allFields) throw fieldsError || new Error('Missing parser configuration');
    
    const { data: geoData, error: geoError } = await supabase.from('district_geo_data')
        .select('district_id, geojson')
        .in('district_id', config.districts.map(d => d.id));
    if (geoError) throw geoError;

    config.districtsData = config.districts.map(d => ({
        district_id: d.id,
        name: d.name,
        geojson: geoData?.find(g => g.district_id === d.id)?.geojson
    })).filter(d => d.geojson);

    const sourceResults = {};
    const uniqueSources = [...new Set(allFields.map(f => canonicalSource(f.source_type)))];
    const enabledSources = new Set(config.enabledSources.map(canonicalSource));

    for (const source of uniqueSources) {
        if (!enabledSources.has(source)) continue;
        
        const adapter = getSourceAdapter(source);
        if (adapter) {
            const fieldsForSource = allFields.filter(f => 
                canonicalSource(f.source_type) === source
            );
            sourceResults[source] = await adapter.fetchData(config, fieldsForSource, logger);
        }
    }

    const finalResults = config.districts.map(d => {
        const districtSources = {
            osm: sourceResults.osm?.[d.id] || {},
            gus: sourceResults.gus || {},
            api: sourceResults.api?.[d.id] || {},
            scraper: sourceResults.scraper?.[d.id] || {},
            otodom: sourceResults.scraper?.[d.id] || {}
        };

        // ВИПРАВЛЕНО ТУТ: Тепер ми не губимо poi_data!
        let result = { 
            district_id: d.id, 
            district_name: d.name, 
            is_available: d.is_available,
            // Забираємо координати міток прямо з результатів OSM
            ...(sourceResults.osm?.[d.id]?.poi_data !== undefined ? { poi_data: sourceResults.osm[d.id].poi_data } : {})
        };
        
        allFields.forEach(field => {
            const source = canonicalSource(field.source_type);
            if (!Object.hasOwn(sourceResults, source) || sourceResults[source] == null) return;
            if (source !== 'gus' && sourceResults[source][d.id] == null) return;
            const val = evaluateField(field, districtSources);
            if (val == null) return;
            const converted = castDataType(val, field.data_type);
            if (converted != null) {
                // GUS reports the whole city, not a district allocation.
                const key = source === 'gus' && field.field_code === 'population' ? 'city_population' : field.field_code;
                result[key] = converted;
            }
        });
        return result;
    });

    // Зберігаємо результати у БД через queueService, а не у файл
    await queueService.save({ ...config, results: finalResults, status: 'completed' });
    
    return finalResults;
};
