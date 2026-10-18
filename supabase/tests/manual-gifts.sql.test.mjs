import { randomUUID } from 'node:crypto';
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Isolated PostgreSQL with the relevant column types verified against live on
// 2026-10-14. This is not a Supabase gateway or multi-connection concurrency test.
const db = new PGlite();
const actor = '11111111-1111-4111-8111-111111111111';
const target = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';
const call = (action = 'grant_subscription', plan = 'premium', days = 30, recipient = target, requestId = randomUUID()) =>
  db.query('select public.manage_manual_gift($1,$2,$3,$4,$5,$6) result', [requestId, actor, recipient, action, plan, days]);
before(async () => {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create table public.admin_profiles(user_id uuid primary key, role text not null, allowed_tabs text[]);
    create table public.user_subscriptions(id uuid primary key default gen_random_uuid(), user_id uuid,
      payment_id text unique, plan_name text not null, status text not null, starts_at timestamptz default now(),
      ends_at timestamptz, amount numeric default 0, created_at timestamptz default now(), cancelled_at timestamptz, cancel_at timestamptz);
    create table public.audit_logs(id uuid primary key default gen_random_uuid(), admin_id uuid, action text not null,
      target_table text, record_id text, old_data jsonb, new_data jsonb, created_at timestamptz default now());
    insert into auth.users values ('${actor}'), ('${target}'), ('${other}');
  `);
  const migration = await readFile(new URL('../migrations/20261014171051_atomic_manual_gifts.sql', import.meta.url), 'utf8');
  await db.exec(migration);
  await db.exec(migration); // Repeatable migration must preserve its access restrictions.
  const receipts = await readFile(new URL('../migrations/20261014171920_idempotent_manual_gifts.sql', import.meta.url), 'utf8');
  await db.exec(receipts); await db.exec(receipts);
});
after(() => db.close());
beforeEach(async () => {
  await db.exec(`drop trigger if exists fail_audit on public.audit_logs;
    truncate public.user_subscriptions, public.audit_logs, public.admin_profiles, public.manual_gift_operations;
    insert into public.admin_profiles values ('${actor}', 'admin', array['users.gift_sub']);
    insert into public.user_subscriptions(user_id,payment_id,plan_name,status,ends_at) values
      ('${target}','SUB_paid','realtor','active',now()+interval '1 day'),
      ('${target}','GIFTXnotgift','premium','active',now()+interval '1 day'),
      ('${other}','GIFT_OTHER','premium','active',now()+interval '1 day');`);
});
test('grant and audit commit together with exact duration and preserve other entitlements', async () => {
  const before = (await db.query('select * from user_subscriptions order by payment_id')).rows;
  assert.deepEqual((await call()).rows[0].result, { success: true, source: 'gift' });
  const gift = (await db.query("select extract(epoch from ends_at-starts_at)::integer seconds from user_subscriptions where payment_id like 'GIFT_MANUAL_%'")).rows[0];
  assert.equal(gift.seconds, 30 * 86400);
  assert.deepEqual((await db.query("select * from user_subscriptions where payment_id not like 'GIFT_MANUAL_%' order by payment_id")).rows, before);
  const audit = (await db.query('select * from audit_logs')).rows;
  assert.equal(audit.length, 1);
  assert.equal(audit[0].admin_id, actor);
  assert.equal(audit[0].new_data.changed, 1);
});
test('audit failure rolls back both grant replacement and revocation', async () => {
  await call();
  const original = (await db.query('select * from user_subscriptions order by payment_id')).rows;
  await db.exec(`create or replace function public.reject_test_audit() returns trigger language plpgsql as $$
    begin raise exception 'Injected audit failure'; end $$;
    create trigger fail_audit before insert on public.audit_logs for each row execute function public.reject_test_audit();`);
  await assert.rejects(call('grant_subscription', 'realtor', 60), /Injected audit failure/);
  await assert.rejects(call('revoke_gift', null, null), /Injected audit failure/);
  assert.deepEqual((await db.query('select * from user_subscriptions order by payment_id')).rows, original);
  assert.equal((await db.query('select count(*)::integer n from audit_logs')).rows[0].n, 1);
});
test('revocation matches only the recipient literal GIFT_ prefix', async () => {
  await call();
  await call('revoke_gift', null, null);
  const rows = (await db.query('select payment_id,status from user_subscriptions')).rows;
  for (const row of rows) assert.equal(row.status, row.payment_id.startsWith('GIFT_MANUAL_') ? 'canceled' : 'active');
});
test('database rechecks removed permissions and privileged recipients', async () => {
  await db.exec("update admin_profiles set allowed_tabs='{}'");
  await assert.rejects(call(), /permission denied/);
  await db.exec(`update admin_profiles set allowed_tabs=array['users.gift_sub'];
    insert into admin_profiles values ('${target}','super_admin','{}');`);
  await assert.rejects(call(), /recipient permission denied/);
  await db.exec(`update admin_profiles set role='super_admin' where user_id='${actor}'`);
  await call();
});
test('invalid duration, plan, action and nonexistent recipient do not mutate data', async () => {
  for (const args of [['grant_subscription', 'free', 30], ['grant_subscription', 'premium', 0],
    ['grant_subscription', 'premium', 366], ['grant_subscription', null, 30], [null, 'premium', 30],
    ['unexpected', 'premium', 30], ['grant_subscription', 'premium', 30, '44444444-4444-4444-8444-444444444444']]) {
    await assert.rejects(call(...args));
  }
  assert.equal((await db.query('select count(*)::integer n from audit_logs')).rows[0].n, 0);
  assert.equal((await db.query('select count(*)::integer n from user_subscriptions')).rows[0].n, 3);
});
test('only service_role can invoke the definer RPC', async () => {
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    try { await assert.rejects(call(), /permission denied/); } finally { await db.exec('reset role'); }
  }
  await db.exec('set role service_role');
  try {
    await call();
    await assert.rejects(db.query('select manage_manual_gift($1,$2,$3,$4,$5)', [actor,target,'grant_subscription','premium',30]), /permission denied/);
  } finally { await db.exec('reset role'); }
});

test('replayed grant preserves dates, creates one audit, and never resurrects a revoked gift', async () => {
  const id = randomUUID();
  await call('grant_subscription', 'premium', 30, target, id);
  const before = (await db.query('select * from user_subscriptions order by payment_id')).rows;
  await call('grant_subscription', 'premium', 30, target, id);
  assert.deepEqual((await db.query('select * from user_subscriptions order by payment_id')).rows, before);
  assert.equal((await db.query('select count(*)::integer n from audit_logs')).rows[0].n, 1);
  await call('revoke_gift', null, null);
  await call('grant_subscription', 'premium', 30, target, id);
  assert.equal((await db.query("select status from user_subscriptions where payment_id like 'GIFT_MANUAL_%'")).rows[0].status, 'canceled');
  assert.equal((await db.query('select count(*)::integer n from audit_logs')).rows[0].n, 2);
});
test('request IDs cannot be reused for changed parameters', async () => {
  const id = randomUUID();
  await call('grant_subscription', 'premium', 30, target, id);
  for (const args of [['grant_subscription','realtor',30,target,id], ['grant_subscription','premium',31,target,id],
    ['grant_subscription','premium',30,other,id], ['revoke_gift',null,null,target,id]]) {
    await assert.rejects(call(...args), error => error.code === 'CM409');
  }
  assert.equal((await db.query('select count(*)::integer n from manual_gift_operations')).rows[0].n, 1);
});
test('failed audit leaves no receipt and the same request can succeed after recovery', async () => {
  const id = randomUUID();
  await db.exec("alter table audit_logs add constraint reject_audit_for_test check (action <> 'GRANT_SUBSCRIPTION')");
  try { await assert.rejects(call('grant_subscription','premium',30,target,id)); }
  finally { await db.exec('alter table audit_logs drop constraint reject_audit_for_test'); }
  assert.equal((await db.query('select count(*)::integer n from manual_gift_operations')).rows[0].n, 0);
  await call('grant_subscription','premium',30,target,id);
  assert.equal((await db.query('select count(*)::integer n from manual_gift_operations')).rows[0].n, 1);
});

test('failed receipt write also rolls back the gift and its audit', async () => {
  const id = randomUUID();
  const original = (await db.query('select * from user_subscriptions order by payment_id')).rows;
  await db.exec("alter table manual_gift_operations add constraint reject_receipt_for_test check (action <> 'grant_subscription')");
  try { await assert.rejects(call('grant_subscription','premium',30,target,id)); }
  finally { await db.exec('alter table manual_gift_operations drop constraint reject_receipt_for_test'); }
  assert.deepEqual((await db.query('select * from user_subscriptions order by payment_id')).rows, original);
  assert.equal((await db.query('select count(*)::integer n from audit_logs')).rows[0].n, 0);
  await call('grant_subscription','premium',30,target,id);
});

test('granting same plan extends remaining active balance', async () => {
  await call('grant_subscription', 'premium', 10);
  await call('grant_subscription', 'premium', 20);
  const gift = (await db.query("select extract(epoch from ends_at-starts_at)::integer seconds from user_subscriptions where payment_id like 'GIFT_MANUAL_%'")).rows[0];
  assert.equal(gift.seconds, 30 * 86400);
});
