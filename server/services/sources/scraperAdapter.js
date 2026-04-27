import { getCountryAdapter } from '../../countries/index.js';
import { launchBrowser } from '../browser.js';
import { LOGS } from '../../config/logTemplates.js';

export const scraperAdapter = {
    async fetchData(config, fields, logger) {
        const results = {};
        const adapter = getCountryAdapter(config.countryCode);
        
        if (!adapter) {
            logger.log(`[SCRAPER] ❌ Не знайдено адаптер для країни ${config.countryCode}`, 'ERROR');
            return results;
        }

        for (const d of config.districtsData) {
            // Беремо URL або з нового формату (propertyUrls) або зі старого (otodomUrls)
            const url = config.propertyUrls?.[d.district_id] || config.otodomUrls?.[d.district_id];
            
            if (!url || url === '#') {
                logger.log(`[SCRAPER] ⚠️ Пропущено ${d.name}: немає URL для парсингу`, 'WARNING');
                continue;
            }

            let browser = null;
            try {
                logger.log(`[SCRAPER] 🌐 Запуск браузера для ${d.name} за URL: ${url}`, 'INFO');
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
                logger.log(`[SCRAPER] ❌ Помилка: ${e.message}`, 'ERROR');
            } finally {
                if (browser) await browser.close();
            }
        }
        return results;
    }
};