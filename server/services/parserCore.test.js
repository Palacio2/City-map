import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { castDataType } from './parserEngine.js';

let fields, sources, saved, calls;
globalThis.parserCoreFixture = {
    getSourceAdapter: source => ({ fetchData: async () => { calls.push(source); return sources[source]; } }),
    queueService: { save: async value => { saved = value; } },
    supabase: { from: table => ({ select: () => ({
        eq: async () => ({ data: fields, error: null }),
        in: async () => ({ data: table === 'district_geo_data' ? [{ district_id: 'd', geojson: {} }] : [], error: null }),
    }) }) },
};
const bundle = await build({ entryPoints: [fileURLToPath(new URL('./parserCore.js', import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node',
    plugins: [{ name: 'fixture', setup(b) {
        b.onResolve({ filter: /sources\/index\.js|queueService\.js|utils\/supabase\.js/ }, args => ({ path: args.path, namespace: 'fixture' }));
        b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const {getSourceAdapter,queueService,supabase}=globalThis.parserCoreFixture;' }));
    } }],
});
const { runUniversalParser } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
beforeEach(() => { fields = []; sources = {}; calls = []; saved = null; });
const run = enabledSources => runUniversalParser({ districts: [{ id: 'd', name: 'District' }], enabledSources }, {});
test('disabled and absent district source results never overwrite stored values or POIs with zero', async () => {
    fields = [{ source_type: 'osm_pbf', field_code: 'schools_count', data_type: 'integer' }];
    let [row] = await run([]);
    assert.equal(Object.hasOwn(row, 'schools_count'), false);
    assert.equal(Object.hasOwn(row, 'poi_data'), false);
    assert.deepEqual(calls, []);
    sources.osm = {};
    [row] = await run(['osm']);
    assert.equal(Object.hasOwn(row, 'schools_count'), false);
    assert.equal(saved.status, 'completed');
});
test('legacy scraper source aliases retain fractional values and execute once', async () => {
    fields = ['otodom', 'scraper'].map((source_type, i) => ({ source_type, field_code: `rent_${i}`, data_type: 'number', parser_config: { scraper: { type: 'rent', extract: 'price' } } }));
    sources.scraper = { d: { rent: { price: 1250.75 } } };
    const [row] = await run(['otodom']);
    assert.equal(row.rent_0, 1250.75);
    assert.equal(row.rent_1, 1250.75);
    assert.deepEqual(calls, ['scraper']);
});
test('explicit zero and empty POI collections survive, missing and malformed values do not', async () => {
    fields = ['zero', 'missing', 'invalid'].map(field_code => ({ source_type: 'osm', field_code, data_type: 'numeric' }));
    sources.osm = { d: { zero: 0, invalid: 'N/A', poi_data: [] } };
    const [row] = await run(['osm_pbf']);
    assert.equal(row.zero, 0);
    assert.deepEqual(row.poi_data, []);
    assert.equal(Object.hasOwn(row, 'missing'), false);
    assert.equal(Object.hasOwn(row, 'invalid'), false);
    assert.equal(castDataType('false', 'boolean'), false);
    assert.equal(castDataType('', 'numeric'), null);
    assert.equal(castDataType(Infinity, 'numeric'), null);
});
test('GUS population has an explicit city-wide contract', async () => {
    fields = [{ source_type: 'gus', field_code: 'population', data_type: 'integer' }];
    sources.gus = { population: 12345 };
    const [row] = await run(['gus']);
    assert.equal(row.city_population, 12345);
    assert.equal(Object.hasOwn(row, 'population'), false);
});
