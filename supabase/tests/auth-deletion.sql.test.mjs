import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
const actor='11111111-1111-4111-8111-111111111111';
const target='22222222-2222-4222-8222-222222222222';
before(async()=>{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    create table admin_profiles(user_id uuid primary key references auth.users on delete cascade,role text,allowed_tabs text[]);
    create table audit_logs(admin_id uuid references auth.users on delete set null,action text,target_table text,record_id text,new_data jsonb);
    create table billing_checkout_state(user_id uuid references auth.users on delete cascade);
    create table user_subscriptions(user_id uuid references auth.users on delete cascade,payment_id text);`);
  for(const file of ['20261016142907_guard_billing_account_deletion.sql','20261017132356_audited_auth_deletion.sql']){
    const sql=await readFile(new URL('../migrations/'+file,import.meta.url),'utf8');
    await db.exec(sql);await db.exec(sql);
  }
});
beforeEach(async()=>{
  await db.exec(`truncate auth.users cascade;truncate admin_user_deletions;
    insert into auth.users values('${actor}'),('${target}');
    insert into admin_profiles values('${actor}','admin',array['users.delete']),('${target}','user','{}');`);
});
after(()=>db.close());
const prepare=()=>db.query('select prepare_admin_user_deletion($1,$2) completed',[actor,target]);
const remove=()=>db.query('delete from auth.users where id=$1',[target]);
test('receipt and completion survive Auth deletion and identify a completed retry',async()=>{
  assert.equal((await prepare()).rows[0].completed,false);
  await remove();
  assert.equal((await prepare()).rows[0].completed,true);
  const logs=(await db.query('select action,admin_id,new_data from audit_logs order by action')).rows;
  assert.equal(logs.length,2);
  assert.equal(logs[0].action,'auth_user_deleted');
  assert.equal(logs[0].admin_id,null);
  assert.equal(logs[0].new_data.prior_requested_by,actor);
  assert.equal(logs[1].admin_id,actor);
});
test('failed preparation audit leaves no pending request',async()=>{
  await db.exec('alter table audit_logs add constraint reject_log check(false) not valid');
  try {await assert.rejects(prepare(),/check constraint/);}
  finally {await db.exec('alter table audit_logs drop constraint reject_log');}
  assert.equal((await db.query('select * from admin_user_deletions')).rows.length,0);
});
test('failed completion audit rolls back Auth delete and its cascades',async()=>{
  await prepare();
  await db.exec("alter table audit_logs add constraint reject_log check(action<>'auth_user_deleted') not valid");
  try {await assert.rejects(remove(),/check constraint/);}
  finally {await db.exec('alter table audit_logs drop constraint reject_log');}
  assert.equal((await db.query('select * from auth.users')).rows.length,2);
  assert.equal((await db.query('select * from admin_profiles')).rows.length,2);
  assert.equal((await db.query('select completed_at from admin_user_deletions')).rows[0].completed_at,null);
  await remove();
});
test('billing added after preparation still blocks the actual deletion',async()=>{
  await prepare();
  await db.query("insert into user_subscriptions values($1,'SUB_sub_fixture')",[target]);
  await assert.rejects(remove(),/Billing reconciliation/);
  await assert.rejects(prepare(),/Billing reconciliation/);
  assert.equal((await db.query('select completed_at from admin_user_deletions')).rows[0].completed_at,null);
});
test('current permission, target hierarchy and self-delete are checked in SQL',async()=>{
  await assert.rejects(db.query('select prepare_admin_user_deletion($1,$1)',[actor]),/Invalid deletion/);
  await db.exec(`update admin_profiles set role='admin' where user_id='${target}'`);
  await assert.rejects(prepare(),/Only super admin/);
  await db.exec(`update admin_profiles set role='super_admin' where user_id='${actor}'`);
  await prepare();
  await db.exec(`update admin_profiles set role='user' where user_id='${actor}'`);
  await assert.rejects(prepare(),/permission required/);
});
test('deletion outside the admin endpoint is observed without fabricated requester',async()=>{
  await remove();
  const log=(await db.query('select * from audit_logs')).rows[0];
  assert.equal(log.admin_id,null);assert.equal(log.new_data.prior_requested_by,null);
  await assert.rejects(prepare(),/not found/);
});
test('receipt cannot be forged or read by browser or service clients',async()=>{
  for(const role of ['anon','authenticated','service_role']){
    await db.exec(`set role ${role}`);
    try {
      await assert.rejects(db.query('select * from admin_user_deletions'),/permission denied/);
      if(role!=='service_role') await assert.rejects(prepare(),/permission denied/);
      else await prepare();
    } finally {await db.exec('reset role');}
  }
});
