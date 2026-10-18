import { getCountryAdapter } from '../../countries/index.js';
import { launchBrowser } from '../browser.js';
import { LOGS } from '../../config/logTemplates.js';
import pLimit from 'p-limit';
import retry from 'async-retry';
import { assertPropertyUrl } from '../outboundPolicy.js';

export const scraperAdapter = {
    async fetchData(config, fields, logger) {
        const results = {};
        const adapter = getCountryAdapter(config.countryCode);

        if (!adapter) {
            logger.log(`[SCRAPER] ❌ Не знайдено адаптер для країни ${config.countryCode}`, 'ERROR');
            return results;
        }

        // Validate persisted jobs as well as HTTP input, before starting Chromium.
        for (const district of config.districtsData) {
            const url = config.propertyUrls?.[district.district_id] || config.otodomUrls?.[district.district_id];
            if (url && url !== '#') assertPropertyUrl(url);
        }
        let browser = null;
        try {
            logger.log(`[SCRAPER] 🌐 Запуск єдиного браузера для всіх районів...`, 'INFO');
            browser = await launchBrowser();

            // Обмежуємо паралельність до 3 вкладок одночасно
            const limit = pLimit(3);
            const tasks = config.districtsData.map(d => limit(async () => {
                const url = config.propertyUrls?.[d.district_id] || config.otodomUrls?.[d.district_id];

                if (!url || url === '#') {
                    logger.log(`[SCRAPER] ⚠️ Пропущено ${d.name}: немає URL для парсингу`, 'WARNING');
                    return;
                }

                await retry(async (bail, attempt) => {
                    let pageContext = null;
                    try {
                        if (attempt > 1) {
                            logger.log(`[SCRAPER] 🔄 Спроба ${attempt} для ${d.name} за URL: ${url}`, 'INFO');
                        }

                        // Створюємо ізольований контекст (incognito) для кожної вкладки
                        pageContext = await browser.createBrowserContext();
                        const stats = await adapter.scrapeProperty(pageContext, url);
                        results[d.district_id] = stats;

                        const logMsg = adapter.formatPropertyLog(stats.sale, stats.rent);
                        if (logMsg) {
                            logger.log(LOGS.PROP_SUCCESS(d.name, logMsg), 'SUCCESS');
                        } else {
                            logger.log(`[SCRAPER] ⚠️ Парсер відпрацював, але ціни для ${d.name} дорівнюють нулю.`, 'WARNING');
                        }
                    } catch (e) {
                        logger.log(`[SCRAPER] ❌ Помилка на спробі ${attempt} для ${d.name}: ${e.message}`, 'ERROR');
                        throw e;
                    } finally {
                        if (pageContext) await pageContext.close();
                    }
                }, {
                    retries: 2,
                    factor: 2,
                    minTimeout: 2000,
                    maxTimeout: 10000
                }).catch(e => {
                    logger.log(`[SCRAPER] 🛑 Усі спроби для ${d.name} вичерпані. Останній збій: ${e.message}`, 'ERROR');
                });
            }));

            await Promise.all(tasks);
        } catch (e) {
            logger.log(`[SCRAPER] 🛑 Критична помилка браузера: ${e.message}`, 'ERROR');
        } finally {
            if (browser) await browser.close();
        }
        return results;
    }
};
