export interface CountryConfig {
    id: string;
    name?: string;
    defaultCenter: [number, number];
    defaultZoom: number;
    features: {
        hasOtodom: boolean;
        hasGus: boolean;
        hasOlx: boolean;
        hasDerzhstat: boolean;
        hasWaqi: boolean;
        hasOsm: boolean;
    };
}

export const COUNTRY_CONFIG: Record<string, CountryConfig> = {
    'poland': {
        id: 'pl',
        name: 'Poland',
        defaultCenter: [52.23, 21.01],
        defaultZoom: 6,
        features: {
            hasOtodom: true,
            hasGus: true,
            hasOlx: false,
            hasDerzhstat: false,
            hasWaqi: true,
            hasOsm: true
        }
    },
    'ukraine': {
        id: 'ua',
        name: 'Ukraine',
        defaultCenter: [48.3794, 31.1656],
        defaultZoom: 6,
        features: {
            hasOtodom: false,
            hasGus: false,
            hasOlx: true,         
            hasDerzhstat: true,   
            hasWaqi: true,
            hasOsm: true
        }
    },
    'default': {
        id: 'default',
        defaultCenter: [50.0, 20.0],
        defaultZoom: 4,
        features: {
            hasOtodom: false,
            hasGus: false,
            hasOlx: false,
            hasDerzhstat: false,
            hasWaqi: true,
            hasOsm: true
        }
    }
};

export const getCountryConfig = (countryName?: string | null): CountryConfig => {
    if (!countryName) return COUNTRY_CONFIG['default'];
    const normalizedName = countryName.trim().toLowerCase();
    if (['poland', 'polska', 'польща', 'pl'].includes(normalizedName)) return COUNTRY_CONFIG['poland'];
    if (['ukraine', 'ukraina', 'україна', 'ua'].includes(normalizedName)) return COUNTRY_CONFIG['ukraine'];
    return COUNTRY_CONFIG[normalizedName] || COUNTRY_CONFIG['default'];
};
