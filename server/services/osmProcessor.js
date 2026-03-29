import fs from "fs";
import OsmPbfParser from "osm-pbf-parser";
import through from "through2";
import * as turf from "@turf/turf";
import { LOGS } from "../config/logTemplates.js";
import { PARSER_CONFIG } from "../config/parserConfig.js";

const getShortType = (dbName) => dbName.replace('_count', '');

export async function processLocalOsmData(filePath, districtsData, fieldsConfig, logger = () => {}) {
    const ALL_METRICS = fieldsConfig.map(rule => {
        let config = {};
        try { 
            config = typeof rule.parser_config === 'string' ? JSON.parse(rule.parser_config) : (rule.parser_config || {}); 
        } catch (e) { config = {}; }
        
        const osmConfig = config.osm || {};
        const operator = osmConfig.operator || 'OR';
        const filters = osmConfig.filters ? [...osmConfig.filters] : [];
        
        if (filters.length === 0 && rule.osm_key) {
            const keysArray = String(rule.osm_key).split(',').map(k => k.trim()).filter(Boolean);
            const valuesArray = rule.osm_value ? String(rule.osm_value).split(',').map(v => v.trim()).filter(Boolean) : ['*'];
            keysArray.forEach(k => {
                valuesArray.forEach(v => filters.push({ key: k, value: v }));
            });
        }

        return {
            db: rule.field_code, 
            label: rule.admin_label,
            hasOsmTags: filters.length > 0,
            filter: (e) => {
                if (!e.tags || filters.length === 0) return false;
                if (operator === 'AND') {
                    return filters.every(f => e.tags[f.key] && (f.value === '*' || e.tags[f.key] === f.value));
                } else {
                    return filters.some(f => e.tags[f.key] && (f.value === '*' || e.tags[f.key] === f.value));
                }
            }
        };
    });

    const finalMetrics = ALL_METRICS.filter(m => m.hasOsmTags);

    if (finalMetrics.length === 0) {
        logger(LOGS.ERR_CRITICAL("No valid OSM rules found in config"), 'ERROR');
        return {};
    }

    logger(LOGS.OSM_START(filePath), 'INFO');

    const districtPolygons = districtsData.map(d => ({
        id: d.district_id,
        name: d.name,
        polygon: d.geojson.type === 'Feature' ? d.geojson : turf.feature(d.geojson),
        bbox: turf.bbox(d.geojson.type === 'Feature' ? d.geojson : turf.feature(d.geojson))
    }));

    const amenityWays = [];
    const neededNodeIds = new Set();

    let t0 = Date.now();
    await new Promise((resolve, reject) => {
        const parser = new OsmPbfParser();
        fs.createReadStream(filePath)
            .pipe(parser)
            .pipe(through.obj(function (items, enc, next) {
                for (const item of items) {
                    if (item.type === 'way' && item.tags && finalMetrics.some(m => m.filter(item))) {
                        const refs = item.nodeRefs || item.refs || [];
                        amenityWays.push({ 
                            tags: item.tags, 
                            refs: [...refs], 
                            matchedMetrics: finalMetrics.filter(m => m.filter(item)).map(m => m.db) 
                        });
                        refs.forEach(r => neededNodeIds.add(String(r)));
                    }
                }
                next();
            }))
            .on('finish', resolve)
            .on('error', reject);
    });
    logger(LOGS.OSM_PASS_1(amenityWays.length, Date.now() - t0), 'INFO');

    const finalPois = [];
    const nodeCoords = new Map();

    t0 = Date.now();
    await new Promise((resolve, reject) => {
        const parser = new OsmPbfParser();
        fs.createReadStream(filePath)
            .pipe(parser)
            .pipe(through.obj(function (items, enc, next) {
                for (const item of items) {
                    if (item.type === 'node') {
                        const nId = String(item.id);
                        if (neededNodeIds.has(nId)) nodeCoords.set(nId, [item.lon, item.lat]);
                        if (item.tags) {
                            const matchedMetrics = finalMetrics.filter(m => m.filter(item)).map(m => m.db);
                            if (matchedMetrics.length > 0) finalPois.push({ coord: [item.lon, item.lat], matchedMetrics });
                        }
                    }
                }
                next();
            }))
            .on('finish', resolve)
            .on('error', reject);
    });
    logger(LOGS.OSM_PASS_2(nodeCoords.size, Date.now() - t0), 'INFO');

    for (const way of amenityWays) {
        let lonSum = 0, latSum = 0, valid = 0;
        for (const ref of way.refs) {
            const coord = nodeCoords.get(String(ref));
            if (coord) {
                lonSum += coord[0];
                latSum += coord[1];
                valid++;
            }
        }
        if (valid > 0) finalPois.push({ coord: [lonSum / valid, latSum / valid], matchedMetrics: way.matchedMetrics });
    }

    const results = {};
    districtPolygons.forEach(dp => {
        results[dp.id] = { district_id: dp.id, district_name: dp.name, poi_data: [] };
        finalMetrics.forEach(m => results[dp.id][m.db] = 0);
    });

    for (const poi of finalPois) {
        const pt = turf.point(poi.coord);
        for (const dp of districtPolygons) {
            const [minX, minY, maxX, maxY] = dp.bbox;
            if (poi.coord[0] < minX || poi.coord[0] > maxX || poi.coord[1] < minY || poi.coord[1] > maxY) continue;
            if (turf.booleanPointInPolygon(pt, dp.polygon)) {
                poi.matchedMetrics.forEach(metricDb => {
                    results[dp.id][metricDb]++;
                    results[dp.id].poi_data.push([
                        parseFloat(poi.coord[1].toFixed(PARSER_CONFIG.STATS.COORD_PRECISION)),
                        parseFloat(poi.coord[0].toFixed(PARSER_CONFIG.STATS.COORD_PRECISION)),
                        getShortType(metricDb),
                        'parser'
                    ]);
                });
                break;
            }
        }
    }

    Object.values(results).forEach(res => {
        const found = [];
        const zeroes = [];
        finalMetrics.forEach(m => {
            if (res[m.db] > 0) found.push(`${m.label}: ${res[m.db]}`);
            else zeroes.push(m.label);
        });
        logger(LOGS.OSM_SUCCESS(res.district_name, found.length, found.join(', '), zeroes.join(', ')), 'SUCCESS');
    });

    return results;
}