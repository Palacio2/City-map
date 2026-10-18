import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
const actor='11111111-1111-4111-8111-111111111111';
let country,city;
const call=async(action,payload)=>(await db.query('select admin_geography_action($1,$2,$3) result',[actor,action,payload])).rows[0].result;
before(async()=>{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create table admin_profiles(user_id uuid primary key,role text,allowed_tabs text[],assigned_cities uuid[]);
    create table countries(id uuid primary key default gen_random_uuid(),name text unique not null);
    create table cities(id uuid primary key default gen_random_uuid(),name text not null,country_id uuid not null references countries on delete cascade);
    create table districts(id uuid primary key default gen_random_uuid(),name text not null,city_id uuid not null references cities on delete cascade,unique(name,city_id));
    create table district_geo_data(district_id uuid primary key references districts on delete cascade,geojson jsonb);
    create table audit_logs(admin_id uuid,action text,target_table text,record_id text,new_data jsonb);
    insert into admin_profiles values('${actor}','admin',array['manual.create.country','manual.create.city','manual.create.district','manual.delete','manual.gis'],'{}');`);
  const sql=await readFile(new URL('../migrations/20261017053428_atomic_geography_admin_actions.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
  country=await call('create_country',{name:'Country'});
  city=await call('create_city',{name:'City',countryId:country.id});
});
after(()=>db.close());

test('city creation assigns the verified actor and preserves previous assignments',async()=>{
  const next=await call('create_city',{name:'Second',countryId:country.id});
  const profile=(await db.query('select assigned_cities from admin_profiles')).rows[0];
  assert.deepEqual(profile.assigned_cities,[city.id,next.id]);
  const audit=(await db.query("select * from audit_logs where record_id=$1",[next.id])).rows[0];
  assert.equal(audit.admin_id,actor);assert.equal(audit.action,'create_city');
});
test('audit failure rolls back city creation AND its access assignment',async()=>{
  const prior=(await db.query('select assigned_cities from admin_profiles')).rows[0].assigned_cities;
  await db.exec("alter table audit_logs add constraint fail_city check(action<>'create_city') not valid");
  try {
    await assert.rejects(call('create_city',{name:'Must rollback',countryId:country.id}),/check constraint/);
    assert.equal((await db.query("select count(*)::int n from cities where name='Must rollback'")).rows[0].n,0);
    assert.deepEqual((await db.query('select assigned_cities from admin_profiles')).rows[0].assigned_cities,prior);
  } finally { await db.exec('alter table audit_logs drop constraint fail_city'); }
});
test('assignment failure leaves no orphan city or successful audit',async()=>{
  await db.exec('alter table admin_profiles add constraint fail_assignment check(cardinality(assigned_cities)<3) not valid');
  try {
    await assert.rejects(call('create_city',{name:'Assignment failed',countryId:country.id}),/check constraint/);
    assert.equal((await db.query("select count(*)::int n from cities where name='Assignment failed'")).rows[0].n,0);
  } finally { await db.exec('alter table admin_profiles drop constraint fail_assignment'); }
});
test('database rechecks current permissions and city scope independently of Edge',async()=>{
  const foreign=(await db.query("insert into cities(name,country_id) values('Foreign',$1) returning id",[country.id])).rows[0].id;
  await assert.rejects(call('create_district',{name:'Forbidden',cityId:foreign}),/outside assigned scope/);
  await assert.rejects(call('delete_country',{id:country.id}),/Missing geography permission/);
  await db.exec("update admin_profiles set role='user'");
  try { await assert.rejects(call('create_city',{name:'Revoked',countryId:country.id}),/Admin required/); }
  finally { await db.exec("update admin_profiles set role='admin'"); }
});
test('invalid batch rolls back earlier district inserts',async()=>{
  await assert.rejects(call('create_districts',{cityId:city.id,names:['Batch valid','']}),/Invalid district name/);
  assert.equal((await db.query("select count(*)::int n from districts where name='Batch valid'")).rows[0].n,0);
});
test('GeoJSON import is atomic, counts matches and rejects ambiguous repeated targets',async()=>{
  const district=await call('create_district',{cityId:city.id,name:'Import district'});
  const payload={cityId:city.id,features:[{name:'import DISTRICT',geojson:{type:'Point',coordinates:[1,2]}}]};
  assert.deepEqual(await call('import_geojson',payload),{success:true,count:1});
  await assert.rejects(call('import_geojson',{cityId:city.id,features:[...payload.features,{name:'Import district',geojson:{}}]}),/duplicate/);
  await db.exec("alter table audit_logs add constraint fail_geo check(action<>'import_geojson') not valid");
  try { await assert.rejects(call('import_geojson',{cityId:city.id,features:[{name:'Import district',geojson:{type:'Point',coordinates:[3,4]}}]}),/check constraint/); }
  finally { await db.exec('alter table audit_logs drop constraint fail_geo'); }
  assert.deepEqual((await db.query('select geojson from district_geo_data where district_id=$1',[district.id])).rows[0].geojson,{type:'Point',coordinates:[1,2]});
});
test('audit failure rolls back deletion and cascading geometry removal',async()=>{
  const district=(await db.query("select id from districts where name='Import district'")).rows[0];
  await db.exec("alter table audit_logs add constraint fail_delete check(action<>'delete_district') not valid");
  try { await assert.rejects(call('delete_district',{districtId:district.id}),/check constraint/); }
  finally { await db.exec('alter table audit_logs drop constraint fail_delete'); }
  assert.equal((await db.query('select count(*)::int n from district_geo_data where district_id=$1',[district.id])).rows[0].n,1);
  assert.deepEqual(await call('delete_district',{districtId:district.id}),{success:true});
});
test('anonymous and authenticated callers cannot forge the service-only actor',async()=>{
  for(const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    try { await assert.rejects(call('create_country',{name:'Forged'}),/permission denied/); }
    finally { await db.exec('reset role'); }
  }
});
test('super-admin country deletion audits and cascades its geography atomically',async()=>{
  await db.exec("update admin_profiles set role='super_admin'");
  try {
    const parent=await call('create_country',{name:'Disposable country'});
    const child=await call('create_city',{name:'Disposable city',countryId:parent.id});
    await call('create_district',{name:'Disposable district',cityId:child.id});
    await db.exec("alter table audit_logs add constraint fail_country check(action<>'delete_country') not valid");
    try { await assert.rejects(call('delete_country',{id:parent.id}),/check constraint/); }
    finally { await db.exec('alter table audit_logs drop constraint fail_country'); }
    assert.equal((await db.query('select count(*)::int n from districts where city_id=$1',[child.id])).rows[0].n,1);
    await call('delete_country',{id:parent.id});
    assert.equal((await db.query('select count(*)::int n from cities where id=$1',[child.id])).rows[0].n,0);
    assert.equal((await db.query("select count(*)::int n from audit_logs where action='delete_country' and record_id=$1",[parent.id])).rows[0].n,1);
  } finally { await db.exec("update admin_profiles set role='admin'"); }
});
