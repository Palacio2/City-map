export const evaluateField = (field, districtSources) => {
    let config = {};
    try { config = typeof field.parser_config === 'string' ? JSON.parse(field.parser_config) : (field.parser_config || {}); } catch (e) { config = {}; }
        
    const source = config.source || field.source_type;
    const dataBucket = districtSources[source === 'osm_pbf' ? 'osm' : source] || {};
    
    // Бронебійний ключ
    const fieldKey = field.key || field.field_code; 
    
    switch (source) {
        case 'osm':
        case 'osm_pbf':
            return dataBucket[fieldKey] || 0;
            
        case 'api':
        case 'gus':
            if (config.api?.provider === 'gus' || source === 'gus') {
                return dataBucket[config.api?.extract || fieldKey] || 0;
            }
            if (config.api?.provider === 'waqi' || fieldKey === 'air_quality') {
                return dataBucket.aqi || 0;
            }
            return 0;
            
        case 'scraper':
        case 'otodom':
            const scraperConf = config.scraper || config.otodom;
            if (scraperConf) {
                const typeData = dataBucket[scraperConf.type] || {};
                return typeData[scraperConf.extract] || 0;
            }
            return 0;
            
        default:
            return 0;
    }
};

export const castDataType = (value, dataType) => {
    // Додав підтримку типів number і float, якщо вони так записані в БД
    if (value === null || value === undefined) return dataType === 'integer' || dataType === 'numeric' || dataType === 'number' || dataType === 'float' ? 0 : '';
    
    switch (dataType) {
        case 'integer': 
        case 'number':
            return parseInt(value, 10) || 0;
        case 'numeric': 
        case 'float':
            return parseFloat(value) || 0;
        case 'boolean': return Boolean(value);
        case 'text': return String(value);
        default: return value;
    }
};