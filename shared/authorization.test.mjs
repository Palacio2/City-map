import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAdminProfile, requireAction, requireCity, requireSuperAdmin, authorizeDistrictBatch } from './authorization.js';

const access = normalizeAdminProfile({ role: 'admin', allowed_tabs: ['manual'], assigned_cities: ['own'] });
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
test('missing, ordinary and malformed admin profiles fail closed', () => {
    for (const profile of [null, {}, { role: 'user' }]) assert.throws(() => normalizeAdminProfile(profile));
    const malformed = normalizeAdminProfile({ role: 'admin', allowed_tabs: 'manual', assigned_cities: 'own' });
    assert.throws(() => requireCity(malformed, 'own'));
    assert.throws(() => requireAction(malformed, 'manual'));
});
test('tab access does not grant mutation permission or another city', () => {
    requireAction(access, 'manual');
    requireCity(access, 'own');
    assert.throws(() => requireAction(access, 'manual.edit'));
    assert.throws(() => requireCity(access, 'foreign'));
    assert.throws(() => requireSuperAdmin(access));
});
test('super admin bypasses scopes but cannot omit city', () => {
    const admin = normalizeAdminProfile({ role: 'super_admin' });
    requireAction(admin, 'manual.edit'); requireCity(admin, 'foreign'); requireSuperAdmin(admin);
    assert.throws(() => requireCity(admin, undefined));
});
test('batch authorization uses persisted district city, never client city_id', async () => {
    await assert.rejects(authorizeDistrictBatch(access, [{ id, city_id: 'own' }], async () => [{ id, city_id: 'foreign' }]));
    const rows = await authorizeDistrictBatch(access, [{ id }], async () => [{ id, city_id: 'own' }]);
    assert.equal(rows.length, 1);
});
test('invalid, unknown or conflicting district IDs cannot reach writes', async () => {
    for (const rows of [[], null, [{ id: 'invalid' }], [{ id, district_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }], [{ id }]]) {
        await assert.rejects(authorizeDistrictBatch(access, rows, async () => []));
    }
});
