import { getCountryAdapter } from '../../countries/index.js';
import { launchBrowser } from '../browser.js';
import { LOGS } from '../../config/logTemplates.js';
import pLimit from 'p-limit';
import retry from 'async-retry';

export const scraperAdapter = {
    async fetchData(config, fields, logger) {
        const results = {};
        const adapter = getCountryAdapter(config.countryCode);
        
        if (!adapter) {
            logger.log(`[SCRAPER] ❌ Не знайдено адаптер для країни ${config.countryCode}`, 'ERROR');
            return results;
        }

        // Обмежуємо паралельність до 3 браузерів одночасно, щоб не перевантажити сервер і не отримати бан
        const limit = pLimit(3);
        const tasks = config.districtsData.map(d => limit(async () => {
            const url = config.propertyUrls?.[d.district_id] || config.otodomUrls?.[d.district_id];
            
            if (!url || url === '#') {
                logger.log(`[SCRAPER] ⚠️ Пропущено ${d.name}: немає URL для парсингу`, 'WARNING');
                return;
            }

            await retry(async (bail, attempt) => {
                let browser = null;
                try {
                    if (attempt > 1) {
                        logger.log(`[SCRAPER] 🔄 Спроба ${attempt} для ${d.name} за URL: ${url}`, 'INFO');
                    } else {
                        logger.log(`[SCRAPER] 🌐 Запуск браузера для ${d.name} за URL: ${url}`, 'INFO');
                    }
                    
                    browser = await launchBrowser();
                    const stats = await adapter.scrapeProperty(browser, url);
                    results[d.district_id] = stats;
                    
                    const logMsg = adapter.formatPropertyLog(stats.sale, stats.rent);
                    if (logMsg) {
                        logger.log(LOGS.PROP_SUCCESS(d.name, logMsg), 'SUCCESS');
                    } else {
                        logger.log(`[SCRAPER] ⚠️ Парсер відпрацював, але ціни для ${d.name} дорівнюють нулю.`, 'WARNING');
                    }
                } catch (e) {
                    logger.log(`[SCRAPER] ❌ Помилка на спробі ${attempt} для ${d.name}: ${e.message}`, 'ERROR');
                    throw e; // Прокидаємо помилку для async-retry
                } finally {
                    if (browser) await browser.close();
                }
            }, {
                retries: 2,           // Максимум 3 спроби (1 початкова + 2 повторних)
                factor: 2,            // Експоненційне збільшення часу (2s, 4s, 8s...)
                minTimeout: 2000,
                maxTimeout: 10000
            }).catch(e => {
                logger.log(`[SCRAPER] 🛑 Усі спроби для ${d.name} вичерпані. Останній збій: ${e.message}`, 'ERROR');
            });
        }));

        await Promise.all(tasks);
        return results;
    }
};