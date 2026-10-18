import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSupabaseKey } from './supabaseKeys.js';

for (const kind of ['secret', 'publishable']) {
  const prefix = kind.toUpperCase();
  const direct = `SUPABASE_${prefix}_KEY`;
  const bundle = `${direct}S`;
  const legacy = kind === 'secret' ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY';
  const key = `sb_${kind}_fixture`;
  const resolve = values => resolveSupabaseKey(name => values[name], kind);
  test(`${kind}: direct, default bundle and legacy precedence`, () => {
    assert.equal(resolve({ [direct]: key, [bundle]: 'invalid', [legacy]: 'old' }), key);
    assert.equal(resolve({ [bundle]: JSON.stringify({ default: key, other: 'ignored' }), [legacy]: 'old' }), key);
    assert.equal(resolve({ [legacy]: 'old' }), 'old');
    assert.equal(resolve({ [bundle]: '{}', [legacy]: 'old' }), 'old');
    assert.throws(() => resolve({ [bundle]: '{}' }), { message: `Missing ${direct}` });
  });
  test(`${kind}: invalid new configuration never falls back or exposes credentials`, () => {
    for (const value of ['', 'sensitive-invalid-fixture', ` ${key}`, 'sb_wrong_fixture']) {
      assert.throws(() => resolve({ [direct]: value, [legacy]: 'old' }), { message: `Invalid ${direct}` });
    }
    for (const value of ['', 'sensitive-invalid-fixture', 'null', '[]', '{"default":42}', '{"other":"sb_secret_fixture"}']) {
      assert.throws(() => resolve({ [bundle]: value, [legacy]: 'old' }), { message: `Invalid ${bundle}` });
    }
    assert.throws(() => resolve({}), { message: `Missing ${direct}` });
  });
}
