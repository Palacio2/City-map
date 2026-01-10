import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import slugify from 'slugify';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- НАЛАШТУВАННЯ ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getDistrictSlug(name) {
    return slugify(name, { 
        lower: true, 
        strict: true, 
        locale: 'pl' 
    });
}

async function scrapeDistrictPrices(browser, cityName, districtName) {
    const page = await browser.newPage();
    
    // Встановлюємо великий розмір екрану
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const citySlug = getDistrictSlug(cityName);     // bydgoszcz
    const districtSlug = getDistrictSlug(districtName); // fordon, blonie

    // 🔥 ВИПРАВЛЕННЯ URL:
    // 1. kujawsko--pomorskie (з двома дефісами, як ти помітив)
    // 2. 3 рази місто (bydgoszcz/bydgoszcz/bydgoszcz)
    const url = `https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/kujawsko--pomorskie/${citySlug}/${citySlug}/${citySlug}/${districtSlug}?limit=36&ownerTypeSingleSelect=ALL&by=DEFAULT&direction=DESC&viewType=listing`;

    console.log(`   🌍 Перевіряю URL: ${url}`); // <-- Тепер ми бачимо посилання в консолі

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 1. Пробуємо закрити кукі (вони часто заважають)
        try {
            const cookieBtn = await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
            if (cookieBtn) {
                await cookieBtn.click();
                await sleep(1000);
            }
        } catch (e) {}

        // 2. Перевірка заголовка на 404
        const title = await page.title();
        const noResults = await page.$('[data-cy="no-search-results"]');
        
        if (title.includes("404") || title.includes("Nie znaleziono") || noResults) {
            console.warn(`   ⚠️ Сторінка не містить оголошень або 404.`);
            // Не закриваємо сторінку одразу, щоб ти міг глянути (якщо дивишся на екран)
            await sleep(2000); 
            await page.close();
            return null;
        }

        // 3. Чекаємо завантаження оголошень
        await page.waitForSelector('article', { timeout: 15000 });

        // 4. Збираємо ціни
        const prices = await page.evaluate(() => {
            const items = document.querySelectorAll('article');
            const data = [];

            items.forEach(item => {
                const text = item.innerText; 
                // Шукаємо ціну: "10 500 zł/m²"
                const match = text.match(/([0-9\s]+)\s*zł\/m²/);
                
                if (match && match[1]) {
                    const cleanPrice = parseInt(match[1].replace(/\s/g, ''));
                    // Фільтр: відкидаємо ціни менше 1000 (помилкові) і більше 50000 (гаражі/помилки)
                    if (!isNaN(cleanPrice) && cleanPrice > 1000 && cleanPrice < 100000) { 
                        data.push(cleanPrice);
                    }
                }
            });
            return data;
        });

        await page.close();

        if (prices.length === 0) return null;

        const sum = prices.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / prices.length);

        return {
            avgPriceSqm: avg,
            listingsCount: prices.length
        };

    } catch (e) {
        console.error(`   ❌ Помилка: ${e.message.split('\n')[0]}`);
        if (!page.isClosed()) await page.close();
        return null;
    }
}

async function main() {
    console.log("🚀 START: Парсинг цін OTODOM (Visual Mode)...");

    // 🔥 ВМИКАЄМО ВИДИМИЙ БРАУЗЕР
    const browser = await puppeteer.launch({
        headless: false, // <-- ТИ ПОБАЧИШ ВІКНО БРАУЗЕРА
        defaultViewport: null, // Відкрити на повний екран
        args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const { data: districts, error } = await supabase
        .from('districts')
        .select('id, name, cities!inner(name)')
        .eq('is_available', true);

    if (error) {
        console.error("❌ Помилка БД:", error);
        return;
    }

    console.log(`Черга: ${districts.length} районів.`);

    for (const district of districts) {
        const cityName = district.cities.name;
        const districtName = district.name;

        console.log(`\n📍 [${cityName}] Район: ${districtName}`);

        const marketData = await scrapeDistrictPrices(browser, cityName, districtName);

        if (marketData) {
            console.log(`   💰 ЦІНА: ${marketData.avgPriceSqm} zł/m² (оголошень: ${marketData.listingsCount})`);

            const { error } = await supabase
                .from('district_filter_data')
                .update({ 
                    average_property_price: marketData.avgPriceSqm,
                })
                .eq('district_id', district.id);
            
            if (error) console.error("   ❌ Помилка запису:", error.message);
            else console.log("   ✅ Збережено в БД");
        } else {
            console.warn("   💨 Дані не отримано.");
        }
        
        // Пауза між районами
        await sleep(3000);
    }

    await browser.close();
    console.log("\n🏁 DONE!");
}

main();