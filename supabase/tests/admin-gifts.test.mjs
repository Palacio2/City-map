import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const userId = '11111111-1111-4111-8111-111111111111';
let handler, rows, operations, allowed, profile, profileError, writeError, auditError;
const db = {
  rpc: async (name, args) => {
    assert.equal(name, 'manage_manual_gift');
    operations.push({ type: 'transaction', args });
    if (writeError || auditError) return { error: writeError || auditError };
    if (args.p_action === 'grant_subscription') {
      const starts = new Date();
      const value = { user_id: args.p_target, payment_id: 'GIFT_MANUAL_' + args.p_target,
        plan_name: args.p_plan, status: 'active', starts_at: starts.toISOString(),
        ends_at: new Date(starts.getTime() + args.p_days * 86400000).toISOString() };
      rows = [...rows.filter(row => row.payment_id !== value.payment_id), value];
    } else rows = rows.map(row => row.user_id === args.p_target && ['active', 'trialing'].includes(row.status)
      && row.payment_id.startsWith('GIFT_') ? { ...row, status: 'canceled' } : row);
    return { data: { success: true, source: 'gift' }, error: null };
  },
  from: table => {
    assert.equal(table, 'admin_profiles');
    const query = { select: () => query, eq: () => query,
      maybeSingle: async () => ({ data: profile, error: profileError }) };
    return query;
  },
};
globalThis.giftFixture = {
  access: () => ({ user: { id: 'admin' }, supabaseAdmin: db, isSuperAdmin: false, hasTab: () => allowed }),
  Stripe: class { static createFetchHttpClient() { return {}; } },
};
globalThis.Deno = { env: { get: key => /^SUPABASE_(SECRET|PUBLISHABLE)_KEYS?$/.test(key) ? undefined : 'fixture' }, serve: value => { handler = value; } };
const bundle = await build({ entryPoints: ['supabase/functions/admin-stripe-manage/index.ts'], bundle: true,
  write: false, platform: 'node', format: 'esm', plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({ filter: /_shared\/auth\.ts$/ }, () => ({ path: 'auth', namespace: 'fixture' }));
    b.onResolve({ filter: /^npm:stripe/ }, () => ({ path: 'stripe', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: path === 'auth'
      ? 'export const corsHeaders={}; export const verifyAdminUser=async()=>globalThis.giftFixture.access();'
      : 'export default globalThis.giftFixture.Stripe;' }));
  } }] });
await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
delete globalThis.Deno;

beforeEach(() => {
  rows = [
    { user_id: userId, payment_id: 'SUB_sub_paid', status: 'active', plan_name: 'realtor' },
    { user_id: userId, payment_id: `GIFT_MANUAL_${userId}`, status: 'active', plan_name: 'premium' },
    { user_id: userId, payment_id: 'GIFTXnotagift', status: 'active' },
    { user_id: 'another-user', payment_id: 'GIFT_OTHER', status: 'active' },
  ];
  operations = []; allowed = true; profile = null; profileError = writeError = auditError = null;
});
const request = (action, payload = { userId }, method = 'POST') => handler(new Request('https://fixture.invalid', {
  method, ...(method === 'POST' ? { body: JSON.stringify({ action, payload: { requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ...payload } }) } : {}),
}));

test('gift revocation leaves paid subscriptions and other users untouched', async () => {
  const paid = { ...rows[0] };
  assert.equal((await request('revoke_gift')).status, 200);
  assert.deepEqual(rows[0], paid);
  assert.equal(rows[1].status, 'canceled');
  assert.equal(rows[2].status, 'active');
  assert.equal(rows[3].status, 'active');
  assert.equal(operations[0].args.p_action, 'revoke_gift');
});
test('retired blanket revoke and non-POST requests cannot mutate anything', async () => {
  assert.equal((await request('revoke_subscription')).status, 410);
  assert.equal((await request('revoke_gift', {}, 'GET')).status, 405);
  assert.deepEqual(operations, []);
});
test('gift permission and target role are enforced', async () => {
  allowed = false;
  assert.equal((await request('revoke_gift')).status, 403);
  allowed = true;
  for (const role of ['admin', 'super_admin', 'unexpected']) {
    profile = { role };
    assert.equal((await request('revoke_gift')).status, 403);
  }
  assert.deepEqual(operations, []);
});
test('failed target lookup fails closed', async () => {
  profileError = new Error('database unavailable');
  assert.equal((await request('revoke_gift')).status, 503);
  assert.deepEqual(operations, []);
});
test('invalid plan, duration, identity and conflicting aliases cannot write', async () => {
  for (const days of [0, -1, 366, 1.5, '30', null]) {
    assert.equal((await request('grant_subscription', { userId, plan_name: 'premium', days })).status, 400);
  }
  for (const patch of [{ plan_name: 'free' }, { userId: 'invalid' }, { targetUserId: 'different' }, { planName: 'realtor' }]) {
    assert.equal((await request('grant_subscription', { userId, plan_name: 'premium', days: 30, ...patch })).status, 400);
  }
  assert.deepEqual(operations, []);
});
test('gift replacement uses one atomic RPC and never cancels paid access', async () => {
  assert.equal((await request('grant_subscription', { userId, plan_name: 'premium', days: 30 })).status, 200);
  assert.deepEqual(operations.map(item => item.type), ['transaction']);
  assert.equal(rows[0].payment_id, 'SUB_sub_paid');
  assert.equal(rows[0].status, 'active');
  const value = rows.find(row => row.payment_id.startsWith('GIFT_MANUAL_'));
  assert.equal(Date.parse(value.ends_at) - Date.parse(value.starts_at), 30 * 86400000);
});
test('failed writes preserve existing gift and never report success', async () => {
  writeError = new Error('write failed');
  assert.equal((await request('grant_subscription', { userId, plan_name: 'premium', days: 30 })).status, 503);
  assert.equal(rows[1].status, 'active');
  assert.equal((await request('revoke_gift')).status, 503);
  assert.equal(rows[1].status, 'active');
  assert.equal(operations.some(item => item.type === 'audit'), false);
});
test('audit failure reports failure and preserves the gift', async () => {
  auditError = new Error('audit failed');
  const response = await request('revoke_gift');
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /gift transaction/);
  assert.equal(rows[1].status, 'active');
});

test('invalid and oversized bodies are rejected before gift writes', async () => {
  for (const body of ['{', 'null', '[]', 'x'.repeat(32769)]) {
    const response = await handler(new Request('https://fixture.invalid', { method: 'POST', body }));
    assert.equal(response.status, body.length > 32768 ? 413 : 400);
  }
  assert.deepEqual(operations, []);
});

test('missing request identity and receipt conflicts cannot silently repeat a gift', async () => {
 assert.equal((await request('grant_subscription', { userId, plan_name: 'premium', days: 30, requestId: undefined })).status, 400);
 assert.deepEqual(operations, []);
 writeError = { code: 'CM409' };
 assert.equal((await request('revoke_gift')).status, 409);
});
