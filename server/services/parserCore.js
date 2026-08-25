import { getSourceAdapter } from './sources/index.js';
import { evaluateField, castDataType } from './parserEngine.js';
import { queueService } from './queueService.js';
import { supabase } from '../utils/supabase.js';

export const runUniversalParser = async (config, logger) => {
    const { data: allFields } = await supabase.from('fields_config').select('*').eq('is_active', true);
    
    const { data: geoData } = await supabase.from('district_geo_data')
        .select('district_id, geojson')
        .in('district_id', config.districts.map(d => d.id));

    config.districtsData = config.districts.map(d => ({
        district_id: d.id,
        name: d.name,
        geojson: geoData?.find(g => g.district_id === d.id)?.geojson
    })).filter(d => d.geojson);

    const sourceResults = {};
    const uniqueSources = [...new Set(allFields.map(f => {
        const type = f.source_type;
        return (type === 'osm_pbf' || type === 'osm') ? 'osm' : type;
    }))];

    for (const source of uniqueSources) {
        if (!config.enabledSources.includes(source) && !config.enabledSources.includes(source === 'osm' ? 'osm_pbf' : '')) continue;
        
        const adapter = getSourceAdapter(source);
        if (adapter) {
            const fieldsForSource = allFields.filter(f => 
                f.source_type === source || (source === 'osm' && f.source_type === 'osm_pbf')
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
            poi_data: districtSources.osm.poi_data || [] 
        };
        
        allFields.forEach(field => {
            const val = evaluateField(field, districtSources);
            result[field.field_code] = castDataType(val, field.data_type);
        });
        return result;
    });

    // Зберігаємо результати у БД через queueService, а не у файл
    await queueService.save({ ...config, results: finalResults, status: 'completed' });
    
    return finalResults;
};