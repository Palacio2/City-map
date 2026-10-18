import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { build } from 'esbuild';
const db=new PGlite();const actor='11111111-1111-4111-8111-111111111111';
const contact='22222222-2222-4222-8222-222222222222';
const context=async(role='service_role',id=actor)=>{
  await db.query("select set_config('request.jwt.claims',$1,false),set_config('request.headers',$2,false)",[
    JSON.stringify({role}),JSON.stringify(id?{'x-citymaps-admin-actor':id}:{})]);
};
before(async()=>{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create table admin_profiles(user_id uuid primary key,role text);
    insert into admin_profiles values('${actor}','admin');
    create table audit_logs(admin_id uuid,action text,target_table text,record_id text,new_data jsonb);
    create table contacts_messages(id uuid primary key,status text,message text);
    insert into contacts_messages values('${contact}','new','private message');
    create table translations(translation_key text primary key,uk text);
    create table fields_config(id uuid primary key);
    create table field_groups(id text primary key);
    create table scraper_rules(id uuid primary key);
    create table global_notifications(id uuid primary key);
    create table district_comments(id uuid primary key);`);
  const sql=await readFile(new URL('../migrations/20261017125702_bind_admin_mutations_to_audit.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
});
after(()=>db.close());
test('admin database mutations audit atomically without duplicating private content',async()=>{
  await context();await db.exec("update contacts_messages set status='reviewed'");
  const log=(await db.query('select * from audit_logs')).rows[0];
  assert.equal(log.admin_id,actor);assert.equal(log.record_id,contact);assert.equal(log.action,'admin_update');
  assert.deepEqual(log.new_data,{source:'server_row_trigger',changed_fields:['status']});
  assert.doesNotMatch(JSON.stringify(log),/private message/);
});
test('failed audit rolls back the actual data mutation',async()=>{
  await context();await db.exec("alter table audit_logs add constraint reject_audit check(action<>'admin_update') not valid");
  try { await assert.rejects(db.exec("update contacts_messages set status='closed'"),/check constraint/); }
  finally { await db.exec('alter table audit_logs drop constraint reject_audit'); }
  assert.equal((await db.query('select status from contacts_messages')).rows[0].status,'reviewed');
});
test('browser-supplied actor headers cannot impersonate an admin audit event',async()=>{
  const prior=(await db.query('select count(*)::int n from audit_logs')).rows[0].n;
  await context('authenticated');await db.exec("update contacts_messages set status='user update'");
  await context('anon');await db.exec("update contacts_messages set status='guest update'");
  assert.equal((await db.query('select count(*)::int n from audit_logs')).rows[0].n,prior);
});
test('revoked actor stops writes and translations use their natural record key',async()=>{
  await context('service_role',null);await db.exec("update admin_profiles set role='user'");
  await context();await assert.rejects(db.exec("insert into translations values('test.key','Text')"),/Active admin required/);
  await context('service_role',null);await db.exec("update admin_profiles set role='admin'");
  await context();await db.exec("insert into translations values('test.key','Text')");
  await db.exec("delete from translations where translation_key='test.key'");
  const logs=(await db.query("select action,record_id from audit_logs where target_table='translations' order by action")).rows;
  assert.deepEqual(logs,[{action:'admin_delete',record_id:'test.key'},{action:'admin_insert',record_id:'test.key'}]);
});

let clients=[];
globalThis.auditAuthFixture={createClient:(_url,_key,options)=>{
  clients.push(options);
  return {auth:{getUser:async()=>({data:{user:{id:actor}},error:null})},from:()=>{
    const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{role:'admin',allowed_tabs:['fields'],assigned_cities:[]},error:null})};return q;
  }};
}};
globalThis.Deno={env:{get:key=>key==='SUPABASE_SECRET_KEY'?'sb_secret_fixture':key==='SUPABASE_PUBLISHABLE_KEY'?'sb_publishable_fixture':'https://fixture.invalid'}};
const bundle=await build({entryPoints:['supabase/functions/_shared/auth.ts'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{
  name:'fixture',setup(b){b.onResolve({filter:/^npm:/},()=>({path:'supabase',namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const createClient=globalThis.auditAuthFixture.createClient;'}));}
}]});
const {verifyAdminUser}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('shared auth attaches only the verified actor after MFA and ignores spoofed headers',async()=>{
  clients=[];
  const token='header.'+Buffer.from(JSON.stringify({aal:'aal2'})).toString('base64url')+'.signature';
  await verifyAdminUser(new Request('https://fixture.invalid',{headers:{Authorization:`Bearer ${token}`,'x-citymaps-admin-actor':'forged'}}));
  assert.equal(clients.length,3);
  assert.deepEqual(clients[2].global.headers,{'x-citymaps-admin-actor':actor});
  assert.equal(clients[0].global.headers['x-citymaps-admin-actor'],undefined);
  clients=[];
  const weak='header.'+Buffer.from(JSON.stringify({aal:'aal1'})).toString('base64url')+'.signature';
  await assert.rejects(verifyAdminUser(new Request('https://fixture.invalid',{headers:{Authorization:`Bearer ${weak}`}})),/Multi-factor/);
  assert.equal(clients.length,1);
});
