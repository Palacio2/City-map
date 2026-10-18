import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizeParserConfig, scopeParserJobs } from './parserAuthorization.js';
import { normalizeAdminProfile } from '../../shared/authorization.js';
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const access = normalizeAdminProfile({ role: 'admin', allowed_tabs: ['parser', 'parser.run_offline'], assigned_cities: ['own'] });
function client(cityId = 'own') {
    return { from: table => ({ select: () => ({
        in: async () => ({ data: [{ id, city_id: cityId, name: 'Actual district' }] }),
        eq: () => ({ single: async () => ({ data: { id: cityId, name: 'Actual city' } }) }),
    }) }) };
}
test('parser replaces client names, owner and job state with authorized database values', async () => {
    const result = await authorizeParserConfig(client(), access, 'actor', { districts: [{ id }], cityName: 'Forged', requestedBy: 'victim', jobId: 'victim-job', status: 'completed', results: [] });
    assert.equal(result.cityName, 'Actual city'); assert.equal(result.requestedBy, 'actor');
    assert.equal(result.districts[0].name, 'Actual district');
    assert.equal(result.jobId, undefined); assert.equal(result.results, undefined); assert.equal(result.status, undefined);
});
test('parser rejects districts of another city before enqueue', async () => {
    await assert.rejects(authorizeParserConfig(client('foreign'), access, 'actor', { districts: [{ id }] }));
});
test('job queries are owner-scoped and missing owner cannot become a global query', () => {
    const calls = [];
    const query = { eq: (...args) => { calls.push(args); return query; }, in: (...args) => { calls.push(args); return query; } };
    assert.equal(scopeParserJobs(query, access, 'actor'), query);
    assert.deepEqual(calls, [['config->>requestedBy', 'actor'], ['config->>cityId', ['own']]]);
    assert.throws(() => scopeParserJobs(query, access, null));
    scopeParserJobs(query, normalizeAdminProfile({ role: 'super_admin' }), 'super');
    assert.equal(calls.length, 2);
});
