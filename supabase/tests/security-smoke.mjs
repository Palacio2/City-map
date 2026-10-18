// Read-only deployed checks. Run explicitly; never included in local unit tests.
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

const config = { ...(existsSync('.env') ? parse(readFileSync('.env')) : {}), ...process.env };
const url = config.VITE_SUPABASE_URL?.replace(/\/$/, '');
const key = config.VITE_SUPABASE_ANON_KEY;
assert.ok(url && key, 'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
assert.equal(new URL(url).protocol, 'https:');

async function get(path) {
  return fetch(`${url}${path}`, {
    method: 'GET',
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
}

for (const endpoint of ['update-admin-user', 'get-admin-users', 'admin-users-list']) {
  test(`${endpoint} is retired in the deployed API`, async () => {
    const response = await get(`/functions/v1/${endpoint}`);
    assert.equal(response.status, 410);
    assert.equal((await response.json()).error, 'ENDPOINT_RETIRED');
  });
}

for (const table of ['field_groups', 'fields_config']) {
  test(`${table} remains readable without retrieving user data`, async () => {
    const response = await get(`/rest/v1/${table}?select=id&limit=0`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), []);
  });
}

test('scraper rules are not exposed to anonymous REST clients', async () => {
  const response = await get('/rest/v1/scraper_rules?select=id&limit=0');
  assert.ok([401, 403].includes(response.status), `Unexpected status ${response.status}`);
  await response.body?.cancel();
});

test('parser jobs cannot bypass backend ownership checks through REST', async () => {
  const response = await get('/rest/v1/parser_jobs?select=id&limit=0');
  assert.ok([401, 403].includes(response.status), `Unexpected status ${response.status}`);
  await response.body?.cancel();
});

for (const endpoint of ['admin-geo-manage', 'admin-district-manage', 'admin-map-data', 'admin-geo-list', 'admin-cities-list']) {
  test(`${endpoint} rejects unauthenticated data access`, async () => {
    const response = await fetch(`${url}/functions/v1/${endpoint}`, {
      method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_districts', cityId: '00000000-0000-0000-0000-000000000000', districtId: '00000000-0000-0000-0000-000000000000' }),
      signal: AbortSignal.timeout(15000),
    });
    assert.ok([400, 401, 403].includes(response.status), `Unexpected status ${response.status}`);
    const body = await response.json();
    assert.ok(body.error || body.message); assert.equal(body.data, undefined);
  });
}

test('public filter configuration still loads through its Edge Function', async () => {
  const response = await get('/functions/v1/get-filters-config');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body && typeof body === 'object' && !body.error);
});

test('anonymous callers cannot read admin feedback', async () => {
  const response = await get('/functions/v1/admin-feedback-manage');
  assert.ok([400, 401, 403].includes(response.status));
  const body = await response.json();
  assert.ok(body.error);
  assert.equal(body.data, undefined);
});

test('known feedback attachment is not publicly downloadable', {
  skip: !process.env.FEEDBACK_IMAGE_PROBE_PATH,
}, async () => {
  const path = process.env.FEEDBACK_IMAGE_PROBE_PATH.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${url}/storage/v1/object/public/feedback_images/${path}`, {
    method: 'HEAD', signal: AbortSignal.timeout(15000), cache: 'no-store',
  });
  assert.ok([400, 401, 403, 404].includes(response.status), `Unexpected status ${response.status}`);
});
