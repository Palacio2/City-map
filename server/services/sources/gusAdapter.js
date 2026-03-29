import { getCountryAdapter } from '../../countries/index.js';
import { LOGS } from '../../config/logTemplates.js';

export const gusAdapter = {
    async fetchData(config, fields, logger) {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const adapter = getCountryAdapter(config.countryCode);
            const stats = await adapter.getMacroStats(config.cityName);
            logger.log(LOGS.MACRO_SUCCESS(stats.salary, stats.density), 'SUCCESS');
            return stats;
        } catch (e) {
            logger.log(`GUS API Error: ${e.message}`, 'ERROR');
            return { salary: 0, density: 0 };
        }
    }
};