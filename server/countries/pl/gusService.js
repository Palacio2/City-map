import axios from 'axios';
import { PARSER_CONFIG } from '../../config/parserConfig.js';

const BDL_VARS = {
    SALARY: 64428,
    UNEMPLOYMENT: 60270,
    DENSITY: 60559,
    POPULATION: 1645341
};

export const fetchCityMacroStats = async (cityName) => {
    if (!cityName) return { salary: 0, unemployment: 0, population: 0, density: 0, utilities_cost: 0 };
    
    try {
        const searchUrl = PARSER_CONFIG.API.BDL_UNITS_URL(cityName);
        const searchRes = await axios.get(searchUrl, { timeout: 8000 });
        
        if (!searchRes.data?.results?.length) {
            throw new Error("Місто не знайдено в базі BDL");
        }

        const powiatUnit = searchRes.data.results.find(u => u.level === 5) || searchRes.data.results[0];
        const gminaUnit = searchRes.data.results.find(u => u.level === 6) || powiatUnit;
        
        const getVar = async (varId, unitId) => {
            try {
                const url = PARSER_CONFIG.API.BDL_DATA_URL(unitId, varId);
                const res = await axios.get(url, { timeout: 6000 });
                const values = res.data?.results?.[0]?.values;
                if (values && values.length > 0) {
                    const latest = values.reduce((prev, current) => (prev.year > current.year) ? prev : current);
                    return latest.val || 0;
                }
                return 0;
            } catch(e) {
                return 0; 
            }
        };

        const [salary, unemployment, density, populationThousands] = await Promise.all([
            getVar(BDL_VARS.SALARY, powiatUnit.id),
            getVar(BDL_VARS.UNEMPLOYMENT, powiatUnit.id),
            getVar(BDL_VARS.DENSITY, gminaUnit.id),
            getVar(BDL_VARS.POPULATION, gminaUnit.id)
        ]);

        const population = populationThousands * 1000;

        let utilities_cost = 12;
        if (salary > 8500) utilities_cost = 16;
        else if (salary > 7500) utilities_cost = 14;
        else if (salary < 6000 && salary > 0) utilities_cost = 10;

        return { 
            salary: Math.round(salary) || 0, 
            unemployment: unemployment || 0,
            population: Math.round(population) || 0,
            density: density || 0,
            utilities_cost: utilities_cost
        };
    } catch (error) {
        console.error(`[GUS ERROR] Помилка BDL API: ${error.message}`);
        return { salary: 0, unemployment: 0, population: 0, density: 0, utilities_cost: 0 };
    }
};