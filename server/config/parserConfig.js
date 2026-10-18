export const PARSER_CONFIG = {
    PATHS: {
        LOGS_DIR: "./data/logs",
        DATA_DIR: "./data"
    },
    TIMEOUTS: {
        AXIOS: 10000,
        WAQI_API: 5000,
        PUPPETEER: 90000,
        PROTOCOL: 240000,
        RETRY_SCRAPING: 2
    },
    BROWSER: {
        WINDOW_WIDTH: 1920,
        WINDOW_HEIGHT: 1080,
        RAM_LIMIT_MB: 512 // Обмеження для V8 (щоб не падав сервер)
    },
    STATS: {
        DEFAULT_UTILITIES_COST: 12,
        SIX_MONTHS_MS: 6 * 30 * 24 * 60 * 60 * 1000,
        COORD_PRECISION: 5 // Кількість знаків після коми для координат
    },
    FILTERS: {
        INVALID_DISTRICT_TERMS: ['województwo', 'powiat', 'gmina', 'okręg', 'parafia']
    },
    API: {
        WAQI_URL: (lat, lon, token) => `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`,
        OVERPASS_URL: "https://overpass-api.de/api/interpreter",
        BDL_UNITS_URL: (name) => `https://bdl.stat.gov.pl/api/v1/units?name=${encodeURIComponent(name)}&format=json`,
        BDL_DATA_URL: (unitId, varId) => `https://bdl.stat.gov.pl/api/v1/data/by-unit/${unitId}?var-id=${varId}&format=json`
    },
    QUERIES: {
        OVERPASS_DISTRICTS: (cityName) => {
            // Sanitize cityName to prevent Overpass QL injection
            const safeName = cityName.replace(/["\\\[\]{}]/g, '');
            return `[out:json][timeout:30]; area["name"="${safeName}"]["admin_level"~"6|7|8"]->.city; (relation["boundary"="administrative"]["admin_level"~"9|10"](area.city); node["place"="suburb"](area.city); relation["place"="suburb"](area.city); way["place"="suburb"](area.city);); out tags;`;
        }
    },
};