import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { normalizeAdminProfile } from '../../shared/authorization.js';

async function loadController(name) {
    const result = await build({ entryPoints: [fileURLToPath(new URL(`./${name}.js`, import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node',
        plugins: [{ name: 'isolate-io', setup(b) {
            b.onResolve({ filter: /\/(supabase|logger|queueService|parserCore|osmAdapter|parserSchema)\.js$/ }, args => ({ path: args.path.split('/').pop(), namespace: 'fake' }));
            b.onLoad({ filter: /.*/, namespace: 'fake' }, args => {
                const exports = {
                    'supabase.js': 'export const supabase = {from: (...args)=>globalThis.controllerIO.from(...args),rpc:(...args)=>globalThis.controllerIO.rpc(...args)};',
                    'logger.js': 'export const logger = {log(){}}; export const createJobLogger=()=>logger;',
                    'queueService.js': 'export const queueService = {isLocked:()=>{throw new Error("queue must not be accessed");}};',
                    'parserCore.js': 'export const runUniversalParser=()=>{throw new Error("parser must not start");};',
                    'osmAdapter.js': 'export const osmAdapter={};',
                    'parserSchema.js': 'export const RunParserSchema={parse:input=>input};',
                };
                return { contents: exports[args.path] };
            });
        } }] });
    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text + `\n//# sourceURL=${name}.test-bundle.js`).toString('base64')}`);
}
const db = await loadController('dbController');
const parser = await loadController('parserController');
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const access = normalizeAdminProfile({ role: 'admin', allowed_tabs: ['manual.save', 'parser', 'parser.run_offline'], assigned_cities: ['own'] });
function fixture(cityId) {
    const writes = [], filters = [];
    globalThis.controllerIO = { rpc: async (name,args) => { assert.equal(name,'save_district_bundle'); writes.push({table:name,payload:args.p_rows.map(row=>row.metrics)}); return {error:null}; }, from(table) {
        const q = { select: () => q, in: (...args) => { filters.push(args); return q; }, order: () => q, not: () => q, limit: () => q, maybeSingle: () => q,
            eq: (...args) => { filters.push(args); return q; },
            upsert: payload => { writes.push({ table, payload }); return q; },
            then: (resolve, reject) => Promise.resolve({ data: table === 'districts' ? [{ id, city_id: cityId }] : null, error: null }).then(resolve, reject) };
        return q;
    } };
    const req = { adminAccess: access, user: { id: 'actor' }, body: { resultsArray: [{ id, population: 42 }], districts: [{ id }] } };
    const res = { status(code) { this.code = code; return this; }, json(value) { this.body = value; }, send(value) { this.body = value; } };
    return { req, res, writes, filters };
}
test('bulk save validates every district before first write', async () => {
    const f = fixture('foreign'); let failure;
    await db.saveResults(f.req, f.res, error => { failure = error; });
    assert.equal(failure.status, 403); assert.equal(f.writes.length, 0); assert.equal(f.res.body, undefined);
});
test('bulk save still writes authorized results', async () => {
    const f = fixture('own');
    await db.saveResults(f.req, f.res, assert.ifError);
    assert.deepEqual(f.res.body, { success: true }); assert.equal(f.writes.length, 1);
    assert.equal(f.writes[0].payload[0].district_id, id);
    assert.equal(f.writes[0].payload[0].population, 42);
    assert.equal(Object.hasOwn(f.writes[0].payload[0], 'city_population'), false);
});

test('bulk save preserves fractional values', async () => {
    const f=fixture('own');
    f.req.body.resultsArray=[{id,average_rent_price:1250.45,area_km2:0.4}];
    await db.saveResults(f.req,f.res,assert.ifError);
    assert.equal(f.writes[0].payload[0].average_rent_price,1250.45);
    assert.equal(f.writes[0].payload[0].area_km2,0.4);
});
test('parser start rejects foreign city before queue access or 202 response', async () => {
    const f = fixture('foreign'); let failure;
    await parser.runOsmParser(f.req, f.res, error => { failure = error; });
    assert.equal(failure.status, 403); assert.equal(f.res.code, undefined); assert.equal(f.writes.length, 0);
});
test('actual pending-results and log controllers apply owner filter', async () => {
    for (const handler of [parser.getPendingResults, parser.getCurrentLog, parser.deletePendingResults]) {
        const f = fixture('own');
        await handler(f.req, f.res, assert.ifError);
        assert.ok(f.filters.some(([key, value]) => key === 'config->>requestedBy' && value === 'actor'));
        assert.ok(f.filters.some(([key, value]) => key === 'config->>cityId' && value.includes('own')));
    }
    delete globalThis.controllerIO;
});
