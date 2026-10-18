import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const city='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
const ids=[1,2,3].map(n=>`33333333-3333-4333-8333-33333333333${n}`);
const sql=await readFile(new URL('../migrations/20261016134705_reconcile_city_population.sql',import.meta.url),'utf8');
before(async()=>{
  const rating = sql.slice(0,sql.indexOf('-- Preserve'));
  const columns = [...new Set([...rating.matchAll(/NEW\.([a-z_]+)/gi)].map(m=>m[1].toLowerCase()))];
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create table cities(id uuid primary key);
    create table districts(id uuid primary key,city_id uuid references cities(id) on delete cascade);
    create table district_filter_data(district_id uuid primary key references districts(id) on delete cascade,
      city_population numeric,residential_area_sqm numeric,
      ${columns.map(c=>`${c} ${c.startsWith('has_')?'boolean':c==='population'?'integer':'numeric'}`).join(',')});
    insert into cities values('${city}'),('${other}');
    insert into districts values ${ids.map(id=>`('${id}','${city}')`).join(',')},('${other}','${other}');
    insert into district_filter_data(district_id,population,city_population,residential_area_sqm) values('${other}',77,0,100);`);
  await db.exec(sql);
});
after(()=>db.close());
const populations=async()=> (await db.query('select population::integer p from district_filter_data where district_id=any($1::uuid[]) order by district_id',[ids])).rows.map(r=>r.p);
test('first insert and successive inserts use the completed denominator, with exact total',async()=>{
  assert.equal((await db.query('select population::integer p from district_filter_data where district_id=$1',[other])).rows[0].p,77);
  await db.query('insert into district_filter_data(district_id,city_population,residential_area_sqm,schools_count) values($1,101,100,1)',[ids[0]]);
  assert.deepEqual(await populations(),[101]);
  await db.query('insert into district_filter_data(district_id,residential_area_sqm,schools_count) values($1,100,1),($2,100,1)',[ids[1],ids[2]]);
  assert.deepEqual(await populations(),[34,34,33]);
});
test('area updates refresh all districts and ratings, not only the edited row',async()=>{
  await db.query('update district_filter_data set city_population=10000 where district_id=$1',[ids[0]]);
  const previous=(await db.query('select education_rating from district_filter_data where district_id=$1',[ids[1]])).rows[0].education_rating;
  await db.query('update district_filter_data set residential_area_sqm=800 where district_id=$1',[ids[0]]);
  assert.deepEqual(await populations(),[8000,1000,1000]);
  assert.notEqual((await db.query('select education_rating from district_filter_data where district_id=$1',[ids[1]])).rows[0].education_rating,previous);
});
test('city population decreases replace old totals and reapplying migration is idempotent',async()=>{
  await db.query('update district_filter_data set city_population=100 where district_id=$1',[ids[2]]);
  assert.deepEqual(await populations(),[80,10,10]);
  await db.exec(sql);
  assert.deepEqual(await populations(),[80,10,10]);
  await assert.rejects(db.query('update district_filter_data set city_population=-1 where district_id=$1',[ids[0]]),/Invalid city population/);
  await assert.rejects(db.query('update district_filter_data set residential_area_sqm=-1 where district_id=$1',[ids[0]]),/Invalid residential area/);
  await assert.rejects(db.query("update district_filter_data set residential_area_sqm='NaN' where district_id=$1",[ids[0]]),/Invalid residential area/);
  assert.deepEqual(await populations(),[80,10,10]);
});
test('deleting metrics or a district refreshes survivors; zero denominator does not retain estimates',async()=>{
  await db.query('delete from district_filter_data where district_id=$1',[ids[2]]);
  assert.deepEqual(await populations(),[89,11]);
  await db.query('delete from districts where id=$1',[ids[1]]);
  assert.deepEqual(await populations(),[100]);
  await db.exec('update district_filter_data set residential_area_sqm=0');
  assert.deepEqual(await populations(),[0]);
});
test('moving a district cannot carry its old city total and browser roles cannot alter canonical totals',async()=>{
  await db.query('update districts set city_id=$1 where id=$2',[other,ids[0]]);
  assert.deepEqual(await populations(),[0]);
  assert.equal((await db.query('select count(*)::integer n from city_population_totals where city_id=$1',[other])).rows[0].n,0);
  await db.exec('set role authenticated');
  try {
    await assert.rejects(db.exec('select * from city_population_totals'),/permission denied/);
    await assert.rejects(db.query('select reconcile_city_population($1)',[city]),/permission denied/);
  } finally { await db.exec('reset role'); }
});
