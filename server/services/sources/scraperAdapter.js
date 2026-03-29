import { getCountryAdapter } from '../../countries/index.js';
import { launchBrowser } from '../browser.js';
import { LOGS } from '../../config/logTemplates.js';

export const scraperAdapter = {
    async fetchData(config, fields, logger) {
        const results = {};
        const adapter = getCountryAdapter(config.countryCode);
        
        for (const d of config.districtsData) {
            const url = config.otodomUrls?.[d.district_id];
            if (!url || url === '#') continue;

            let browser = null;
            try {
                browser = await launchBrowser();
                const stats = await adapter.scrapeProperty(browser, url);
                results[d.district_id] = stats;
                
                const logMsg = adapter.formatPropertyLog(stats.sale, stats.rent);
                if (logMsg) logger.log(LOGS.PROP_SUCCESS(d.name, logMsg), 'SUCCESS');
            } catch (e) {
                logger.log(LOGS.ERR_STEP(`Scraping [${d.name}]`, e.message), 'ERROR');
            } finally {
                if (browser) await browser.close();
            }
        }
        return results;
    }
};