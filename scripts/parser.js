import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- НАЛАШТУВАННЯ ШЛЯХІВ ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Помилка: Не знайдено змінні VITE_SUPABASE_URL або VITE_SUPABASE_ANON_KEY в .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Функція паузи
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 1. ОТРИМАННЯ ID РАЙОНУ ---
async function getDistrictAreaId(cityName, districtName) {
    const queries = [
        `${districtName}, ${cityName}`,
        `${districtName} district, ${cityName}`,
        `Dzielnica ${districtName}, ${cityName}`, 
        `Osiedle ${districtName}, ${cityName}`,
        `Район ${districtName}, ${cityName}`,
        `${cityName} ${districtName}`
    ];

    for (const q of queries) {
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json`;
            const { data } = await axios.get(url, { headers: { 'User-Agent': 'CityMapsParser/1.0' } });

            if (data && data.length > 0) {
                let bestMatch = data.find(item => item.osm_type === 'relation') || 
                                data.find(item => item.osm_type === 'way');

                if (bestMatch) {
                    const baseId = parseInt(bestMatch.osm_id);
                    if (bestMatch.osm_type === 'relation') return 3600000000 + baseId;
                    if (bestMatch.osm_type === 'way') return 2400000000 + baseId;
                }
            }
            await sleep(1000); 
        } catch (e) {
             // ігноруємо помилки пошуку
        }
    }
    return null;
}

// --- 2. ФУНКЦІЯ ЗАПИТУ З RE-TRY ТА ЗБІЛЬШЕНИМ ТАЙМ-АУТОМ ---
async function fetchWithRetry(query, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            // Збільшено timeout axios до 15 хвилин (900000 мс)
            const { data } = await axios.post(OVERPASS_URL, query, { timeout: 900000 }); 
            return data;
        } catch (error) {
            const status = error.response ? error.response.status : null;
            
            if (status === 429) {
                console.warn(`   ⏳ Overpass 429 (Too Many Requests). Чекаємо 30с... (Спроба ${i + 1}/${retries})`);
                await sleep(30000); // Чекаємо 30 секунд
            } else if (status === 504 || error.code === 'ECONNABORTED') {
                console.warn(`   🐢 Overpass Timeout. Чекаємо 15с... (Спроба ${i + 1}/${retries})`);
                await sleep(15000);
            } else {
                console.error(`   ❌ Overpass Error: ${error.message}`);
                return null; 
            }
        }
    }
    console.error(`   ❌ Не вдалося отримати дані після ${retries} спроб.`);
    return null;
}

// --- 3. ОТРИМАННЯ СТАТИСТИКИ ---
async function fetchStatsFromOverpass(areaId) {
    // Збільшено timeout Overpass до 900 секунд (15 хвилин)
    const query = `
        [out:json][timeout:900];
        area(${areaId})->.searchArea;
        (
            nwr["amenity"="school"](area.searchArea);
            nwr["amenity"="kindergarten"](area.searchArea);
            nwr["amenity"="university"](area.searchArea);
            nwr["amenity"="college"](area.searchArea);
            
            nwr["amenity"="hospital"](area.searchArea);
            nwr["amenity"="clinic"](area.searchArea);
            nwr["amenity"="doctors"](area.searchArea);
            nwr["amenity"="pharmacy"](area.searchArea);
            nwr["emergency"="ambulance_station"](area.searchArea);
            
            nwr["leisure"="park"](area.searchArea);
            nwr["leisure"="playground"](area.searchArea);
            nwr["leisure"="sports_centre"](area.searchArea);
            nwr["leisure"="stadium"](area.searchArea);
            
            nwr["highway"="bus_stop"](area.searchArea);
            nwr["railway"="tram_stop"](area.searchArea);
            nwr["station"="subway"](area.searchArea);
            nwr["amenity"="parking"](area.searchArea);
            
            nwr["amenity"="cafe"](area.searchArea);
            nwr["amenity"="restaurant"](area.searchArea);
            nwr["amenity"="bar"](area.searchArea);
            
            nwr["amenity"="library"](area.searchArea);
            nwr["amenity"="cinema"](area.searchArea);
            nwr["amenity"="theatre"](area.searchArea);
            nwr["tourism"="museum"](area.searchArea);
            
            nwr["amenity"="police"](area.searchArea);
            nwr["man_made"="surveillance"](area.searchArea);
            
            nwr["shop"="supermarket"](area.searchArea);
            nwr["shop"="convenience"](area.searchArea);
            nwr["shop"="mall"](area.searchArea);
            nwr["amenity"="bank"](area.searchArea);
            nwr["amenity"="atm"](area.searchArea);
            nwr["amenity"="post_office"](area.searchArea);
            
            nwr["shop"="doityourself"](area.searchArea);
            nwr["shop"="hardware"](area.searchArea);
            nwr["shop"="clothes"](area.searchArea);
            nwr["shop"="beauty"](area.searchArea);
            nwr["shop"="hairdresser"](area.searchArea);
        );
        out tags;
    `;

    const data = await fetchWithRetry(query);
    if (!data) return null;

    const elements = data.elements;
    
    const stats = {
        schools_count: 0, kindergartens_count: 0, universities_count: 0,
        hospitals_count: 0, clinics_count: 0, pharmacies_count: 0, emergency_services_count: 0,
        bus_stops_count: 0, tram_stops_count: 0, metro_stations_count: 0, parking_spots_count: 0,
        parks_count: 0, playgrounds_count: 0, sports_facilities_count: 0,
        cafes_restaurants_count: 0, libraries_count: 0, cinemas_count: 0, theaters_count: 0, museums_count: 0,
        police_stations_count: 0, cctv_count: 0,
        grocery_stores_count: 0, shopping_malls_count: 0, banks_atms_count: 0, post_offices_count: 0,
        construction_stores_count: 0, clothing_stores_count: 0, beauty_salons_count: 0
    };

    elements.forEach(el => {
        const t = el.tags || {};
        
        if (t.amenity === 'school') stats.schools_count++;
        if (t.amenity === 'kindergarten') stats.kindergartens_count++;
        if (t.amenity === 'university' || t.amenity === 'college') stats.universities_count++;
        
        if (t.amenity === 'hospital') stats.hospitals_count++;
        if (t.amenity === 'clinic' || t.amenity === 'doctors') stats.clinics_count++;
        if (t.amenity === 'pharmacy') stats.pharmacies_count++;
        if (t.emergency === 'ambulance_station') stats.emergency_services_count++;
        
        if (t.leisure === 'park') stats.parks_count++;
        if (t.leisure === 'playground') stats.playgrounds_count++;
        if (['sports_centre', 'stadium'].includes(t.leisure)) stats.sports_facilities_count++;
        if (['cafe', 'restaurant', 'bar', 'pub'].includes(t.amenity)) stats.cafes_restaurants_count++;
        
        if (t.amenity === 'library') stats.libraries_count++;
        if (t.amenity === 'cinema') stats.cinemas_count++;
        if (['theatre', 'arts_centre'].includes(t.amenity)) stats.theaters_count++;
        if (t.tourism === 'museum') stats.museums_count++;

        if (t.highway === 'bus_stop') stats.bus_stops_count++;
        if (t.railway === 'tram_stop') stats.tram_stops_count++;
        if (t.station === 'subway' || t.railway === 'station') stats.metro_stations_count++;
        if (t.amenity === 'parking') stats.parking_spots_count++;
        
        if (t.amenity === 'police') stats.police_stations_count++;
        if (t.man_made === 'surveillance') stats.cctv_count++;

        if (['supermarket', 'convenience'].includes(t.shop)) stats.grocery_stores_count++;
        if (t.shop === 'mall') stats.shopping_malls_count++;
        if (['bank', 'atm'].includes(t.amenity)) stats.banks_atms_count++;
        if (t.amenity === 'post_office') stats.post_offices_count++;
        
        if (['doityourself', 'hardware'].includes(t.shop)) stats.construction_stores_count++;
        if (t.shop === 'clothes') stats.clothing_stores_count++;
        if (['beauty', 'hairdresser'].includes(t.shop)) stats.beauty_salons_count++;
    });

    return stats;
}

// --- 4. РОЗРАХУНОК РЕЙТИНГІВ ---
function calculateRatings(s) {
    const norm = (val, max) => Math.min(Math.round((val / max) * 100) / 10, 10);
    const getLevel = (val, low, high) => val < low ? 'low' : (val > high ? 'high' : 'medium');

    return {
        education_rating: norm(s.schools_count + s.kindergartens_count + s.universities_count, 35),
        medicine_rating: norm(s.hospitals_count + s.clinics_count + s.pharmacies_count, 25),
        transport_rating: norm(s.bus_stops_count + s.tram_stops_count + (s.metro_stations_count * 5), 100),
        social_rating: norm(s.parks_count + s.cafes_restaurants_count + s.sports_facilities_count, 70),
        commerce_rating: norm(s.grocery_stores_count + s.shopping_malls_count + s.clothing_stores_count + s.beauty_salons_count, 60),
        safety_rating: norm(s.police_stations_count + s.cctv_count, 15),
        
        shops_density: getLevel(s.grocery_stores_count + s.clothing_stores_count, 10, 50),
        transport_frequency: getLevel(s.bus_stops_count + s.tram_stops_count, 15, 60),
        
        utilities_quality_rating: 7.5, 
        crime_level: 3.0, 
        street_lighting_rating: 6.0,
        average_property_price: 0
    };
}

async function main() {
    console.log("🚀 START: Парсинг даних для районів (v2 - increased timeouts)...");

    const { data: districts, error } = await supabase
        .from('districts')
        .select('id, name, cities!inner(name)')
        .eq('is_available', true);

    if (error) {
        console.error("❌ Помилка отримання районів з БД:", error.message);
        return;
    }

    console.log(`Знайдено районів: ${districts.length}`);

    for (const district of districts) {
        const cityName = district.cities.name;
        const districtName = district.name;

        console.log(`\n📍 [${cityName}] Район: ${districtName}`);

        const areaId = await getDistrictAreaId(cityName, districtName);
        
        if (!areaId) {
            console.warn(`⚠️ ПРОПУСК: Геометрію не знайдено.`);
            continue;
        }

        const stats = await fetchStatsFromOverpass(areaId);

        if (stats) {
            const ratings = calculateRatings(stats);

            const updateData = {
                district_id: district.id,
                ...stats,
                ...ratings,
                last_updated: new Date().toISOString()
            };

            const { error: upsertError } = await supabase
                .from('district_filter_data')
                .upsert(updateData, { onConflict: 'district_id' });

            if (upsertError) {
                console.error("❌ Помилка запису в БД:", upsertError.message);
            } else {
                console.log(`✅ Збережено! (Шкіл: ${stats.schools_count}, Магазинів: ${stats.grocery_stores_count})`);
            }
        }
        await sleep(5000); 
    }
    console.log("\n🏁 ПАРСИНГ ЗАВЕРШЕНО!");
}

main();