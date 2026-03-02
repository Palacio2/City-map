import fs from "fs";
import axios from "axios";
import { processLocalOsmData } from "../services/osmProcessor.js";
import { getAirQualityWAQI } from "../modules/waqiService.js";
import { initScraper, scrapePage, closeScraper } from "../services/otodomScraper.js";
import { fetchCityMacroStats } from "../services/gusService.js";
import { ALL_METRICS } from "../config/osmMetrics.js";

let isParsingRunning = false;

const appendLog = (msg, status = 'INFO') => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
    let statusIcon = status === 'SUCCESS' ? '✅' : status === 'WARNING' ? '⚠️' : status === 'ERROR' ? '❌' : 'ℹ️';
    const finalMsg = `[${timeStr}] [PARSER] [${status}] ${statusIcon} ${msg}`;
    
    const logDir = "./data/logs";
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(`${logDir}/parser-${dateStr}.log`, `${finalMsg}\n`);
    console.log(finalMsg);
};

export const getStatus = (req, res) => res.json({ isParsing: isParsingRunning });

export const getCurrentLog = (req, res) => {
    const logPath = `./data/logs/parser-${new Date().toISOString().split('T')[0]}.log`;
    if (fs.existsSync(logPath)) {
        res.send(fs.readFileSync(logPath, 'utf8').trim().split('\n').slice(-50).join('\n'));
    } else res.send("");
};

export const downloadLog = (req, res) => {
    const logPath = `./data/logs/parser-${new Date().toISOString().split('T')[0]}.log`;
    if (fs.existsSync(logPath)) res.download(logPath);
    else res.status(404).send("Лог файл сьогодні ще не створено.");
};

export const getPbfFiles = (req, res) => {
    const dataPath = "./data";
    if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
    res.json(fs.readdirSync(dataPath).filter(file => file.endsWith('.pbf')));
};

export const getPendingResults = (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const filePath = "./pending-results.json";
    if (fs.existsSync(filePath)) {
        try { return res.json(JSON.parse(fs.readFileSync(filePath, "utf8"))); } 
        catch (e) { return res.json([]); }
    }
    return res.json([]);
};

export const deletePendingResults = (req, res) => {
    const filePath = "./pending-results.json";
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true });
};

export const updatePendingResults = (req, res) => {
    try {
        fs.writeFileSync("./pending-results.json", JSON.stringify(req.body.newData, null, 2));
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const findDistricts = async (req, res) => {
    try {
        const { cityName } = req.body;
        const query = `[out:json][timeout:30];area["name"="${cityName}"]["admin_level"~"6|7|8"]->.city;(relation["boundary"="administrative"]["admin_level"~"9|10"](area.city);node["place"="suburb"](area.city);relation["place"="suburb"](area.city);way["place"="suburb"](area.city););out tags;`;
        const response = await axios.post("https://overpass-api.de/api/interpreter", query, { timeout: 30000 });
        const invalidTerms = ['województwo', 'powiat', 'gmina', 'okręg'];
        let districts = response.data.elements
            .map(el => el.tags?.name).filter(Boolean)
            .filter(name => name.toLowerCase() !== cityName.toLowerCase())
            .filter(name => !invalidTerms.some(term => name.toLowerCase().includes(term)));
        res.json({ districts: [...new Set(districts)].map(name => ({ name })) });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

export const singleOtodom = async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    let browser = null;
    try {
        browser = await initScraper();
        const saleStats = await scrapePage(browser, url, 'sale', 1);
        const rentUrl = url.replace('/sprzedaz/', '/wynajem/');
        const rentStats = await scrapePage(browser, rentUrl, 'rent', 1);
        res.json({ sale: saleStats, rent: rentStats });
    } catch (e) { res.status(500).json({ error: e.message }); } 
    finally { if (browser) await closeScraper(browser); }
};

export const singleGus = async (req, res) => {
    try {
        const { cityName } = req.body;
        if (!cityName) return res.status(400).json({ error: "Missing cityName" });
        const stats = await fetchCityMacroStats(cityName);
        res.json(stats);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const singleWaqi = async (req, res) => {
    try {
        const { lat, lon } = req.body;
        if (!lat || !lon) return res.status(400).json({ error: "Missing coordinates" });
        const data = await getAirQualityWAQI(lat, lon);
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const singleOsm = async (req, res) => {
    try {
        const { cityName, districtName, pbfFileName, metrics } = req.body;
        if (!cityName || !districtName || !metrics) return res.status(400).json({ error: "Missing data" });
        const filePath = `./data/${pbfFileName}`;
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: "PBF file not found in /data" });

        const osmStats = await processLocalOsmData(filePath, [districtName], cityName, metrics, () => {});
        const dbName = districtName.toLowerCase().trim();
        const osmKey = Object.keys(osmStats).find(k => k.toLowerCase().trim() === dbName || k.toLowerCase().trim().includes(dbName));
        
        if (osmKey) res.json(osmStats[osmKey]);
        else res.status(404).json({ error: "Межі району не знайдено в OSM" });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const runOsmParser = (req, res) => {
    const { cityName, pbfFileName, districts, selectedMetrics, useOSM, useWAQI, useOtodom, useGUS, otodomUrls } = req.body;
    
    if (!cityName || !districts || !districts.length) return res.status(400).json({ error: "Missing required data" });
    if (isParsingRunning) return res.status(400).json({ error: "Parser is already running" });

    res.status(202).json({ success: true, message: "Task started in background" });

    (async () => {
        let browser = null;
        isParsingRunning = true;
        try {
            const totalDistricts = districts.length;
            appendLog(`ПОЧАТОК ПАРСИНГУ: ${cityName} (${totalDistricts} районів)`, 'INFO');
            
            let baseResults = districts.map(d => ({ district_id: d.id, district_name: d.name }));
            let osmStats = {};

            if (useOSM || useWAQI) {
                const filePath = `./data/${pbfFileName || "kujawsko-pomorskie-260225.osm.pbf"}`;
                if (fs.existsSync(filePath)) {
                    osmStats = await processLocalOsmData(filePath, districts.map(d => d.name), cityName, selectedMetrics, appendLog);
                }
                
                if (useOSM) {
                    const activeMetrics = (selectedMetrics && selectedMetrics.length > 0) ? selectedMetrics : ALL_METRICS.map(m => m.db);
                    baseResults = baseResults.map(district => {
                        const dbName = district.district_name.toLowerCase().trim();
                        const osmKey = Object.keys(osmStats).find(k => k.toLowerCase().trim() === dbName || k.toLowerCase().trim().includes(dbName));
                        const defaultOsm = {};
                        activeMetrics.forEach(m => defaultOsm[m] = 0);
                        
                        if (osmKey) {
                            appendLog(`Інфраструктуру знайдено для: ${district.district_name}`, 'SUCCESS');
                            return { ...district, ...defaultOsm, ...osmStats[osmKey] };
                        } else {
                            appendLog(`Межі району не знайдено (встановлено нулі): ${district.district_name}`, 'WARNING');
                            return { ...district, ...defaultOsm };
                        }
                    });
                }
            }

            let globalGusStats = { salary: 0, unemployment: 0 };
            if (useGUS) {
                globalGusStats = await fetchCityMacroStats(cityName);
                if (globalGusStats.salary > 0) appendLog(`Зарплата: ${globalGusStats.salary} zł`, 'SUCCESS');
            }

            if (useOtodom && otodomUrls) browser = await initScraper();

            let progressivelySavedResults = [];
            fs.writeFileSync("./pending-results.json", JSON.stringify([], null, 2));

            for (let i = 0; i < baseResults.length; i++) {
                let currentDistrict = { ...baseResults[i] };
                if (useGUS) {
                    currentDistrict.average_salary = globalGusStats.salary;
                    currentDistrict.unemployment_rate = globalGusStats.unemployment;
                }

                if (useWAQI) {
                    currentDistrict.air_quality = 0;
                    const dbName = currentDistrict.district_name.toLowerCase().trim();
                    const osmKey = Object.keys(osmStats).find(k => k.toLowerCase().trim() === dbName || k.toLowerCase().trim().includes(dbName));
                    if (osmKey && osmStats[osmKey].center) {
                        try {
                            const waqiData = await getAirQualityWAQI(osmStats[osmKey].center.lat, osmStats[osmKey].center.lon);
                            if (waqiData && waqiData.aqi > 0) {
                                currentDistrict.air_quality = waqiData.aqi;
                                appendLog(`[${i + 1}/${totalDistricts}] ${currentDistrict.district_name}: AQI ${waqiData.aqi}`, 'SUCCESS');
                            }
                        } catch(e) {}
                    }
                }

                if (useOtodom && otodomUrls) {
                    const saleUrl = otodomUrls[currentDistrict.district_id];
                    currentDistrict.average_property_price = 0;
                    currentDistrict.average_sale_price_sqm = 0;
                    currentDistrict.average_rent_price = 0;
                    
                    if (saleUrl && saleUrl !== '#') {
                        const rentUrl = saleUrl.replace('/sprzedaz/', '/wynajem/');
                        const saleStats = await scrapePage(browser, saleUrl, 'sale', 2);
                        const rentStats = await scrapePage(browser, rentUrl, 'rent', 2);

                        currentDistrict.average_property_price = saleStats.avgPrice || 0;
                        currentDistrict.average_sale_price_sqm = saleStats.avgSqm || 0;
                        currentDistrict.average_rent_price = rentStats.avgPrice || 0;
                        
                        if (saleStats.avgPrice > 0 || rentStats.avgPrice > 0) {
                            appendLog(`[${i + 1}/${totalDistricts}] Продаж: ${saleStats.avgPrice}zł | Оренда: ${rentStats.avgPrice}zł`, 'SUCCESS');
                        }
                    } else {
                        appendLog(`Пропущено Otodom (немає URL): ${currentDistrict.district_name}`, 'WARNING');
                    }
                }

                delete currentDistrict.center;
                progressivelySavedResults.push(currentDistrict);
                fs.writeFileSync("./pending-results.json", JSON.stringify(progressivelySavedResults, null, 2));
            }

            appendLog(`Парсинг завершено. Зібрано дані для ${progressivelySavedResults.length} районів.`, 'SUCCESS');
        } catch (err) {
            appendLog(`Помилка під час виконання: ${err.message}`, 'ERROR');
        } finally {
            isParsingRunning = false;
            if (browser) await closeScraper(browser);
        }
    })();
};