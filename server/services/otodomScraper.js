import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const delay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

export async function initScraper() {
    return await puppeteer.launch({
        headless: true,
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

export async function scrapePage(browser, baseUrl, type = 'sale', maxPages = 2) {
    let page;
    let allPrices = [];
    let allSqmPrices = [];

    try {
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920 + Math.floor(Math.random() * 100), height: 1080 + Math.floor(Math.random() * 100) });
        
        for (let i = 1; i <= maxPages; i++) {
            const url = baseUrl.includes('?') ? `${baseUrl}&page=${i}` : `${baseUrl}?page=${i}`;
            
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            if (i === 1) {
                try {
                    await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 4000 });
                    await delay(500, 1500);
                    await page.click('#onetrust-accept-btn-handler');
                } catch (e) {}
            }

            await delay(1000, 2500);
            await autoScroll(page);
            await delay(1500, 3000);

            const stats = await page.evaluate((parseType) => {
                const articles = document.querySelectorAll('article');
                const prices = [];
                const sqmPrices = [];

                articles.forEach(article => {
                    const textClean = article.innerText.replace(/\u00A0/g, ' ').replace(/\n/g, ' ').toLowerCase();

                    if (parseType === 'sale') {
                        const sqmMatch = textClean.match(/([\d\s,]+)\s*z[lł]\s*\/\s*m/);
                        const priceMatch = textClean.match(/([\d\s,]+)\s*z[lł](?!\s*\/m)/);
                        
                        if (priceMatch && sqmMatch) {
                            const price = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'));
                            const sqmPrice = parseFloat(sqmMatch[1].replace(/\s/g, '').replace(',', '.'));
                            
                            if (price > 50000 && price < 5000000 && sqmPrice > 1000 && sqmPrice < 40000) {
                                prices.push(price);
                                sqmPrices.push(sqmPrice);
                            }
                        }
                    } else {
                        const priceMatch = textClean.match(/([\d\s,]+)\s*z[lł]/);
                        if (priceMatch) {
                            const price = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'));
                            if (price > 500 && price < 15000) prices.push(price);
                        }
                    }
                });
                return { prices, sqmPrices };
            }, type);

            if (stats.prices.length === 0) break;
            allPrices.push(...stats.prices);
            allSqmPrices.push(...stats.sqmPrices);
            
            await delay(2000, 4500);
        }

        const calculateMedian = (arr) => {
            if (arr.length === 0) return 0;
            arr.sort((a, b) => a - b);
            const mid = Math.floor(arr.length / 2);
            return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
        };

        return {
            avgPrice: Math.round(calculateMedian(allPrices)),
            avgSqm: type === 'sale' ? Math.round(calculateMedian(allSqmPrices)) : 0
        };
    } catch (e) {
        return { avgPrice: 0, avgSqm: 0 };
    } finally {
        if (page && !page.isClosed()) await page.close(); 
    }
}