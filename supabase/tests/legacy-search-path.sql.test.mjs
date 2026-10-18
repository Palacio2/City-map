import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
let migration;
before(async()=>{
  migration=await readFile(new URL('../migrations/20261017230818_harden_legacy_function_search_path.sql',import.meta.url),'utf8');
  await db.exec(`create role anon;create role authenticated;create role service_role;
    grant create,usage on schema public to public,anon,authenticated;
    create table public.lookup_fixture(value integer);
    insert into public.lookup_fixture values(7);
    create schema attacker;
    create table attacker.lookup_fixture(value integer);
    insert into attacker.lookup_fixture values(999);
    create temp table lookup_fixture(value integer);
    insert into pg_temp.lookup_fixture values(888);
    create function public.get_total_users() returns integer language plpgsql security definer as $$begin return (select value from lookup_fixture); end$$;
    create function public.get_total_users(integer) returns integer language sql security invoker as $$select $1$$;
    create function public.is_super_admin() returns boolean language sql security definer set search_path='' as $$select false$$;
    create function public.unrelated_fixture() returns integer language sql as $$select 1$$;
    revoke execute on function public.get_total_users() from public,anon,authenticated;
    grant execute on function public.get_total_users() to service_role;
    set search_path=attacker,public;
  `);
  await db.exec(migration);await db.exec(migration);
});
after(()=>db.close());
test('legacy definer uses public data despite caller and temporary shadow tables',async()=>{
  assert.equal((await db.query('select public.get_total_users() result')).rows[0].result,7);
  assert.equal((await db.query('show search_path')).rows[0].search_path,'attacker, public');
});
test('overloads are hardened, existing explicit path and unrelated routines are preserved',async()=>{
  const rows=(await db.query("select proname,proconfig,prosecdef from pg_proc where pronamespace='public'::regnamespace order by proname")).rows;
  assert.equal(rows.filter(r=>r.proname==='get_total_users' && r.proconfig.includes('search_path=public, pg_temp')).length,2);
  assert.deepEqual(rows.find(r=>r.proname==='is_super_admin').proconfig,['search_path=""']);
  assert.equal(rows.find(r=>r.proname==='unrelated_fixture').proconfig,null);
});
test('browser roles cannot create masking objects and execute grants are unchanged',async()=>{
  for(const role of ['anon','authenticated']){
    await db.exec('set role '+role);
    try {
      await assert.rejects(db.exec('create table public.masking_fixture(id integer)'),/permission denied/);
      await assert.rejects(db.query('select public.get_total_users()'),/permission denied/);
    }finally{await db.exec('reset role');}
  }
  await db.exec('set role service_role');
  try {assert.equal((await db.query('select public.get_total_users() result')).rows[0].result,7);}
  finally{await db.exec('reset role');}
});
test('unexpected inherited CREATE privilege fails closed instead of trusting public',async()=>{
  await db.exec('create role unsafe_writer;grant create on schema public to unsafe_writer;grant unsafe_writer to authenticated');
  try {await assert.rejects(db.exec(migration),/Inherited CREATE privilege/);}
  finally {await db.exec('revoke unsafe_writer from authenticated;revoke create on schema public from unsafe_writer');}
});
