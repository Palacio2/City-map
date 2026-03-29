export const uaAdapter = {
    getMacroStats: async (cityName) => {
        return {
            salary: 18500, 
            unemployment: 12.5,
            density: 3500,
            population: 1000000,
            utilities_cost: 45 
        };
    },
    
    scrapeProperty: async (browser, url, retryCount = 1) => {
        return {
            sale: { avgPrice: 2500000, avgSqm: 45000 },
            rent: { avgPrice: 15000, avgSqm: 350 }
        };
    },

    formatPropertyLog: (saleStats, rentStats) => {
        if (saleStats?.avgPrice > 0 || rentStats?.avgPrice > 0) {
            return `Продаж: ${saleStats.avgPrice}₴ | Оренда: ${rentStats.avgPrice}₴ (LUN Mockup)`;
        }
        return null;
    }
};