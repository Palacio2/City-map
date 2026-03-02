import axios from 'axios';
import 'dotenv/config';

export const getAirQualityWAQI = async (lat, lon) => {
    const token = process.env.WAQI_TOKEN;
    if (!token) return { aqi: 0 };

    try {
        const response = await axios.get(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`, {
            timeout: 5000 
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