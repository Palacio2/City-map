import { plAdapter } from './pl/index.js';
import { uaAdapter } from './ua/index.js';

export const getCountryAdapter = (countryCode) => {
    const code = countryCode ? countryCode.toUpperCase() : 'PL';
    
    switch (code) {
        case 'UA': 
            return uaAdapter;
        case 'PL': 
        default: 
            return plAdapter; 
    }
};