/**
 * Ukraine Adapter - MOCKUP
 * 
 * This adapter returns placeholder data for Ukrainian cities.
 * It is a planned feature for when the app gains popularity.
 * TODO: Replace with real API integration (e.g., Derzhstat API).
 */

const MOCKUP_WARNING = '[UA ADAPTER] ⚠️ Using mockup data. Real API not yet integrated.';

export const uaAdapter = {
    getMacroStats: async (cityName) => {
        console.warn(MOCKUP_WARNING);
        return {
            salary: 18500, 
            unemployment: 12.5,
            density: 3500,
            population: 1000000,
            utilities_cost: 45 
        };
    },
    
    scrapeProperty: async (browser, url, retryCount = 1) => {
        console.warn(MOCKUP_WARNING);
        return {
            sale: { avgPrice: 2500000, avgSqm: 45000 },
            rent: { avgPrice: 15000, avgSqm: 350 }
        };
    },

    formatPropertyLog: (saleStats, rentStats) => {
        if (saleStats?.avgPrice > 0 || rentStats?.avgPrice > 0) {
            return `Продаж: ${saleStats.avgPrice}₴ | Оренда: ${rentStats.avgPrice}₴ (MOCKUP - дані не реальні)`;
        }
        return null;
    }
};