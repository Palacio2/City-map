import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
const id=n=>`11111111-1111-4111-8111-${String(n).padStart(12,'0')}`;
before(async()=>{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
    create table district_comments(id uuid primary key,district_id uuid,user_id uuid,content text,rating integer,is_hidden boolean,created_at timestamptz default now());
    create table countries(id uuid primary key,name text);
    create table cities(id uuid primary key,country_id uuid,name text,is_available boolean);
    create table districts(id uuid primary key,city_id uuid,name text,is_available boolean);
    create table user_district_visits(district_id uuid,visit_count integer);
    create table user_tracked_districts(id uuid primary key default gen_random_uuid(),district_id uuid);
    grant select on countries,cities,districts,user_district_visits to service_role;
    create table trigger_fixture(value integer);
    grant insert,select on trigger_fixture to authenticated;
    create function fixture_trigger() returns trigger language plpgsql security definer set search_path='' as $$begin new.value:=new.value+1;return new;end$$;
    create trigger fixture_insert before insert on trigger_fixture for each row execute function fixture_trigger();
    create function track_user_activity(text) returns void language sql as $$select$$;
    grant execute on function track_user_activity(text) to service_role;
    insert into countries values('${id(1)}','PL'),('${id(2)}','DE');
    insert into cities values('${id(3)}','${id(1)}','City',true),('${id(4)}','${id(1)}','HiddenCity',false),('${id(5)}','${id(2)}','City',true);
    insert into districts values('${id(10)}','${id(3)}','A',true),('${id(11)}','${id(3)}','B',true),
      ('${id(12)}','${id(3)}','Hidden',false),('${id(13)}','${id(4)}','Hidden city district',true),
      ('${id(14)}','${id(5)}','Foreign',true),('${id(15)}','${id(3)}','Unknown visibility',null);
    insert into user_district_visits values('${id(10)}',1),('${id(11)}',3),('${id(12)}',999),('${id(13)}',999),('${id(14)}',999);
    insert into user_tracked_districts(district_id) values('${id(10)}'),('${id(11)}'),('${id(11)}'),('${id(12)}'),('${id(13)}');
    insert into auth.users values('${id(50)}','{"full_name":"Fixture","avatar_url":"private-avatar"}');
    insert into district_comments(id,district_id,user_id,content,rating,is_hidden) values
      ('${id(51)}','${id(10)}','${id(50)}','Visible',5,false),
      ('${id(52)}','${id(10)}','${id(50)}','Moderated',5,true),
      ('${id(53)}','${id(12)}','${id(50)}','Hidden district',5,false),
      ('${id(54)}','${id(13)}','${id(50)}','Hidden city',5,false);`);
  const sql=await readFile(new URL('../migrations/20261018035627_restrict_popularity_rpc_visibility.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
});
after(()=>db.close());
const as=async(role,fn)=>{await db.exec('set role '+role);try{return await fn();}finally{await db.exec('reset role');}};
test('backend ordering excludes unavailable geography and scopes both city and country',async()=>{
  const rows=await as('service_role',()=>db.query("select * from get_popular_district_ids('City','PL')"));
  assert.deepEqual(rows.rows,[{id:id(11)},{id:id(10)}]);
  assert.deepEqual((await as('service_role',()=>db.query("select * from get_popular_district_ids('HiddenCity','PL')"))).rows,[]);
  assert.deepEqual((await as('service_role',()=>db.query("select * from get_popular_district_ids('City','DE')"))).rows,[{id:id(14)}]);
});
test('signed-in aggregate contains only visible geography and exposes no tracking rows',async()=>{
  await as('authenticated',async()=>{
    const rows=(await db.query('select * from get_popular_districts_stats()')).rows;
    assert.deepEqual(rows.map(r=>({...r,count:Number(r.count)})),[{name:'B',city:'City',country:'PL',count:2},{name:'A',city:'City',country:'PL',count:1}]);
    await assert.rejects(db.query('select * from user_tracked_districts'),/permission denied/);
  });
});
test('anonymous aggregate and direct browser internal ordering are denied',async()=>{
  await as('anon',()=>assert.rejects(db.query('select * from get_popular_districts_stats()'),/permission denied/));
  for(const role of ['anon','authenticated']) await as(role,()=>assert.rejects(db.query("select * from get_popular_district_ids('City','PL')"),/permission denied/));
});
test('revoked trigger execute remains functional for normal inserts; retired RPC is closed',async()=>{
  await as('authenticated',async()=>{
    assert.equal((await db.query("select has_function_privilege(current_user,'fixture_trigger()','execute') allowed")).rows[0].allowed,false);
    await db.exec('insert into trigger_fixture values(4)');
    assert.equal((await db.query('select value from trigger_fixture')).rows[0].value,5);
  });
  for(const role of ['anon','authenticated','service_role']) await as(role,()=>assert.rejects(db.query("select track_user_activity('search')"),/permission denied/));
});

test('comments RPC is backend-only and stale admin claims cannot expose moderated comments',async()=>{
  await db.exec(`select set_config('request.jwt.claims','{"app_metadata":{"role":"super_admin"}}',false)`);
  for(const role of ['anon','authenticated']) await as(role,()=>assert.rejects(db.query('select * from get_district_comments_with_users($1)',[id(10)]),/permission denied/));
  await as('service_role',async()=>{
    const rows=(await db.query('select * from get_district_comments_with_users($1)',[id(10)])).rows;
    assert.deepEqual(rows.map(r=>r.content),['Visible']);
    for(const district of [12,13,15]) assert.deepEqual((await db.query('select * from get_district_comments_with_users($1)',[id(district)])).rows,[]);
  });
});
