import fs from "fs";
import axios from "axios";
import { logger } from "../utils/logger.js";
import { LOGS } from "../config/logTemplates.js";
import { PARSER_CONFIG } from "../config/parserConfig.js";
import { runUniversalParser } from "../services/parserCore.js";

let isParsingRunning = false;

export const getStatus = (req, res) => res.json({ isParsing: isParsingRunning });

export const getCurrentLog = (req, res) => {
    const logPath = `${PARSER_CONFIG.PATHS.LOGS_DIR}/parser-${new Date().toISOString().split('T')[0]}.log`;
    if (fs.existsSync(logPath)) {
        res.send(fs.readFileSync(logPath, 'utf8').trim().split('\n').slice(-50).join('\n'));
    } else res.send("");
};

export const downloadLog = (req, res) => {
    const logPath = `${PARSER_CONFIG.PATHS.LOGS_DIR}/parser-${new Date().toISOString().split('T')[0]}.log`;
    if (fs.existsSync(logPath)) res.download(logPath);
    else res.status(404).send("File not found");
};

export const getPbfFiles = (req, res) => {
    if (!fs.existsSync(PARSER_CONFIG.PATHS.DATA_DIR)) fs.mkdirSync(PARSER_CONFIG.PATHS.DATA_DIR, { recursive: true });
    res.json(fs.readdirSync(PARSER_CONFIG.PATHS.DATA_DIR).filter(file => file.endsWith('.pbf')));
};

export const getPendingResults = (req, res) => {
    try {
        if (fs.existsSync(PARSER_CONFIG.PATHS.PENDING_RESULTS)) {
            return res.json(JSON.parse(fs.readFileSync(PARSER_CONFIG.PATHS.PENDING_RESULTS, "utf8")));
        }
        res.json([]);
    } catch { res.json([]); }
};

export const deletePendingResults = (req, res) => {
    if (fs.existsSync(PARSER_CONFIG.PATHS.PENDING_RESULTS)) fs.unlinkSync(PARSER_CONFIG.PATHS.PENDING_RESULTS);
    res.json({ success: true });
};

export const updatePendingResults = (req, res) => {
    try {
        fs.writeFileSync(PARSER_CONFIG.PATHS.PENDING_RESULTS, JSON.stringify(req.body.newData, null, 2));
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const findDistricts = async (req, res) => {
    const { cityName } = req.body;
    if (!cityName) return res.status(400).json({ error: "Missing cityName" });

    const query = PARSER_CONFIG.QUERIES.OVERPASS_DISTRICTS(cityName);
    
    // Список резервних серверів Overpass API (на випадок блокування або лімітів)
    const endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://z.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ];

    let lastError = null;

    // Пробуємо сервери по черзі
    for (const endpoint of endpoints) {
        try {
            console.log(`[OSM SCAN] Спроба отримати райони з сервера: ${endpoint}`);
            
            // Створюємо правильне кодування через URLSearchParams
            const params = new URLSearchParams();
            params.append('data', query);

            const response = await axios.post(endpoint, params.toString(), { 
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'User-Agent': 'CityMapsParserBot/1.0 (Contact: admin@citymaps.com)' // Обов'язковий заголовок для OSM
                },
                timeout: 15000 
            });
            
            const elements = response.data?.elements || [];
            
            // Ваша логіка фільтрації
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

            const uniqueDistricts = [...new Set(districts)].map(name => ({ name })).sort((a, b) => a.name.localeCompare(b.name));
            
            console.log(`[OSM SCAN] ✅ Успішно знайдено ${uniqueDistricts.length} районів!`);
            return res.json({ districts: uniqueDistricts });
            
        } catch (err) {
            console.log(`[OSM SCAN] ⚠️ Сервер ${endpoint} не відповів: ${err.message}`);
            lastError = err;
            // Продовжуємо цикл і пробуємо наступний сервер
        }
    }

    // Якщо жоден сервер не відповів
    console.error(`[OSM SCAN] ❌ Всі сервери OSM недоступні.`);
    res.status(500).json({ error: `OSM API Error: ${lastError?.message || 'Всі сервери недоступні'}` });
};

export const runOsmParser = (req, res) => {
    // 1. Беремо ВЕСЬ об'єкт req.body без жорсткої фільтрації
    const config = req.body; 
    
    if (isParsingRunning) return res.status(400).json({ error: "Parser busy" });

    res.status(202).json({ success: true });

    (async () => {
        isParsingRunning = true;
        const start = Date.now();
        try {
            logger.log(LOGS.START(config.cityName, config.districts?.length || 0));
            
            // 2. Якщо фронтенд раптом не передав масив enabledSources, формуємо його (з підтримкою Otodom)
            if (!config.enabledSources || config.enabledSources.length === 0) {
                config.enabledSources = [];
                if (config.useOSM) config.enabledSources.push('osm', 'osm_pbf');
                if (config.useWAQI) config.enabledSources.push('api');
                if (config.useGUS) config.enabledSources.push('gus');
                if (config.useOtodom) config.enabledSources.push('scraper', 'otodom');
            }

            // 3. Передаємо весь config у ядро (включно з propertyUrls!)
            await runUniversalParser(config, logger);

            isParsingRunning = false;
            const time = ((Date.now() - start) / 1000).toFixed(1);
            logger.log(LOGS.END(config.districts?.length || 0, time), 'SUCCESS');
        } catch (e) {
            isParsingRunning = false;
            logger.log(LOGS.ERR_CRIT(e.message), 'ERROR');
        }
    })();
};