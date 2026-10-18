import { parserHttp } from '../../services/parserHttp.js';
import { PARSER_CONFIG } from '../../config/parserConfig.js';

const BDL_VARS = {
    SALARY: 64428,
    UNEMPLOYMENT: 60270,
    DENSITY: 60559,
    POPULATION: 1645341
};

export const fetchCityMacroStats = async (cityName) => {
    if (!cityName) return {};
    
    try {
        const searchUrl = PARSER_CONFIG.API.BDL_UNITS_URL(cityName);
        const searchRes = await parserHttp.get(searchUrl, { timeout: 8000 });
        
        if (!searchRes.data?.results?.length) {
            throw new Error("Місто не знайдено в базі BDL");
        }

        const powiatUnit = searchRes.data.results.find(u => u.level === 5) || searchRes.data.results[0];
        const gminaUnit = searchRes.data.results.find(u => u.level === 6) || powiatUnit;
        
        const getVar = async (varId, unitId) => {
            try {
                const url = PARSER_CONFIG.API.BDL_DATA_URL(unitId, varId);
                const res = await parserHttp.get(url, { timeout: 6000 });
                const values = res.data?.results?.[0]?.values;
                if (values && values.length > 0) {
                    const latest = values.reduce((prev, current) => (prev.year > current.year) ? prev : current);
                    if (latest.val == null || latest.val === '') return null;
                    const value = Number(latest.val);
                    return Number.isFinite(value) && value >= 0 ? value : null;
                }
                return null;
            } catch(e) {
                return null;
            }
        };

        const [salary, unemployment, density, populationThousands] = await Promise.all([
            getVar(BDL_VARS.SALARY, powiatUnit.id),
            getVar(BDL_VARS.UNEMPLOYMENT, powiatUnit.id),
            getVar(BDL_VARS.DENSITY, gminaUnit.id),
            getVar(BDL_VARS.POPULATION, gminaUnit.id)
        ]);

        const population = populationThousands == null ? null : populationThousands * 1000;

        let utilities_cost = salary > 0 ? 12 : null;
        if (salary > 8500) utilities_cost = 16;
        else if (salary > 7500) utilities_cost = 14;
        else if (salary < 6000 && salary > 0) utilities_cost = 10;

        return { 
            salary: salary == null ? null : Math.round(salary),
            unemployment,
            population: population == null ? null : Math.round(population),
            density,
            utilities_cost: utilities_cost
        };
    } catch (error) {
        console.error(`[GUS ERROR] Помилка BDL API: ${error.message}`);
        return {};
    }
};
