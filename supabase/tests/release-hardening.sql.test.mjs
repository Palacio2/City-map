import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
const actor='11111111-1111-4111-8111-111111111111';
before(async()=>{
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, raw_app_meta_data jsonb, updated_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    create table admin_profiles(user_id uuid primary key,role text,allowed_tabs text[],assigned_cities uuid[]);
    create table global_notifications(id uuid primary key default gen_random_uuid(), is_active boolean,message text,type text,created_by uuid,created_at timestamptz default now());
    create table contacts_messages(id uuid);
    create table districts(id uuid primary key,is_available boolean,city_id uuid,name text,updated_at timestamptz);
    create table cities(id uuid primary key,name text,country_id uuid,is_available boolean);
    create table countries(id uuid primary key,name text);
    create table user_district_visits(district_id uuid,visit_count integer);
    create table district_photos(id uuid default gen_random_uuid(),district_id uuid unique,photo_url text,is_main boolean,updated_at timestamptz);
    create table district_geo_data(district_id uuid unique,geojson jsonb,poi_data jsonb);
    create table district_filter_data(district_id uuid unique,average_rent_price numeric check(average_rent_price>=0),last_updated timestamptz);
    create table audit_logs(admin_id uuid,action text,target_table text,record_id text,new_data jsonb);
    create table ai_system_logs(id uuid);
    create table fields_config(field_code text primary key,is_active boolean,is_premium boolean,is_realtor_only boolean);
    create table district_comments(id uuid default gen_random_uuid(),user_id uuid,content text,created_at timestamptz default now());
    create table parser_jobs(id uuid primary key default gen_random_uuid(),city_name text,status text,config jsonb,results jsonb,logs jsonb default '[]',progress integer,started_at timestamptz,completed_at timestamptz,created_at timestamptz default now(),error_message text);
    grant all on all tables in schema public to anon,authenticated,service_role;
    alter table districts enable row level security; alter table district_photos enable row level security;
    create policy old_public on districts for select using(true);
    create policy old_public on district_photos for select using(true);
    insert into admin_profiles(user_id,role) values ('${actor}','super_admin');
    insert into districts(id,is_available) values ('${actor}',false);
    insert into district_photos(id,district_id) values (gen_random_uuid(),'${actor}');
    select set_config('test.uid','${actor}',false);
  `);
  const sql=await readFile(new URL('../migrations/20261015150947_release_audit_hardening.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
});

test('role change preserves metadata and rolls back both stores when audit fails',async()=>{
  const target='44444444-4444-4444-8444-444444444444';
  await db.query('insert into auth.users(id,raw_app_meta_data) values($1,$2)',[target,{provider:'email',role:'user'}]);
  await db.query('insert into admin_profiles(user_id,role,allowed_tabs) values($1,$2,$3)',[target,'user',['manual.save']]);
  await db.query("select set_admin_role($1,$2,'admin')",[actor,target]);
  assert.deepEqual((await db.query('select raw_app_meta_data from auth.users where id=$1',[target])).rows[0].raw_app_meta_data,{provider:'email',role:'admin'});
  assert.deepEqual((await db.query('select allowed_tabs from admin_profiles where user_id=$1',[target])).rows[0].allowed_tabs,['manual.save']);
  await db.exec("alter table audit_logs add constraint test_role_audit check(action<>'update_role') not valid");
  try {
    await assert.rejects(db.query("select set_admin_role($1,$2,'user')",[actor,target]),/check constraint/);
    assert.equal((await db.query('select role from admin_profiles where user_id=$1',[target])).rows[0].role,'admin');
    assert.equal((await db.query('select raw_app_meta_data from auth.users where id=$1',[target])).rows[0].raw_app_meta_data.role,'admin');
  } finally { await db.exec('alter table audit_logs drop constraint test_role_audit'); }
});
after(()=>db.close());
test('durable contact quotas normalize email, bind verified users and limit rotated identities',async()=>{
  const claim=async(email,user=null)=>(await db.query('select claim_contact_request($1,$2) allowed',[email,user])).rows[0].allowed;
  for(let i=0;i<3;i++) assert.equal(await claim('Test@example.invalid'),true);
  assert.equal(await claim(' test@EXAMPLE.invalid '),false);
  for(let i=0;i<10;i++) assert.equal(await claim(`user${i}@example.invalid`,actor),true);
  assert.equal(await claim('rotated@example.invalid',actor),false);
  for(let i=13;i<200;i++) assert.equal(await claim(`guest${i}@example.invalid`),true);
  assert.equal(await claim('another@example.invalid'),false);
  await db.exec("update contact_request_limits set created_at=now()-interval '2 hours'");
  assert.equal(await claim('test@example.invalid'),true);
  await db.exec('set role anon');
  try {await assert.rejects(db.exec('select * from contact_request_limits'),/permission denied/);}
  finally {await db.exec('reset role');}
});
test('browser cannot self-promote and only reads its own profile',async()=>{
  await db.exec('set role authenticated');
  try {
    assert.equal((await db.query('select * from admin_profiles')).rows.length,1);
    await assert.rejects(db.exec("update admin_profiles set role='super_admin'"),/permission denied/);
    await assert.rejects(db.exec('select * from contacts_messages'),/permission denied/);
    for (const table of ['audit_logs','ai_system_logs']) {
      await assert.rejects(db.exec(`select * from ${table}`),/permission denied/);
      await assert.rejects(db.exec(`delete from ${table}`),/permission denied/);
    }
    await assert.rejects(db.exec("insert into audit_logs(action) values('forged_success')"),/permission denied/);
  } finally {await db.exec('reset role');}
});
test('restrictive guards hide unavailable geography despite permissive legacy policies',async()=>{
  await db.exec('set role anon');
  try {
    assert.equal((await db.query('select * from districts')).rows.length,0);
    assert.equal((await db.query('select * from district_photos')).rows.length,0);
  } finally {await db.exec('reset role');}
});
test('invalid field codes and oversized direct comments fail at database boundary',async()=>{
  await assert.rejects(db.exec("insert into fields_config values ('New-field',true,false,false)"),/check constraint/);
  await db.exec("insert into fields_config values ('average_rent_price',true,false,false)");
  await assert.rejects(db.exec("insert into fields_config values ('unknown_metric',true,false,false)"),/existing district metric column/);
  await assert.rejects(db.exec("update fields_config set field_code='district_id' where field_code='average_rent_price'"),/existing district metric column/);
  assert.equal((await db.query("select field_code from fields_config")).rows[0].field_code,'average_rent_price');
  await assert.rejects(db.query('insert into district_comments(user_id,content) values ($1,$2)',[actor,'x'.repeat(5001)]),/check constraint/);
});
test('comment quota rejects the 21st write, with no partial insert',async()=>{
  for(let i=0;i<20;i++) await db.query('insert into district_comments(user_id,content) values($1,$2)',[actor,'hello']);
  await assert.rejects(db.query('insert into district_comments(user_id,content) values($1,$2)',[actor,'hello']),/rate limit/);
  assert.equal((await db.query('select count(*)::integer n from district_comments')).rows[0].n,20);
});

test('parser acquisition is exclusive, expired workers cannot save, logs remain associated with the job',async()=>{
  const claim=async()=> (await db.query("select claim_parser_job('{\"cityName\":\"Fixture\"}') job")).rows[0].job;
  const first=await claim(); assert.ok(first.id);
  assert.equal(await claim(),null);
  await db.query("select append_parser_logs($1,$2,'[{\"message\":\"first\"}]')",[first.id,first.lease_token]);
  await db.exec("update parser_jobs set lease_until=now()-interval '1 second'");
  const second=await claim();assert.notEqual(second.id,first.id);
  await assert.rejects(db.query("select update_parser_job($1,$2,'{\"status\":\"completed\"}')",[first.id,first.lease_token]),/lease lost/);
  await db.query("select update_parser_job($1,$2,'{\"status\":\"completed\"}')",[second.id,second.lease_token]);
  await db.query("select append_parser_logs($1,$2,'[{\"message\":\"last\"}]')",[second.id,second.lease_token]);
  assert.deepEqual((await db.query('select logs from parser_jobs where id=$1',[second.id])).rows[0].logs,[{message:'last'}]);
});

test('popular city visits are not multiplied by the district count',async()=>{
  await db.exec(`insert into countries values('${actor}','Country');
    insert into cities values('${actor}','City','${actor}',true);
    insert into districts(id,is_available,city_id) values('22222222-2222-4222-8222-222222222222',true,'${actor}'),('33333333-3333-4333-8333-333333333333',true,'${actor}');
    insert into user_district_visits values('22222222-2222-4222-8222-222222222222',2),('33333333-3333-4333-8333-333333333333',3);`);
  const row=(await db.query('select * from popular_cities_view')).rows[0];
  assert.equal(Number(row.districts_count),2);assert.equal(Number(row.total_visits),5);
});

test('notification failure cannot deactivate the previous announcement',async()=>{
  await db.query("insert into global_notifications(message,is_active) values('Existing',true)");
  await db.exec("alter table global_notifications add constraint test_message check(message<>'Rejected')");
  await assert.rejects(db.query("select save_global_notification($1,'create',$2)",[actor,{message:'Rejected',is_active:true}]),/check constraint/);
  assert.equal((await db.query('select count(*)::integer n from global_notifications where is_active')).rows[0].n,1);
  await db.query("select save_global_notification($1,'create',$2)",[actor,{message:'Replacement',is_active:true}]);
  assert.deepEqual((await db.query('select message from global_notifications where is_active')).rows,[{message:'Replacement'}]);
});

test('district metadata, geometry, metrics and audit roll back together on invalid metrics',async()=>{
  await assert.rejects(db.query('select save_district_bundle($1,$2)',[actor,[
    {district_id:'22222222-2222-4222-8222-222222222222',metrics:{city_population:100}},
    {district_id:'33333333-3333-4333-8333-333333333333',metrics:{city_population:200}},
  ]]),/Conflicting city population/);
  const row={district_id:actor,base:{name:'Before'},geo:{geojson:{type:'Before'}},metrics:{average_rent_price:1250.45}};
  await db.query('select save_district_bundle($1,$2)',[actor,[row]]);
  await assert.rejects(db.query('select save_district_bundle($1,$2)',[actor,[{...row,base:{name:'After'},geo:{geojson:{type:'After'}},metrics:{average_rent_price:-1}}]]),/check constraint/);
  assert.equal((await db.query('select name from districts where id=$1',[actor])).rows[0].name,'Before');
  assert.deepEqual((await db.query('select geojson from district_geo_data where district_id=$1',[actor])).rows[0].geojson,{type:'Before'});
  assert.equal((await db.query("select count(*)::integer n from audit_logs where action='save_district'")).rows[0].n,1);
  await assert.rejects(db.query('select save_district_bundle($1,$2)',[actor,[{district_id:actor,metrics:{invented_column:1}}]]),/Invalid district column/);
});
