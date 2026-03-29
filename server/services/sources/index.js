import { osmAdapter } from './osmAdapter.js';
import { gusAdapter } from './gusAdapter.js';
import { waqiAdapter } from './waqiAdapter.js';
import { scraperAdapter } from './scraperAdapter.js';

const adapters = {
    osm: osmAdapter,
    osm_pbf: osmAdapter,
    gus: gusAdapter,
    api: waqiAdapter,
    scraper: scraperAdapter,
    otodom: scraperAdapter
};

export const getSourceAdapter = (type) => adapters[type] || null;