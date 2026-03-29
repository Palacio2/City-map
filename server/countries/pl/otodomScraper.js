import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

puppeteer.use(StealthPlugin());

const delay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

export async function initScraper() {
    return await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });
}

export async function closeScraper(browser) {
    if (browser) await browser.close();
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 150 + Math.floor(Math.random() * 50);
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100 + Math.floor(Math.random() * 100));
        });
    });
}

function filterOutliers(arr) {
    if (arr.length < 4) return arr; 
    const values = [...arr].sort((a, b) => a - b);
    const q1 = values[Math.floor((values.length / 4))];
    const q3 = values[Math.floor((values.length * (3 / 4)))];
    const iqr = q3 - q1;
    const maxValue = q3 + iqr * 1.5;
    const minValue = q1 - iqr * 1.5;
    return values.filter(x => x >= minValue && x <= maxValue);
}

export async function scrapePage(browser, baseUrl, type = 'sale', maxPages = 2, countryCode = 'PL', platform = 'otodom') {
    let page;
    let rawPrices = [];
    let rawSqmPrices = [];

    const { data: rule, error } = await supabase
        .from('scraper_rules')
        .select('*')
        .eq('country_code', countryCode)
        .eq('platform', platform)
        .eq('type', type)
        .eq('is_active', true)
        .single();

    if (error || !rule) {
        return { avgPrice: 0, avgSqm: 0 };
    }

    try {
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });
        
        for (let i = 1; i <= maxPages; i++) {
            let url = baseUrl.includes('?') ? `${baseUrl}&page=${i}` : `${baseUrl}?page=${i}`;
            if (platform === 'otodom' && !url.includes('ownerTypeSingleFamily')) url += '&limit=72'; 

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            if (i === 1 && platform === 'otodom') {
                try {
                    await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 4000 });
                    await page.click('#onetrust-accept-btn-handler');
                } catch (e) {}
            }

            await delay(1000, 2000);
            await autoScroll(page);

            const data = await page.evaluate((r) => {
                const articles = document.querySelectorAll(r.item_selector);
                const prices = [];
                const sqm = [];
                const priceRegex = new RegExp(r.price_regex);
                const sqmRegex = r.sqm_regex ? new RegExp(r.sqm_regex) : null;

                articles.forEach(article => {
                    const text = article.innerText.replace(/\u00A0/g, ' ').replace(/\n/g, ' ').toLowerCase();

                    if (r.type === 'sale') {
                        const sqmMatch = sqmRegex ? text.match(sqmRegex) : null;
                        const priceMatch = text.match(priceRegex);
                        
                        if (priceMatch && sqmMatch) {
                            const p = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'));
                            const s = parseFloat(sqmMatch[1].replace(/\s/g, '').replace(',', '.'));
                            
                            if (p >= r.min_price && p <= r.max_price && s >= r.min_sqm && s <= r.max_sqm) {
                                prices.push(p);
                                sqm.push(s);
                            }
                        }
                    } else {
                        const priceMatch = text.match(priceRegex);
                        if (priceMatch) {
                            const p = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'));
                            if (p >= r.min_price && p <= r.max_price) {
                                prices.push(p);
                            }
                        }
                    }
                });
                return { prices, sqm };
            }, rule);

            if (data.prices.length === 0) break;
            rawPrices.push(...data.prices);
            rawSqmPrices.push(...data.sqm);
            
            await delay(1000, 3000);
        }

        const filteredPrices = filterOutliers(rawPrices);
        const filteredSqm = filterOutliers(rawSqmPrices);

        const calculateMedian = (arr) => {
            if (arr.length === 0) return 0;
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        };

        return {
            avgPrice: Math.round(calculateMedian(filteredPrices)),
            avgSqm: type === 'sale' ? Math.round(calculateMedian(filteredSqm)) : 0
        };
    } catch (e) {
        return { avgPrice: 0, avgSqm: 0 };
    } finally {
        if (page) await page.close(); 
    }
}