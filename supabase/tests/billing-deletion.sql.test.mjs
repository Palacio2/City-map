import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
const users=[1,2,3].map(n=>`11111111-1111-4111-8111-11111111111${n}`);
before(async()=>{
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key);
    create table billing_checkout_state(user_id uuid primary key references auth.users(id) on delete cascade,session_id text);
    create table user_subscriptions(user_id uuid references auth.users(id) on delete cascade,payment_id text,status text);
    insert into auth.users values ${users.map(id=>`('${id}')`).join(',')};
    insert into billing_checkout_state values('${users[0]}',null);
    insert into user_subscriptions values('${users[1]}','SUB_sub_old','canceled'),('${users[2]}','GIFT_MANUAL_fixture','active');`);
  const sql=await readFile(new URL('../migrations/20261016142907_guard_billing_account_deletion.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
});
after(()=>db.close());
test('uncertain checkout creation cannot be lost through Auth cascade deletion',async()=>{
  await assert.rejects(db.query('delete from auth.users where id=$1',[users[0]]),/Billing reconciliation required/);
  assert.equal((await db.query('select count(*)::integer n from billing_checkout_state')).rows[0].n,1);
});
test('locally terminal Stripe links remain until a verified reconciliation workflow exists',async()=>{
  await assert.rejects(db.query('delete from auth.users where id=$1',[users[1]]),/Billing reconciliation required/);
  assert.equal((await db.query('select count(*)::integer n from auth.users where id=$1',[users[1]])).rows[0].n,1);
});
test('accounts with only non-billable gifts can still be deleted',async()=>{
  await db.query('delete from auth.users where id=$1',[users[2]]);
  assert.equal((await db.query('select count(*)::integer n from user_subscriptions where user_id=$1',[users[2]])).rows[0].n,0);
});
