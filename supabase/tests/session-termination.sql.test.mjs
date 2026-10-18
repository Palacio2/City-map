import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
const actor='11111111-1111-4111-8111-111111111111';
const target='22222222-2222-4222-8222-222222222222';
let smokePrivileges;
before(async()=>{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users);
    create table auth.refresh_tokens(id bigint primary key,user_id varchar,session_id uuid references auth.sessions on delete cascade);
    create table admin_profiles(user_id uuid primary key,role text,allowed_tabs text[]);
    create table audit_logs(admin_id uuid,action text,target_table text,record_id text,new_data jsonb);
    insert into auth.users values('${actor}'),('${target}');`);
  const sql=await readFile(new URL('../migrations/20261017131110_audited_session_termination.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
  // Execute the real staging smoke assertion, not a duplicate of its checks.
  const smoke=await readFile(new URL('./security_access.sql',import.meta.url),'utf8');
  const start=smoke.indexOf('do $$');
  smokePrivileges=smoke.slice(start,smoke.indexOf('$$;',start)+3);
  await db.exec(`create table field_groups(id integer);create table fields_config(id integer);create table scraper_rules(id integer);
    alter table field_groups enable row level security;alter table fields_config enable row level security;alter table scraper_rules enable row level security;
    grant select,insert,update,delete on field_groups,fields_config,scraper_rules to service_role;
    create function add_dynamic_column(text,text) returns void language sql security invoker as $$select$$;
    revoke all on function add_dynamic_column(text,text) from public,anon,authenticated,service_role;
    create function get_weekly_activity_stats(uuid) returns void language sql security invoker as $$select$$;`);
});
beforeEach(async()=>{
  await db.exec(`truncate auth.refresh_tokens,auth.sessions,admin_profiles,audit_logs;
    insert into admin_profiles values('${actor}','admin',array['users.terminate']),('${target}','user','{}');
    insert into auth.sessions values('${actor}','${actor}'),('${target}','${target}');
    insert into auth.refresh_tokens values(1,'${actor}','${actor}'),(2,'${target}','${target}'),(3,'${target}',null);`);
});
after(()=>db.close());
const terminate=()=>db.query('select admin_terminate_user_sessions($1,$2)',[actor,target]);
test('termination removes only target sessions and tokens, with mandatory content-free audit',async()=>{
  await terminate();
  assert.deepEqual((await db.query('select user_id from auth.sessions')).rows,[{user_id:actor}]);
  assert.deepEqual((await db.query('select user_id from auth.refresh_tokens')).rows,[{user_id:actor}]);
  assert.deepEqual((await db.query('select * from audit_logs')).rows,[{admin_id:actor,action:'terminate_sessions',target_table:'auth.users',record_id:target,new_data:{sessions_deleted:1,refresh_tokens_deleted:2}}]);
  await terminate();
  assert.equal((await db.query('select count(*)::int n from audit_logs')).rows[0].n,2);
});
test('failed audit rolls back all session and refresh-token removal',async()=>{
  await db.exec('alter table audit_logs add constraint reject_log check(false) not valid');
  try {await assert.rejects(terminate(),/check constraint/);}
  finally {await db.exec('alter table audit_logs drop constraint reject_log');}
  assert.equal((await db.query('select count(*)::int n from auth.sessions')).rows[0].n,2);
  assert.equal((await db.query('select count(*)::int n from auth.refresh_tokens')).rows[0].n,3);
});
test('current actor permission and target hierarchy are enforced inside SQL',async()=>{
  await db.exec(`update admin_profiles set allowed_tabs='{}' where user_id='${actor}'`);
  await assert.rejects(terminate(),/permission required/);
  await db.exec(`update admin_profiles set allowed_tabs=array['users.terminate'] where user_id='${actor}';
    update admin_profiles set role='admin' where user_id='${target}'`);
  await assert.rejects(terminate(),/Only super admin/);
  await db.exec(`update admin_profiles set role='super_admin' where user_id='${actor}'`);
  await terminate();
});
test('unknown actor, absent target and invalid target role fail closed',async()=>{
  await assert.rejects(db.query('select admin_terminate_user_sessions(null,$1)',[target]),/required/);
  await assert.rejects(db.query('select admin_terminate_user_sessions($1,$2)',[actor,'33333333-3333-4333-8333-333333333333']),/not found/);
  await db.exec(`update admin_profiles set role='unexpected' where user_id='${target}'`);
  await assert.rejects(terminate(),/Invalid target/);
  await db.exec(`delete from admin_profiles where user_id='${actor}'`);
  await assert.rejects(terminate(),/permission required/);
  assert.equal((await db.query('select count(*)::int n from auth.sessions')).rows[0].n,2);
});
test('browser roles cannot call new RPC and service cannot use actor-less legacy path',async()=>{
  for(const role of ['anon','authenticated','service_role']){
    await db.exec(`set role ${role}`);
    try {
      await assert.rejects(db.query('select force_logout_user($1)',[target]),/permission denied/);
      if(role!=='service_role') await assert.rejects(terminate(),/permission denied/);
      else await terminate();
    } finally {await db.exec('reset role');}
  }
});

test('staging smoke accepts the current audited session permissions',async()=>{
  await db.exec(smokePrivileges);
});

test('staging smoke rejects restored legacy access, browser RPC access and missing backend grant',async()=>{
  for(const role of ['anon','authenticated','service_role']) {
    await db.exec(`grant execute on function force_logout_user(text) to ${role}`);
    try {await assert.rejects(db.exec(smokePrivileges),/retired actor-less/);}
    finally {await db.exec(`revoke execute on function force_logout_user(text) from ${role}`);}
  }
  for(const role of ['anon','authenticated']) {
    await db.exec(`grant execute on function admin_terminate_user_sessions(uuid,uuid) to ${role}`);
    try {await assert.rejects(db.exec(smokePrivileges),/bypass the Edge gate/);}
    finally {await db.exec(`revoke execute on function admin_terminate_user_sessions(uuid,uuid) from ${role}`);}
  }
  await db.exec('revoke execute on function admin_terminate_user_sessions(uuid,uuid) from service_role');
  try {await assert.rejects(db.exec(smokePrivileges),/cannot call audited/);}
  finally {await db.exec('grant execute on function admin_terminate_user_sessions(uuid,uuid) to service_role');}
});
