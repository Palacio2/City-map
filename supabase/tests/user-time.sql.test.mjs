import {test,before,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
const actor='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
before(async()=>{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated,service_role;
    create table user_stats(id uuid default gen_random_uuid(),user_id uuid unique references auth.users on delete cascade,
      total_time_seconds integer default 0,last_active timestamptz,comparison_count integer default 0,
      is_terms_accepted boolean default false,terms_accepted_at timestamptz);
    grant all on user_stats to public,anon,authenticated,service_role;
    grant update(total_time_seconds) on user_stats to authenticated;
    alter table user_stats enable row level security;
    create policy old_write on user_stats for all using(user_id=auth.uid()) with check(user_id=auth.uid());
    insert into auth.users values('${actor}'),('${other}');`);
  const sql=await readFile(new URL('../migrations/20261018034951_protect_user_time_accounting.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
});
beforeEach(async()=>{await db.exec(`reset role;truncate user_stats,user_time_receipts;select set_config('test.uid','${actor}',false);`);});
after(()=>db.close());
const runAs=async(role,fn)=>{await db.exec('set role '+role);try{return await fn();}finally{await db.exec('reset role');}};
const credit=(fn,seconds)=>db.query(`select public.${fn}($1)`,[seconds]);
const total=async()=>Number((await db.query('select total_time_seconds from user_stats where user_id=$1',[actor])).rows[0]?.total_time_seconds??0);
test('direct RPC rejects invalid increments before creating state and anonymous callers lack access',async()=>{
  for(const fn of ['update_user_time','increment_user_time']){
    for(const value of [null,-1,0,601,2147483647]) await runAs('authenticated',()=>assert.rejects(credit(fn,value),/between 1 and 600/));
    await runAs('anon',()=>assert.rejects(credit(fn,10),/permission denied/));
  }
  assert.equal((await db.query('select * from user_time_receipts')).rows.length,0);
  await db.query("select set_config('test.uid','',false)");
  await runAs('authenticated',()=>assert.rejects(credit('increment_user_time',10),/Authentication required/));
});
test('both RPCs share one allowance and repeated tabs cannot count the same interval twice',async()=>{
  await runAs('authenticated',()=>credit('update_user_time',300));
  await runAs('authenticated',()=>credit('increment_user_time',300));
  assert.equal(await total(),300);
  await db.exec("update user_time_receipts set last_recorded_at=clock_timestamp()-interval '30 seconds'");
  await runAs('authenticated',()=>credit('increment_user_time',300));
  assert.equal(await total(),330);
});
test('consent upsert works for new and existing rows without allowing counter edits or deletion',async()=>{
  await runAs('authenticated',async()=>{
    for(let i=0;i<2;i++) await db.query(`insert into user_stats(user_id,is_terms_accepted,terms_accepted_at) values($1,true,now())
      on conflict(user_id) do update set user_id=excluded.user_id,is_terms_accepted=excluded.is_terms_accepted,terms_accepted_at=excluded.terms_accepted_at`,[actor]);
    await assert.rejects(db.exec('update user_stats set total_time_seconds=999'),/permission denied/);
    await assert.rejects(db.exec('delete from user_stats'),/permission denied/);
    await assert.rejects(db.query('insert into user_stats(user_id,total_time_seconds) values($1,999)',[other]),/permission denied/);
    await assert.rejects(db.query('update user_stats set user_id=$1',[other]),/row-level security/);
    await assert.rejects(db.query('insert into user_stats(user_id,is_terms_accepted) values($1,true)',[other]),/row-level security/);
  });
  assert.equal(await total(),0);
});
test('clock is private and a failed stats write rolls back its creation',async()=>{
  for(const role of ['anon','authenticated','service_role']) await runAs(role,()=>assert.rejects(db.exec('select * from user_time_receipts'),/permission denied/));
  await db.exec('alter table user_stats add constraint reject_stats check(false) not valid');
  try{await runAs('authenticated',()=>assert.rejects(credit('increment_user_time',30),/check constraint/));}
  finally{await db.exec('alter table user_stats drop constraint reject_stats');}
  assert.equal((await db.query('select * from user_time_receipts')).rows.length,0);
});
test('totals cannot overflow and changing accounts cannot alter another user',async()=>{
  await db.query('insert into user_stats(user_id,total_time_seconds) values($1,2147483640)',[actor]);
  await runAs('authenticated',()=>credit('update_user_time',30));
  assert.equal(await total(),2147483647);
  await db.query("select set_config('test.uid',$1,false)",[other]);
  await runAs('authenticated',()=>credit('increment_user_time',20));
  assert.equal((await db.query('select total_time_seconds from user_stats where user_id=$1',[other])).rows[0].total_time_seconds,20);
  assert.equal(await total(),2147483647);
});
