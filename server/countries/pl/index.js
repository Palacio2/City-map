import { fetchCityMacroStats } from "./gusService.js";
import { scrapePage } from "./otodomScraper.js";
import { PARSER_CONFIG } from "../../config/parserConfig.js";

export const plAdapter = {
    getMacroStats: async (cityName) => {
        return await fetchCityMacroStats(cityName);
    },
    
    scrapeProperty: async (browser, url, retryCount = PARSER_CONFIG.TIMEOUTS.RETRY_SCRAPING) => {
        if (!url || url === '#') return { sale: {}, rent: {} };
        const rentUrl = url.replace('/sprzedaz/', '/wynajem/');
        const saleStats = await scrapePage(browser, url, 'sale', retryCount);
        const rentStats = await scrapePage(browser, rentUrl, 'rent', retryCount);
        return { sale: saleStats, rent: rentStats };
    },

    formatPropertyLog: (saleStats, rentStats) => {
        if (saleStats?.avgPrice > 0 || rentStats?.avgPrice > 0) {
            return `Продаж: ${saleStats.avgPrice}zł | Оренда: ${rentStats.avgPrice}zł`;
        }
        return null;
    }
};