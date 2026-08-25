import { processLocalOsmData } from '../osmProcessor.js';
import { PARSER_CONFIG } from '../../config/parserConfig.js';
import { LOGS } from '../../config/logTemplates.js';
import axios from 'axios';
import { logger as globalLogger } from '../../utils/logger.js';

export const osmAdapter = {
    async fetchData(config, fields, logger) {
        if (!config.pbfFileName) return {};
        const filePath = `${PARSER_CONFIG.PATHS.DATA_DIR}/${config.pbfFileName}`;
        return await processLocalOsmData(filePath, config.districtsData, fields, (m) => logger.log(m));
    },

    async findDistrictsOnOverpass(cityName) {
        const query = PARSER_CONFIG.QUERIES.OVERPASS_DISTRICTS(cityName);
        const endpoints = [
            "https://overpass-api.de/api/interpreter",
            "https://lz4.overpass-api.de/api/interpreter",
            "https://z.overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter"
        ];
        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                globalLogger.info(`[OSM SCAN] Спроба отримати райони з сервера: ${endpoint}`);
                const params = new URLSearchParams();
                params.append('data', query);

                const response = await axios.post(endpoint, params.toString(), { 
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                        'User-Agent': 'CityMapsParserBot/1.0 (Contact: admin@citymaps.com)'
                    },
                    timeout: 15000 
                });
                
                const elements = response.data?.elements || [];
                const officialDistricts = elements.filter(el => el.tags && el.tags.admin_level === "9");
                let targetElements = officialDistricts.length > 0 ? officialDistricts : elements;
                
                const districts = targetElements
                    .map(el => el.tags?.name)
                    .filter(Boolean)
                    .filter(name => name.toLowerCase() !== cityName.toLowerCase())
                    .filter(name => {
                        if (PARSER_CONFIG.FILTERS?.INVALID_DISTRICT_TERMS) {
                            return !PARSER_CONFIG.FILTERS.INVALID_DISTRICT_TERMS.some(term => name.toLowerCase().includes(term));
                        }
                        return true;
                    });

                const uniqueDistricts = [...new Set(districts)]
                    .map(name => ({ name }))
                    .sort((a, b) => a.name.localeCompare(b.name));
                
                globalLogger.info(`[OSM SCAN] ✅ Успішно знайдено ${uniqueDistricts.length} районів!`);
                return uniqueDistricts;
            } catch (err) {
                globalLogger.info(`[OSM SCAN] ⚠️ Сервер ${endpoint} не відповів: ${err.message}`);
                lastError = err;
            }
        }
        globalLogger.error(`[OSM SCAN] ❌ Всі сервери OSM недоступні.`);
        throw new Error(`OSM API Error: ${lastError?.message || 'Всі сервери недоступні'}`);
    }
};