import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
let handler, visible, rows, signedPaths, storageError, databaseError;
const district = '11111111-1111-4111-8111-111111111111';
const owner = '22222222-2222-4222-8222-222222222222';
const row = { id: 'comment', district_id: district, user_id: owner, content: 'Hello', is_hidden: false, avatar_url: `${owner}/123.webp` };
globalThis.commentFixture = {
  from: () => { const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: visible ? { id: district } : null, error: databaseError }) }; return q; },
  rpc: async () => ({ data: rows, error: databaseError }),
  storage: { from: bucket => { assert.equal(bucket, 'avatars'); return {
    createSignedUrls: async (paths, ttl) => {
      assert.equal(ttl, 300); signedPaths.push(...paths);
      return { data: paths.map(path => ({ path, signedUrl: 'https://signed.invalid/' + path })), error: storageError };
    },
  }; } },
};
globalThis.Deno = { serve: value => { handler = value; }, env: { get: key => key === 'SUPABASE_URL' ? 'https://fixture.invalid' : key === 'SUPABASE_SECRET_KEY' ? 'sb_secret_fixture' : undefined } };
const bundle = await build({ entryPoints: ['supabase/functions/get-district-comments/index.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({ filter: /^npm:/ }, () => ({ path: 'db', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const createClient=()=>globalThis.commentFixture;' }));
  } }],
});
await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
beforeEach(() => { visible = true; rows = [row]; signedPaths = []; storageError = databaseError = null; });
const request = (districtId = district) => handler(new Request('https://fixture.invalid', { method: 'POST', body: JSON.stringify({ districtId }) }));
test('only visible comments in the requested district receive signed author avatars', async () => {
  rows.push({ ...row, id: 'hidden', is_hidden: true }, { ...row, id: 'foreign', district_id: owner });
  const response = await request();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const data = (await response.json()).data;
  assert.equal(data.length, 1);
  assert.match(data[0].avatar_url, /^https:\/\/signed.invalid\//);
  assert.deepEqual(signedPaths, [`${owner}/123.webp`]);
});
test('editable metadata cannot request another owner, traversal, arbitrary bucket or unsafe URL', async () => {
  for (const avatar_url of [`${district}/secret.webp`, `${owner}/../secret.webp`, `${owner}/%2e%2e.webp`, 'javascript:alert(1)', 'https://fixture.invalid/storage/v1/object/public/feedback_images/secret.webp', 'https://user:password@external.invalid/a.png']) {
    rows = [{ ...row, avatar_url }];
    assert.equal((await (await request()).json()).data[0].avatar_url, null);
  }
  assert.deepEqual(signedPaths, []);
});
test('owned legacy Storage URL is normalized and external HTTPS avatar stays usable', async () => {
  rows = [{ ...row, avatar_url: `https://fixture.invalid/storage/v1/object/public/avatars/${owner}/123.webp` }];
  assert.match((await (await request()).json()).data[0].avatar_url, /^https:\/\/signed.invalid\//);
  rows = [{ ...row, avatar_url: 'https://external.invalid/avatar.png' }];
  assert.equal((await (await request()).json()).data[0].avatar_url, 'https://external.invalid/avatar.png');
});
test('hidden districts and failed queries expose no comments; unavailable avatars degrade safely', async () => {
  visible = false;
  assert.deepEqual((await (await request()).json()).data, []);
  assert.equal(signedPaths.length, 0);
  visible = true; databaseError = new Error('private SQL detail');
  const failed = await request();
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /private SQL detail/);
  databaseError = null; storageError = new Error('missing avatar');
  assert.equal((await (await request()).json()).data[0].avatar_url, null);
  assert.equal((await request('invalid')).status, 400);
});
