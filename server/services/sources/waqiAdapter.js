import { getAirQualityWAQI } from '../waqiService.js';
import * as turf from "@turf/turf";
import { LOGS } from '../../config/logTemplates.js';

export const waqiAdapter = {
    async fetchData(config, fields, logger) {
        const results = {};
        for (const d of config.districtsData) {
            if (d.geojson) {
                const bbox = turf.bbox(d.geojson);
                const lat = (bbox[1] + bbox[3]) / 2;
                const lon = (bbox[0] + bbox[2]) / 2;
                const waqi = await getAirQualityWAQI(lat, lon);
                results[d.district_id] = waqi;
                logger.log(LOGS.AQI_SUCCESS(d.name, waqi.aqi), 'SUCCESS');
            }
        }
        return results;
    }
};