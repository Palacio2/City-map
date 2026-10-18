import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { normalizeAdminProfile } from '../../shared/authorization.js';

// Bundle real handlers in memory; only authentication and database I/O are replaced.
const handlers = {};
for (const name of ['admin-geo-manage', 'admin-district-manage', 'admin-map-data', 'admin-geo-list', 'admin-cities-list']) {
    const result = await build({ entryPoints: [`supabase/functions/${name}/index.ts`], bundle: true, write: false, format: 'esm', platform: 'node',
        plugins: [{ name: 'fake-auth', setup(b) {
            b.onResolve({ filter: /_shared\/auth\.ts$/ }, () => ({ path: 'auth', namespace: 'test' }));
            b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const corsHeaders={}; export const verifyAdminUser=async()=>globalThis.testAccess;' }));
        } }] });
    globalThis.Deno = { serve: handler => { handlers[name] = handler; } };
    await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text + `\n//# sourceURL=${name}.test-bundle.js`).toString('base64')}`);
}
delete globalThis.Deno;

async function request(name, body, { tabs = ['manual', 'parser', 'map', 'manual.save', 'manual.create.district', 'manual.delete', 'manual.gis'], cities = ['own'], role = 'admin', districtCity = 'own', writeError = false } = {}) {
    const writes = [];
    const access = normalizeAdminProfile({ role, assigned_cities: cities, allowed_tabs: tabs });
    const db = { rpc: async (name,args) => { writes.push({table:name,value:args}); return {error:writeError ? {message:'write failed'} : null}; }, from(table) {
        let operation = 'select';
        const query = { select() { return query; }, eq() { return query; }, in() { return query; }, order() { return query; }, limit() { return query; },
            single() { return query; }, maybeSingle() { return query; },
            update(value) { operation = 'update'; writes.push({ table, value }); return query; },
            upsert(value) { operation = 'upsert'; writes.push({ table, value }); return query; },
            insert(value) { operation = 'insert'; writes.push({ table, value }); return query; },
            delete() { operation = 'delete'; writes.push({ table }); return query; },
            then(resolve, reject) {
                const data = name === 'admin-district-manage' || body.action === 'delete_district'
                    ? (districtCity ? { city_id: districtCity } : null)
                    : body.action === 'import_geojson' ? [{ id: 'district', name: 'District' }] : [];
                return Promise.resolve({ data, error: operation !== 'select' && writeError ? { message: 'write failed' } : null }).then(resolve, reject);
            } };
        return query;
    } };
    globalThis.testAccess = { ...access, user: { id: 'actor' }, hasTab: tab => access.isSuperAdmin || tabs.includes(tab), supabaseAdmin: db };
    try {
        const response = await handlers[name](new Request('https://example.invalid', { method: 'POST', headers: { Authorization: 'Bearer test' }, body: JSON.stringify(body) }));
        return { response, writes };
    } finally { delete globalThis.testAccess; }
}

for (const [action, payload] of [
    ['create_district', { cityId: 'foreign', name: 'District' }],
    ['create_districts', { cityId: 'foreign', names: ['District'] }],
    ['import_geojson', { cityId: 'foreign', features: [] }],
    ['delete_city', { id: 'foreign' }],
    ['delete_country', { id: 'country' }],
]) test(`geography ${action} rejects unauthorized scope before any write`, async () => {
    const { response, writes } = await request('admin-geo-manage', { action, payload });
    assert.equal(response.status, 403); assert.equal(writes.length, 0);
});
test('own city creation works, but missing action permission does not', async () => {
    const body = { action: 'create_district', payload: { cityId: 'own', name: 'District' } };
    const allowed = await request('admin-geo-manage', body);
    assert.equal(allowed.response.status, 200); assert.equal(allowed.writes.length, 1);
    const denied = await request('admin-geo-manage', body, { tabs: ['manual'] });
    assert.equal(denied.response.status, 403); assert.equal(denied.writes.length, 0);
});
test('city creation uses one atomic RPC and actor comes only from verified auth',async()=>{
    const body={action:'create_city',payload:{name:'City',countryId:'country',p_actor:'forged'},p_actor:'forged'};
    const {response,writes}=await request('admin-geo-manage',body,{tabs:['manual.create.city']});
    assert.equal(response.status,200);assert.equal(writes.length,1);
    assert.equal(writes[0].table,'admin_geography_action');
    assert.equal(writes[0].value.p_actor,'actor');
    assert.equal(writes[0].value.p_action,'create_city');
    assert.equal(response.headers.get('cache-control'),'private, no-store');
    assert.notEqual((await request('admin-geo-manage',body,{tabs:['manual.create.city'],writeError:true})).response.status,200);
});
test('district save cannot forge city or create missing district', async () => {
    for (const districtCity of ['foreign', null]) {
        const { response, writes } = await request('admin-district-manage', { action: 'save', districtId: 'district', payload: { name: 'New', city_id: 'own' } }, { districtCity });
        assert.notEqual(response.status, 200); assert.equal(writes.length, 0);
    }
});
test('district deletion checks persisted city', async () => {
    const { response, writes } = await request('admin-geo-manage', { action: 'delete_district', payload: { districtId: 'district' } }, { districtCity: 'foreign' });
    assert.equal(response.status, 403); assert.equal(writes.length, 0);
});

test('save-only permission cannot change geometry, including mixed metadata payloads', async () => {
    const body = {action:'save',districtId:'district',payload:{name:'New',geojson:{},poi_data:[]}};
    const denied = await request('admin-district-manage',body,{tabs:['manual.save']});
    assert.equal(denied.response.status,403);
    assert.equal(denied.writes.length,0);
    const allowed = await request('admin-district-manage',body,{tabs:['manual.save','manual.gis']});
    assert.equal(allowed.response.status,200);
    assert.equal(allowed.writes.length,1);
});
test('editing permission alone cannot persist district changes', async () => {
    const body = { action: 'save', districtId: 'district', payload: { name: 'New' } };
    const denied = await request('admin-district-manage', body, { tabs: ['manual', 'manual.edit'] });
    assert.equal(denied.response.status, 403); assert.equal(denied.writes.length, 0);
    const allowed = await request('admin-district-manage', body, { tabs: ['manual', 'manual.save'] });
    assert.equal(allowed.response.status, 200); assert.equal(allowed.writes.length, 1);
});
test('database mutation failure never reports successful save/import', async () => {
    for (const [name, body] of [
        ['admin-district-manage', { action: 'save', districtId: 'district', payload: { name: 'New' } }],
        ['admin-geo-manage', { action: 'import_geojson', payload: { cityId: 'own', features: [{ name: 'District', geojson: {} }] } }],
    ]) assert.notEqual((await request(name, body, { writeError: true })).response.status, 200);
});
test('map and list require tab permission and assigned city', async () => {
    assert.equal((await request('admin-map-data', { cityId: 'foreign' })).response.status, 403);
    assert.equal((await request('admin-map-data', { cityId: 'own' }, { cities: [] })).response.status, 403);
    assert.equal((await request('admin-map-data', { cityId: 'own' })).response.status, 200);
    assert.equal((await request('admin-geo-list', { action: 'get_districts', cityId: 'foreign' })).response.status, 403);
    assert.equal((await request('admin-cities-list', { mapMode: true }, { tabs: [] })).response.status, 403);
});
