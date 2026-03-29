// server/services/waqiService.js
import axios from 'axios';
import 'dotenv/config';
import { PARSER_CONFIG } from '../config/parserConfig.js';

export const getAirQualityWAQI = async (lat, lon) => {
    const token = process.env.WAQI_TOKEN;
    if (!token) return { aqi: 0 };

    try {
        const url = PARSER_CONFIG.API.WAQI_URL(lat, lon, token);
        const response = await axios.get(url, {
            timeout: PARSER_CONFIG.TIMEOUTS.WAQI_API 
        });

        if (response.data && response.data.status === 'ok') {
            const aqi = response.data.data.aqi;
            if (aqi === '-') return { aqi: 0 };
            return { aqi: parseInt(aqi, 10) || 0 };
        }
        
        return { aqi: 0 };
    } catch (error) {
        return { aqi: 0 };
    }
};