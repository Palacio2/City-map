import {test,before,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
const id=n=>`11111111-1111-4111-8111-${String(n).padStart(12,'0')}`;
before(async()=>{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    insert into auth.users values('${id(50)}'),('${id(51)}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated,service_role;
    create table countries(id uuid primary key,name text);
    create table cities(id uuid primary key,country_id uuid,name text,is_available boolean);
    create table districts(id uuid primary key,city_id uuid,name text,is_available boolean);
    create table user_district_visits(id uuid default gen_random_uuid(),user_id uuid,district_id uuid,visit_count integer,last_visited_at timestamptz,district_data jsonb,unique(user_id,district_id));
    create table user_comparison_history(id uuid default gen_random_uuid(),user_id uuid,districts_data jsonb,created_at timestamptz default now());
    create table user_activity_logs(id uuid default gen_random_uuid(),user_id uuid,activity_date date,searches_count integer default 0,comparisons_count integer default 0,unique(user_id,activity_date));
    create table user_stats(user_id uuid unique,viewed_districts_count integer default 0,comparison_count integer default 0,favorite_district jsonb,last_active timestamptz);
    grant all on user_activity_logs,user_comparison_history,user_district_visits to public,anon,authenticated;
    grant update(visit_count) on user_district_visits to authenticated;
    grant select(districts_data) on user_comparison_history to anon;
    create policy old_write on user_activity_logs for all using(true) with check(true);
    insert into countries values('${id(1)}','PL');
    insert into cities values('${id(2)}','${id(1)}','City',true),('${id(3)}','${id(1)}','Hidden',false);
    insert into districts values('${id(10)}','${id(2)}','A',true),('${id(11)}','${id(2)}','B',true),
      ('${id(12)}','${id(2)}','C',false),('${id(13)}','${id(3)}','D',true);`);
  const sql=await readFile(new URL('../migrations/20261018040338_protect_activity_writes.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
  const limits=await readFile(new URL('../migrations/20261018130836_limit_activity_events.sql',import.meta.url),'utf8');
  await db.exec(limits);await db.exec(limits);
});
beforeEach(async()=>{await db.exec(`reset role;truncate activity_event_limits,user_stats,user_activity_logs,user_comparison_history,user_district_visits;select set_config('test.uid','${id(50)}',false);`);});
after(()=>db.close());
const as=async(role,fn)=>{await db.exec('set role '+role);try{return await fn();}finally{await db.exec('reset role');}};
const visit=value=>db.query('select track_district_visit($1::jsonb)',[JSON.stringify(value)]);
const compare=value=>db.query('select register_comparison_event($1::jsonb)',[JSON.stringify(value)]);
test('RPCs persist canonical location only and create comparison totals for new users',async()=>{
  await as('authenticated',()=>compare([{id:id(11),city:'forged',extra:'discard'},{id:id(10)}]));
  assert.deepEqual((await db.query('select districts_data from user_comparison_history')).rows[0].districts_data,
    [{id:id(11),city:'City',country:'PL'},{id:id(10),city:'City',country:'PL'}]);
  await as('authenticated',()=>visit({id:id(10),city:'forged',country:'wrong'}));
  const stats=(await db.query('select * from user_stats')).rows[0];
  assert.equal(stats.comparison_count,1);assert.equal(stats.viewed_districts_count,1);
  assert.deepEqual(stats.favorite_district,{id:id(10),city:'City',country:'PL'});
  assert.deepEqual((await db.query('select searches_count,comparisons_count from user_activity_logs')).rows,[{searches_count:1,comparisons_count:1}]);
});
test('invalid, oversized, duplicate, hidden and nonexistent districts cannot write activity',async()=>{
  await as('authenticated',async()=>{
    for(const v of [null,[],{},'x',{id:2},{id:'bad'},{id:id(12)},{id:id(13)},{id:id(99)},{id:id(10),extra:'x'.repeat(4096)}]) await assert.rejects(visit(v));
    for(const v of [null,{},[],[{id:id(10)}],Array(5).fill({id:id(10)}),[{id:id(10)},{id:id(10)}],
      [{id:id(10)},{id:id(12)}],[{id:id(10)},null],[{id:id(10)},{id:id(11),extra:'x'.repeat(16384)}]]) await assert.rejects(compare(v));
  });
  for(const tbl of ['user_stats','user_activity_logs','user_comparison_history','user_district_visits']) assert.equal((await db.query('select * from '+tbl)).rows.length,0);
});
test('direct writes and anonymous reads/RPCs are denied; own reads and backend access remain',async()=>{
  await as('authenticated',()=>visit({id:id(10)}));
  await as('authenticated',async()=>{
    assert.equal((await db.query('select * from user_district_visits')).rows.length,1);
    await assert.rejects(db.exec('update user_district_visits set visit_count=999'),/permission denied/);
    for(const tbl of ['user_activity_logs','user_comparison_history','user_district_visits']){
      await assert.rejects(db.exec('insert into '+tbl+' default values'),/permission denied/);
      await assert.rejects(db.exec('delete from '+tbl),/permission denied/);
    }
  });
  await db.exec(`select set_config('test.uid','${id(51)}',false)`);
  await as('authenticated',async()=>{assert.equal((await db.query('select * from user_district_visits')).rows.length,0);});
  await as('service_role',async()=>{assert.equal((await db.query('select * from user_district_visits')).rows.length,1);});
  await as('anon',async()=>{
    await assert.rejects(visit({id:id(10)}),/permission denied/);
    await assert.rejects(compare([{id:id(10)},{id:id(11)}]),/permission denied/);
    await assert.rejects(db.exec('select districts_data from user_comparison_history'),/permission denied/);
  });
  await db.exec("select set_config('test.uid','',false)");
  await as('authenticated',()=>assert.rejects(visit({id:id(10)}),/Authentication required/));
});
test('downstream failure rolls back all activity writes',async()=>{
  await db.exec('alter table user_stats add constraint fail_write check(false) not valid');
  try{await as('authenticated',async()=>{
    await assert.rejects(visit({id:id(10)}),/check constraint/);
    await assert.rejects(compare([{id:id(10)},{id:id(11)}]),/check constraint/);
  });}finally{await db.exec('alter table user_stats drop constraint fail_write');}
  for(const tbl of ['user_activity_logs','user_comparison_history','user_district_visits']) assert.equal((await db.query('select * from '+tbl)).rows.length,0);
  assert.equal((await db.query('select * from activity_event_limits')).rows.length,0);
});
test('counter saturation avoids integer overflow',async()=>{
  await as('authenticated',()=>visit({id:id(10)}));
  await db.exec('update user_district_visits set visit_count=2147483647;update user_activity_logs set searches_count=2147483647,comparisons_count=2147483647;update user_stats set viewed_districts_count=2147483647,comparison_count=2147483647');
  await db.exec("update activity_event_limits set last_accepted_at=clock_timestamp()-interval '31 seconds'");
  await as('authenticated',async()=>{await visit({id:id(10)});await compare([{id:id(10)},{id:id(11)}]);});
  assert.equal((await db.query('select visit_count from user_district_visits')).rows[0].visit_count,2147483647);
  assert.equal((await db.query('select comparison_count from user_stats')).rows[0].comparison_count,2147483647);
});

test('duplicate visits and reordered comparisons share a 30-second receipt',async()=>{
  await as('authenticated',async()=>{
    await visit({id:id(10)});await visit({id:id(10),city:'changed'});
    await compare([{id:id(10)},{id:id(11)}]);await compare([{id:id(11)},{id:id(10)}]);
  });
  assert.equal((await db.query('select count(*)::int n from user_comparison_history')).rows[0].n,1);
  assert.equal((await db.query('select visit_count from user_district_visits')).rows[0].visit_count,1);
  await db.exec("update activity_event_limits set last_accepted_at=clock_timestamp()-interval '31 seconds'");
  await as('authenticated',()=>visit({id:id(10)}));
  assert.equal((await db.query('select visit_count from user_district_visits')).rows[0].visit_count,2);
});
test('minute caps apply across different districts, reset on server time, and isolate accounts',async()=>{
  await as('authenticated',async()=>{for(let n=0;n<65;n++) await visit({id:id(10+n%2)});});
  assert.equal((await db.query('select viewed_districts_count from user_stats')).rows[0].viewed_districts_count,60);
  await db.exec("update activity_event_limits set minute_started_at=clock_timestamp()-interval '61 seconds',last_signature=null");
  await as('authenticated',()=>visit({id:id(10)}));
  assert.equal((await db.query('select viewed_districts_count from user_stats')).rows[0].viewed_districts_count,61);
  await db.exec(`select set_config('test.uid','${id(51)}',false)`);
  await as('authenticated',()=>visit({id:id(10)}));
  assert.equal((await db.query('select viewed_districts_count from user_stats where user_id=$1',[id(51)])).rows[0].viewed_districts_count,1);
});
test('comparison minute limit and independent daily ceilings cannot be bypassed by window reset',async()=>{
  for(const kind of ['visit','comparison']){
    const send=()=>as('authenticated',()=>kind==='visit'?visit({id:id(10)}):compare([{id:id(10)},{id:id(11)}]));
    await send();
    await db.query('update activity_event_limits set minute_count=$1,last_signature=null where event_kind=$2',[kind==='visit'?60:12,kind]);
    await send();
    assert.equal((await db.query('select day_count from activity_event_limits where event_kind=$1',[kind])).rows[0].day_count,1);
    await db.query("update activity_event_limits set minute_started_at=clock_timestamp()-interval '61 seconds',day_count=$1 where event_kind=$2",[kind==='visit'?1000:200,kind]);
    await send();
    assert.equal((await db.query('select minute_count from activity_event_limits where event_kind=$1',[kind])).rows[0].minute_count,kind==='visit'?60:12);
    await db.query("update activity_event_limits set activity_day=(clock_timestamp() at time zone 'UTC')::date-1 where event_kind=$1",[kind]);
    await send();
    assert.equal((await db.query('select day_count from activity_event_limits where event_kind=$1',[kind])).rows[0].day_count,1);
  }
});
test('quota storage and helper are private and account deletion removes receipts',async()=>{
  await as('authenticated',()=>visit({id:id(10)}));
  for(const role of ['anon','authenticated','service_role']) await as(role,async()=>{
    await assert.rejects(db.exec('select * from activity_event_limits'),/permission denied/);
    await assert.rejects(db.exec('delete from activity_event_limits'),/permission denied/);
    await assert.rejects(db.exec("select claim_activity_event('visit','fake')"),/permission denied/);
  });
  await db.query('delete from auth.users where id=$1',[id(50)]);
  assert.equal((await db.query('select * from activity_event_limits')).rows.length,0);
  await db.query('insert into auth.users values($1)',[id(50)]);
});
