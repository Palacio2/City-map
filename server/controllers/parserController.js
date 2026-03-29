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
    try {
        const { cityName } = req.body;
        const query = PARSER_CONFIG.QUERIES.OVERPASS_DISTRICTS(cityName);
        const response = await axios.post("https://overpass-api.de/api/interpreter", query, { timeout: 30000 });
        const elements = response.data.elements || [];
        
        const officialDistricts = elements.filter(el => el.tags && el.tags.admin_level === "9");
        let targetElements = officialDistricts.length > 0 ? officialDistricts : elements;
        
        const districts = targetElements
            .map(el => el.tags?.name)
            .filter(Boolean)
            .filter(name => name.toLowerCase() !== cityName.toLowerCase())
            .filter(name => !PARSER_CONFIG.FILTERS.INVALID_DISTRICT_TERMS.some(term => name.toLowerCase().includes(term)));

        const uniqueDistricts = [...new Set(districts)].map(name => ({ name })).sort((a, b) => a.name.localeCompare(b.name));
        res.json({ districts: uniqueDistricts });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const runOsmParser = (req, res) => {
    const { cityName, pbfFileName, districts, useOSM, useWAQI, useGUS, countryCode } = req.body;
    if (isParsingRunning) return res.status(400).json({ error: "Parser busy" });

    res.status(202).json({ success: true });

    (async () => {
        isParsingRunning = true;
        const start = Date.now();
        try {
            logger.log(LOGS.START(cityName, districts.length));
            const enabledSources = [];
            if (useOSM) enabledSources.push('osm', 'osm_pbf');
            if (useWAQI) enabledSources.push('api');
            if (useGUS) enabledSources.push('gus');

            await runUniversalParser({ cityName, pbfFileName, districts, countryCode, enabledSources }, logger);
            logger.log(LOGS.END(districts.length, Math.round((Date.now() - start) / 1000)), 'SUCCESS');
        } catch (err) {
            logger.log(err.message, 'ERROR');
        } finally {
            isParsingRunning = false;
        }
    })();
};