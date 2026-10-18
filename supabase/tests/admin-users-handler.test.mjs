import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const actor = '11111111-1111-4111-8111-111111111111';
const target = '22222222-2222-4222-8222-222222222222';
let handler, role, profileError, writeError, targetRole, writes, authWrites;
let checkout, billing, billingError, alreadyDeleted, deleteError, cancellationError, cancellations;
const db = {
  rpc: async (name, args) => {
    assert.ok(['set_admin_role','admin_terminate_user_sessions','prepare_admin_user_deletion'].includes(name));
    assert.deepEqual(args, name === 'set_admin_role' ? { p_actor: actor, p_target: target, p_role: 'admin' } : {p_actor:actor,p_target:target});
    writes++; return { error: writeError, data: name === 'prepare_admin_user_deletion' ? alreadyDeleted : null };
  },
  auth: { admin: {
    updateUserById: async () => { authWrites++; return { error: null }; },
    deleteUser: async () => { authWrites++; return { error: deleteError }; },
  } },
  from(table) {
    const query = { select: () => query, eq: () => query, like: () => query, limit: () => query,
      maybeSingle: async () => table === 'billing_checkout_state' ? { data: checkout, error: billingError } : ({ data: { role: targetRole, allowed_tabs: [] }, error: profileError }),
      then: resolve => resolve({ data: billing, error: billingError }),
      upsert: async () => { writes++; return { error: writeError }; },
    }; return query;
  },
};
globalThis.adminUserFixture = { access: () => ({ user: { id: actor }, role, allowedTabs: [], supabaseAdmin: db }), cancel:async()=>{ cancellations++; if(cancellationError) throw cancellationError; } };
globalThis.Deno = { serve: value => { handler = value; } };
const bundle = await build({ entryPoints: ['supabase/functions/admin-users-manage/index.ts'], bundle: true,
  write: false, platform: 'node', format: 'esm', plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({ filter: /_shared\/auth\.ts$/ }, () => ({ path: 'auth', namespace: 'fixture' }));
    b.onResolve({ filter: /\.\/billing\.ts$/ }, () => ({ path: 'billing', namespace: 'billing-fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'billing-fixture' }, () => ({ contents: 'export const reconcileDeletionBilling=()=>globalThis.adminUserFixture.cancel();' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents:
      'export const corsHeaders={}; export const verifyAdminUser=async()=>globalThis.adminUserFixture.access();' }));
  } }] });
await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
delete globalThis.Deno;
beforeEach(() => { role = 'super_admin'; profileError = writeError = billingError = deleteError = cancellationError = null; alreadyDeleted = false; checkout = null; billing = []; targetRole = 'user'; writes = authWrites = cancellations = 0; });
const request = (action, payload = {}, targetUserId = target) => handler(new Request('https://fixture.invalid', {
  method: 'POST', body: JSON.stringify({ action, payload, targetUserId }),
}));
test('admin handler prevents self deletion and self permission edits even for super admin', async () => {
  for (const action of ['delete_user', 'update_role', 'update_tabs', 'update_cities']) {
    assert.equal((await request(action, { role: 'user', tabs: [], cities: [] }, actor)).status, 403);
  }
  assert.equal(writes + authWrites, 0);
});
test('target profile lookup failure blocks every mutation', async () => {
  profileError = new Error('private database details');
  const response = await request('delete_user');
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes('private database details'), false);
  assert.equal(writes + authWrites, 0);
});
test('role write failure does not mutate Auth metadata or report success', async () => {
  writeError = new Error('write failed');
  assert.equal((await request('update_role', { role: 'admin' })).status, 503);
  assert.equal(writes, 1);
  assert.equal(authWrites, 0);
});
test('assignment writes surface errors and malformed payloads never write', async () => {
  assert.equal((await request('update_role', 'admin')).status, 400);
  assert.equal(writes, 0);
  writeError = new Error('write failed');
  assert.equal((await request('update_tabs', { tabs: ['users'] })).status, 503);
  assert.equal((await request('update_cities', { cities: [target] })).status, 503);
});
test('ordinary admin cannot assign roles or operate on another admin', async () => {
  role = 'admin';
  assert.notEqual((await request('update_role', { role: 'super_admin' })).status, 200);
  targetRole = 'admin';
  assert.notEqual((await request('delete_user')).status, 200);
  assert.equal(writes + authWrites, 0);
});
test('successful role change is uncached and delegates to one atomic RPC', async () => {
  const response = await request('update_role', { role: 'admin' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(writes, 1);
  assert.equal(authWrites, 0);
});
test('Checkout or any Stripe link requires successful cancellation before Auth', async () => {
  cancellationError=new Error('Cancellation uncertain');
  checkout = { user_id: target };
  assert.equal((await request('delete_user')).status, 503);
  checkout = null; billing = [{ payment_id: 'SUB_sub_old' }];
  assert.equal((await request('delete_user')).status, 503);
  assert.equal(authWrites, 0);
  assert.equal(cancellations,2);
  cancellationError=null;
  assert.equal((await request('delete_user')).status,200);
  assert.equal(authWrites,1);
});
test('billing lookup outage fails closed; an account without billing links remains deletable', async () => {
  billingError = new Error('unavailable');
  assert.equal((await request('delete_user')).status, 503);
  assert.equal(authWrites, 0);
  billingError = null;
  assert.equal((await request('delete_user')).status, 200);
  assert.equal(authWrites, 1);
});
test('session termination delegates actor and target to audited RPC and surfaces failure',async()=>{
  assert.equal((await request('terminate_sessions')).status,200);
  assert.equal(writes,1);
  writeError=new Error('private database details');
  const response=await request('terminate_sessions');
  assert.equal(response.status,503);
  assert.doesNotMatch(await response.text(),/private database details/);
  assert.equal(authWrites,0);
});
test('failed request audit prevents Auth deletion',async()=>{
  writeError=new Error('audit unavailable');
  assert.equal((await request('delete_user')).status,503);
  assert.equal(authWrites,0);
});
test('lost Auth response reports uncertainty and a completed receipt makes retry safe',async()=>{
  deleteError=new Error('network timeout');
  assert.equal((await request('delete_user')).status,503);
  assert.equal(authWrites,1);
  alreadyDeleted=true;
  assert.equal((await request('delete_user')).status,200);
  assert.equal(authWrites,1);
});
