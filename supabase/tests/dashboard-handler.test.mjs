import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
let handler,failed,user,stats,calls;
const result=key=>({data:key==='stats'?stats:[],error:key===failed?{message:'private database detail'}:null});
globalThis.dashboardFixture={
  auth:{getUser:async()=>({data:{user},error:null})},
  from:table=>{assert.equal(table,'user_stats');return {select:()=>({eq:(column,id)=>{
    assert.equal(column,'user_id');assert.equal(id,'actor');calls.push(table);
    return {maybeSingle:async()=>result('stats')};
  }})};},
  rpc:async(name,args)=>{calls.push(name);if(name==='get_weekly_activity_stats') assert.deepEqual(args,{uid:'actor'});return result(name);},
};
globalThis.Deno={serve:value=>{handler=value;},env:{get:key=>key==='SUPABASE_URL'?'https://fixture.invalid':key==='SUPABASE_PUBLISHABLE_KEY'?'sb_publishable_fixture':undefined}};
const bundle=await build({entryPoints:['supabase/functions/get-dashboard-stats/index.ts'],bundle:true,write:false,format:'esm',platform:'node',
  plugins:[{name:'fixture',setup(b){b.onResolve({filter:/^npm:/},()=>({path:'db',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const createClient=()=>globalThis.dashboardFixture;'}));}}]});
await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
beforeEach(()=>{failed=null;user={id:'actor'};stats={viewed_districts_count:7,comparison_count:2};calls=[];});
const request=(method='POST',authorization='Bearer fixture')=>handler(new Request('https://fixture.invalid',{method,headers:authorization?{Authorization:authorization}:{}}));
test('dashboard uses real viewed counter and prevents shared caching',async()=>{
  const response=await request();assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  const body=await response.json();assert.equal(body.stats.searches,7);assert.equal(body.stats.viewed_districts_count,7);assert.equal(body.stats.comparisons,2);
});
test('every query failure returns unavailable without database details or fake zero totals',async()=>{
  for(const key of ['stats','get_weekly_activity_stats','get_popular_districts_stats']){
    failed=key;const response=await request();assert.equal(response.status,503);
    assert.deepEqual(await response.json(),{error:'Statistics unavailable'});
  }
});
test('new users can have genuinely empty statistics',async()=>{
  stats=null;const response=await request('GET');assert.equal(response.status,200);
  assert.equal((await response.json()).stats.viewed_districts_count,0);
});
test('missing or invalid identity and unsupported methods perform no data reads',async()=>{
  for(const auth of ['', 'invalid','Bearer ']) assert.equal((await request('POST',auth)).status,401);
  user=null;assert.equal((await request()).status,401);
  assert.equal((await request('DELETE')).status,405);
  assert.equal((await request('OPTIONS','')).status,200);assert.deepEqual(calls,[]);
});
