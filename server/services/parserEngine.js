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
            return dataBucket[fieldKey] ?? null;
            
        case 'api':
        case 'gus':
            if (config.api?.provider === 'gus' || source === 'gus') {
                return dataBucket[config.api?.extract || fieldKey] ?? null;
            }
            if (config.api?.provider === 'waqi' || fieldKey === 'air_quality') {
                return dataBucket.aqi ?? null;
            }
            return null;
            
        case 'scraper':
        case 'otodom':
            const scraperConf = config.scraper || config.otodom;
            if (scraperConf) {
                const typeData = dataBucket[scraperConf.type] || {};
                return typeData[scraperConf.extract] ?? null;
            }
            return null;
            
        default:
            return null;
    }
};

export const castDataType = (value, dataType) => {
    // Додав підтримку типів number і float, якщо вони так записані в БД
    if (value === null || value === undefined) return null;
    
    switch (dataType) {
        case 'integer':
        case 'number':
        case 'numeric': 
        case 'float': {
            if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) return null;
            const number = Number(value);
            if (!Number.isFinite(number)) return null;
            return dataType === 'integer' ? Math.trunc(number) : number;
        }
        case 'boolean':
            if (value === true || value === 1 || value === 'true' || value === '1') return true;
            if (value === false || value === 0 || value === 'false' || value === '0') return false;
            return null;
        case 'text': return String(value);
        default: return value;
    }
};
