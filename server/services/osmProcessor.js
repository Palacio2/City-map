import fs from "fs";
import OsmPbfParser from "osm-pbf-parser";
import through from "through2";
import * as turf from "@turf/turf";
import axios from "axios";
import { ALL_METRICS } from "../config/osmMetrics.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const generateId = () => Math.random().toString(36).substring(2, 11);

async function executeOverpassQueryWithRetry(query, logger, retries = 3, delay = 4000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.post('https://overpass-api.de/api/interpreter', query, { 
                headers: { 'Content-Type': 'text/plain' },
                timeout: 90000 
            });
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            const isLastAttempt = i === retries - 1;
            if (isLastAttempt) throw error;
            if (status === 400) throw error; 
            if (status === 429) {
                await sleep(delay * 2); 
            } else {
                await sleep(delay);
            }
        }
    }
}

function stitchWays(ways) {
    if (!ways || !ways.length) return null;
    let pool = [...ways];
    let ring = [...pool.shift()];
    
    let iterations = 0; 
    const maxIterations = pool.length * 2;

    while (pool.length > 0 && iterations < maxIterations) {
        iterations++;
        let lastPt = ring[ring.length - 1];
        let firstPt = ring[0];
        let found = false;
        for (let i = 0; i < pool.length; i++) {
            let seg = pool[i];
            let segFirst = seg[0];
            let segLast = seg[seg.length - 1];
            
            if (lastPt[0] === segFirst[0] && lastPt[1] === segFirst[1]) {
                ring.push(...seg.slice(1));
                pool.splice(i, 1); found = true; break;
            } else if (lastPt[0] === segLast[0] && lastPt[1] === segLast[1]) {
                ring.push(...seg.slice(0, -1).reverse());
                pool.splice(i, 1); found = true; break;
            } else if (firstPt[0] === segLast[0] && firstPt[1] === segLast[1]) {
                ring.unshift(...seg.slice(0, -1));
                pool.splice(i, 1); found = true; break;
            } else if (firstPt[0] === segFirst[0] && firstPt[1] === segFirst[1]) {
                ring.unshift(...seg.slice(1).reverse());
                pool.splice(i, 1); found = true; break;
            }
        }
        if (!found) break;
    }
    
    if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
        ring.push(ring[0]);
    }
    if (ring.length < 4) return null;
    return [ring];
}

async function fetchBoundariesWithFallback(cityName, districtNames, logger) {
    const polygons = [];
    const missing = new Set(districtNames);
    const namesRegex = Array.from(missing).join('|');
    
    const strictQuery = `[out:json][timeout:90];area["name"="${cityName}"]["admin_level"~"6|7|8"]->.city;relation["boundary"="administrative"]["name"~"^(${namesRegex})$",i](area.city);out geom;`;
    try {
        const resStrict = await executeOverpassQueryWithRetry(strictQuery, logger);
        if (resStrict && resStrict.elements) processOverpassData(resStrict.elements, polygons, missing);
    } catch (e) {}
    
    if (missing.size > 0) {
        const looseRegex = Array.from(missing).join('|');
        const looseQuery = `[out:json][timeout:90];area["name"="${cityName}"]["admin_level"~"6|7|8"]->.city;(relation["name"~"(${looseRegex})",i](area.city);way["name"~"(${looseRegex})",i](area.city););out geom;`;
        try {
            const resLoose = await executeOverpassQueryWithRetry(looseQuery, logger);
            if (resLoose && resLoose.elements) processOverpassData(resLoose.elements, polygons, missing, true);
        } catch (e) {}
    }
    return polygons;
}

function processOverpassData(elements, polygonsArray, missingSet, isFuzzy = false) {
    for (const el of elements) {
        const name = el.tags?.name;
        if (!name) continue;
        let matchedName = null;
        if (isFuzzy) {
            for (const missingName of missingSet) {
                if (name.toLowerCase().includes(missingName.toLowerCase())) {
                    matchedName = missingName;
                    break;
                }
            }
        } else { 
            if (missingSet.has(name)) matchedName = name;
        }
        if (!matchedName) continue;
        
        let ways = [];
        if (el.type === 'relation' && el.members) {
            for (const m of el.members) {
                if (m.type === 'way' && m.geometry) ways.push(m.geometry.map(g => [g.lon, g.lat]));
            }
        } else if (el.type === 'way' && el.geometry) { 
            ways.push(el.geometry.map(g => [g.lon, g.lat]));
        }
        
        try {
            const stitched = stitchWays(ways);
            let poly;
            if (stitched && stitched[0].length >= 4) poly = turf.polygon(stitched);
            else if (ways.length > 0) {
                const allPts = ways.flat();
                if (allPts.length >= 3) poly = turf.convex(turf.multiPoint(allPts));
            }
            if (poly) {
                poly.properties = { name: matchedName };
                poly.bbox = turf.bbox(poly);
                polygonsArray.push(poly);
                missingSet.delete(matchedName);
            }
        } catch(e) {}
    }
}

export async function processLocalOsmData(filePath, districtNames, cityName, selectedMetricsArray = null, logger = console.log) {
    const activeMetrics = selectedMetricsArray && selectedMetricsArray.length > 0
        ? ALL_METRICS.filter(m => selectedMetricsArray.includes(m.db))
        : ALL_METRICS;
        
    const districtPolygons = await fetchBoundariesWithFallback(cityName, districtNames, logger);
    if (districtPolygons.length === 0) return {};
    
    const amenityWays = [];
    const neededNodeIds = new Set();
    
    await new Promise((resolve, reject) => {
        const parser = new OsmPbfParser();
        fs.createReadStream(filePath).pipe(parser).pipe(through.obj(function (items, enc, next) {
            for (const item of items) {
                if (item.type === 'way' && item.tags && activeMetrics.some(m => m.filter(item))) {
                    const refs = item.nodeRefs || item.refs || [];
                    amenityWays.push({ tags: item.tags, refs: [...refs] });
                    refs.forEach(r => neededNodeIds.add(String(r)));
                }
            }
            next();
        })).on('finish', resolve).on('error', reject);
    });
    
    const finalPois = [];
    const nodeCoords = new Map();
    
    await new Promise((resolve, reject) => {
        const parser = new OsmPbfParser();
        fs.createReadStream(filePath).pipe(parser).pipe(through.obj(function (items, enc, next) {
            for (const item of items) {
                if (item.type === 'node') {
                    const nId = String(item.id);
                    if (neededNodeIds.has(nId)) nodeCoords.set(nId, [item.lon, item.lat]);
                    if (item.tags) {
                        const matchedMetrics = activeMetrics.filter(m => m.filter(item)).map(m => m.db);
                        if (matchedMetrics.length > 0) {
                            finalPois.push({ tags: item.tags, coord: [item.lon, item.lat], matchedMetrics });
                        }
                    }
                }
            }
            next();
        })).on('finish', resolve).on('error', reject);
    });

    for (const way of amenityWays) {
        let lonSum = 0, latSum = 0, valid = 0;
        for (const ref of way.refs) {
            const coord = nodeCoords.get(String(ref));
            if (coord) { lonSum += coord[0]; latSum += coord[1]; valid++; }
        }
        if (valid > 0) {
            const matchedMetrics = activeMetrics.filter(m => m.filter(way)).map(m => m.db);
            if (matchedMetrics.length > 0) {
                finalPois.push({ tags: way.tags, coord: [lonSum / valid, latSum / valid], matchedMetrics });
            }
        }
    }
    
    nodeCoords.clear();
    neededNodeIds.clear();
    
    const results = {};
    
    districtPolygons.forEach(dp => {
        const center = turf.centroid(dp);
        results[dp.properties.name] = { 
            center: { lat: center.geometry.coordinates[1], lon: center.geometry.coordinates[0] },
            geojson: dp,
            bbox: dp.bbox,
            parsed_pois: []
        };
        activeMetrics.forEach(m => results[dp.properties.name][m.db] = 0);
    });
    
    for (const poi of finalPois) {
        const pt = turf.point(poi.coord);
        for (const dp of districtPolygons) {
            const [minX, minY, maxX, maxY] = dp.bbox;
            if (poi.coord[0] < minX || poi.coord[0] > maxX || poi.coord[1] < minY || poi.coord[1] > maxY) continue;
            
            if (turf.booleanPointInPolygon(pt, dp)) {
                poi.matchedMetrics.forEach(metricDb => {
                    results[dp.properties.name][metricDb]++;
                    results[dp.properties.name].parsed_pois.push({
                        id: generateId(),
                        coord: poi.coord,
                        type: metricDb,
                        source: 'parser'
                    });
                });
                break; 
            }
        }
    }
    return results;
}