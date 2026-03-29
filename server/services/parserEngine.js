export const evaluateField = (field, districtSources) => {
    let config = {};
    try { config = typeof field.parser_config === 'string' ? JSON.parse(field.parser_config) : (field.parser_config || {}); } catch (e) { config = {}; }
        
    const source = config.source || field.source_type;
    const dataBucket = districtSources[source === 'osm_pbf' ? 'osm' : source] || {};
    
    switch (source) {
        case 'osm':
        case 'osm_pbf':
            return dataBucket[field.field_code] || 0;
            
        case 'api':
        case 'gus':
            if (config.api?.provider === 'gus' || source === 'gus') {
                return dataBucket[config.api?.extract || field.field_code] || 0;
            }
            if (config.api?.provider === 'waqi' || field.field_code === 'air_quality') {
                return dataBucket.aqi || 0;
            }
            return 0;
            
        case 'scraper':
        case 'otodom':
            const platform = config.scraper?.platform || source;
            if (platform === 'otodom') {
                const typeData = dataBucket[config.scraper?.type] || {};
                return typeData[config.scraper?.extract] || 0;
            }
            return 0;
            
        default:
            return 0;
    }
};

export const castDataType = (value, dataType) => {
    if (value === null || value === undefined) return dataType === 'integer' || dataType === 'numeric' ? 0 : '';
    switch (dataType) {
        case 'integer': return parseInt(value, 10) || 0;
        case 'numeric': return parseFloat(value) || 0;
        case 'boolean': return Boolean(value);
        case 'text': return String(value);
        default: return value;
    }
};