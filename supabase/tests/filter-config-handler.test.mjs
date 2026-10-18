import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

let handler;
globalThis.filterConfigFixture = {
  from(table) {
    const query = { select: () => query, eq: () => query, order: () => query,
      then(resolve) { resolve({ error: null, data: table === 'field_groups'
        ? [{ id: 'economics', label_key: 'economics', icon: 'icon' }]
        : [{ ui_group: 'economics', field_code: 'average_rent_price', data_type: 'numeric',
          ui_component: 'input_number', is_premium: true, is_realtor_only: true,
          parser_config: { isPremium: false, isRealtorOnly: false } }] }); },
    }; return query;
  },
};
globalThis.Deno = { env: { get: key => /^SUPABASE_(SECRET|PUBLISHABLE)_KEYS?$/.test(key) ? undefined : 'fixture' }, serve: value => { handler = value; } };
const bundle = await build({ entryPoints: ['supabase/functions/get-filters-config/index.ts'], bundle: true,
  write: false, platform: 'node', format: 'esm', plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({ filter: /^npm:/ }, () => ({ path: 'supabase', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents:
      'export const createClient=()=>globalThis.filterConfigFixture;' }));
  } }] });
await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('public filter DTO uses the same authoritative access flags as data endpoints', async () => {
  const response = await handler(new Request('https://fixture.invalid'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const data = await response.json();
  assert.equal(data.economics.fields[0].isPremiumField, true);
  assert.equal(data.economics.fields[0].isRealtorOnly, true);
});
