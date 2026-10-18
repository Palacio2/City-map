import { listPbfFiles } from '../services/pbfFiles.js';
import { createJobLogger } from "../utils/logger.js";
import { LOGS } from "../config/logTemplates.js";
import { PARSER_CONFIG } from "../config/parserConfig.js";
import { runUniversalParser } from "../services/parserCore.js";
import { osmAdapter } from "../services/sources/osmAdapter.js";
import { RunParserSchema } from "../schemas/parserSchema.js";
import { queueService } from "../services/queueService.js";
import { supabase } from "../utils/supabase.js";

import { authorizeResults, authorizeParserConfig, scopeParserJobs } from '../services/parserAuthorization.js';
const jobs = (req, columns) => scopeParserJobs(supabase.from('parser_jobs').select(columns), req.adminAccess, req.user.id);

export const getStatus = async (req, res, next) => {
    try {
        const isParsing = await queueService.isLocked();
        res.json({ isParsing });
    } catch (err) { next(err); }
};

export const getCurrentLog = async (req, res, next) => {
    try {
        const { data, error } = await jobs(req, 'logs')
            .in('status', ['running', 'pending', 'completed', 'failed'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        if (data && data.logs && data.logs.length > 0) {
            const formattedLogs = data.logs.slice(-500).map(log => `[${log.timestamp}] [${log.status}] ${log.message}`).join('\n');
            res.send(formattedLogs);
        } else {
            res.send("");
        }
    } catch (err) { next(err); }
};

export const downloadLog = async (req, res, next) => {
    try {
        const { data, error } = await jobs(req, 'logs')
            .in('status', ['running', 'pending', 'completed', 'failed'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        if (data && data.logs && data.logs.length > 0) {
            const formattedLogs = data.logs.map(log => `[${log.timestamp}] [${log.status}] ${log.message}`).join('\n');
            res.setHeader('Content-disposition', 'attachment; filename=parser-combined.log');
            res.setHeader('Content-type', 'text/plain');
            res.send(formattedLogs);
        } else {
            res.status(404).send("Logs not found");
        }
    } catch (err) { next(err); }
};

export const getPbfFiles = async (req, res, next) => {
    try {
        res.json(await listPbfFiles(PARSER_CONFIG.PATHS.DATA_DIR));
    } catch (err) { next(err); }
};

export const getPendingResults = async (req, res, next) => {
    try {
        const { data, error } = await jobs(req, 'results')
            .eq('status', 'completed')
            .not('results', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        res.json(data?.results || []);
    } catch (err) {
        next(err);
    }
};

export const deletePendingResults = async (req, res, next) => {
    try {
        const { data, error: selectErr } = await jobs(req, 'id')
            .eq('status', 'completed')
            .not('results', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
        if (selectErr) throw selectErr;
        if (data) {
            const { error } = await supabase.from('parser_jobs').update({ results: null }).eq('id', data.id);
            if (error) throw error;
        }
        res.json({ success: true });
    } catch (err) { next(err); }
};

export const updatePendingResults = async (req, res, next) => {
    try {
        if (!Array.isArray(req.body.newData) || req.body.newData.length > 0) {
            await authorizeResults(supabase, req.adminAccess, req.body.newData);
        }
        const { data, error: selectErr } = await jobs(req, 'id')
            .eq('status', 'completed')
            .not('results', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
        if (selectErr) throw selectErr;
        if (data) {
            const { error } = await supabase.from('parser_jobs').update({ results: req.body.newData }).eq('id', data.id);
            if (error) throw error;
        }
        res.json({ success: true });
    } catch (err) { next(err); }
};

export const findDistricts = async (req, res, next) => {
    try {
        const { cityName } = RunParserSchema.pick({ cityName: true }).parse(req.body);
        if (!cityName) return res.status(400).json({ error: "Missing cityName" });

        const uniqueDistricts = await osmAdapter.findDistrictsOnOverpass(cityName);
        return res.json({ districts: uniqueDistricts });
    } catch (err) { next(err); }
};

export const runOsmParser = async (req, res, next) => {
    let config;
    try {
        config = RunParserSchema.parse(req.body);
    } catch (e) {
        console.error("Zod Validation Error:", JSON.stringify(e.errors, null, 2));
        return res.status(400).json({ error: "Validation failed", details: e.errors });
    }
    
    try {
        config = await authorizeParserConfig(supabase, req.adminAccess, req.user.id, config);
        if (!await queueService.acquire(config)) return res.status(409).json({ error: "Parser busy" });
        const logger = createJobLogger(config.jobId, config.leaseToken);

        res.status(202).json({ success: true });

        // Запуск парсера у фоні
        (async () => {
            const start = Date.now();
            const heartbeat = setInterval(() => {
                queueService.heartbeat(config).catch(error => logger.error('Parser heartbeat failed: ' + error.message));
            }, 30_000);
            try {
                logger.log(LOGS.START(config.cityName, config.districts?.length || 0));
                
                if (!config.enabledSources || config.enabledSources.length === 0) {
                    config.enabledSources = [];
                    if (config.useOSM) config.enabledSources.push('osm', 'osm_pbf');
                    if (config.useWAQI) config.enabledSources.push('api');
                    if (config.useGUS) config.enabledSources.push('gus');
                    if (config.useOtodom) config.enabledSources.push('scraper', 'otodom');
                }

                await runUniversalParser(config, logger);

                const time = ((Date.now() - start) / 1000).toFixed(1);
                logger.log(LOGS.END(config.districts?.length || 0, time), 'SUCCESS');
            } catch (e) {
                await queueService.save({ ...config, status: 'failed', error: e.message }).catch(error => logger.error(error.message));
                logger.log(LOGS.ERR_CRITICAL(e.message), 'ERROR');
            } finally {
                clearInterval(heartbeat);
                if (typeof logger.forceFlush === 'function') {
                    await logger.forceFlush();
                }
            }
        })();
    } catch (err) {
        next(err);
    }
};
