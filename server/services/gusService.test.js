import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
let failAll = false, values = {};
globalThis.gusHttp = { get: async url => {
  if (failAll) throw new Error('Fixture unavailable');
  const variable = new URL(url).searchParams.get('var-id');
  if (!variable) return { data: { results: [{ id: 'fixture', level: 6 }] } };
  if (!(variable in values)) throw new Error('Variable unavailable');
  return { data: { results: [{ values: [{ year: 2025, val: values[variable] }] }] } };
} };
const bundle = await build({ entryPoints: [fileURLToPath(new URL('../countries/pl/gusService.js',import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({ filter: /parserHttp\.js$/ }, () => ({ path: 'http', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const parserHttp=globalThis.gusHttp;' }));
  } }],
});
const { fetchCityMacroStats } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('GUS outages and missing population never emit a destructive zero', async () => {
  failAll = true;
  assert.deepEqual(await fetchCityMacroStats('Fixture'), {});
  failAll = false; values = { 60270: 0, 64428: null };
  const stats = await fetchCityMacroStats('Fixture');
  assert.equal(stats.population, null);
  assert.equal(stats.salary, null);
  assert.equal(stats.density, null);
  assert.equal(stats.utilities_cost, null);
  assert.equal(stats.unemployment, 0);
  values = { 1645341: 12.345 };
  assert.equal((await fetchCityMacroStats('Fixture')).population, 12345);
});
