import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
let handler, permission, denied, writes, reads, dbError;
const actor = 'verified-actor';
globalThis.logsFixture = { verify: async () => {
  if (denied) throw new Error('Unauthorized');
  return { user: { id: actor, email: 'actor@example.invalid' }, hasTab: () => permission,
    supabaseAdmin: { from: () => {
      const q = { select: () => q, order: () => q, limit: () => q, gte: () => q, lte: () => q,
        insert: async row => { writes.push(row); return { error: dbError }; },
        then: resolve => { reads++; resolve({ data: [], error: dbError }); } };
      return q;
    } },
  };
} };
globalThis.Deno = { serve: value => { handler = value; } };
const bundle = await build({ entryPoints: ['supabase/functions/admin-logs-manage/index.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({ filter: /_shared\/auth\.ts$/ }, () => ({ path: 'auth', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const corsHeaders={};export const verifyAdminUser=globalThis.logsFixture.verify;' }));
  } }],
});
await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
beforeEach(() => { permission = true; denied = false; writes = []; reads = 0; dbError = null; });
const request = body => handler(new Request('https://fixture.invalid', { method: 'POST', body: JSON.stringify(body) }));
test('denied sessions and missing log permissions cannot read or write', async () => {
  denied = true;
  assert.notEqual((await request({ action: 'insert_client_event', log: { action: 'save' } })).status, 200);
  denied = false; permission = false;
  for (const action of ['get_audit_logs','get_ai_logs','insert_ai_log']) assert.equal((await request({ action })).status, 403);
  assert.equal(reads + writes.length, 0);
});
test('client events cannot impersonate another admin or authoritative server audit', async () => {
  const response = await request({ action: 'insert_client_event', log: { admin_id: 'victim', action: 'update_role', source: 'server', details: { source: 'server' } } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(writes[0].admin_id, actor);
  assert.equal(writes[0].action, 'client_event');
  assert.equal(writes[0].new_data.source, 'client');
});
test('log reads are bounded and database errors never become successful writes', async () => {
  assert.equal((await request({ action: 'get_audit_logs', limit: 501 })).status, 400);
  assert.equal((await request({ action: 'get_audit_logs', selectedDate: 'invalid' })).status, 400);
  assert.equal(reads, 0);
  dbError = new Error('private SQL detail');
  const response = await request({ action: 'insert_client_event', log: { action: 'save' } });
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private SQL detail/);
});
