import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle=await build({entryPoints:['supabase/functions/admin-stripe-manage/reconcile.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {reconcilePromoOperations}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const requestId='11111111-1111-4111-8111-111111111111';
let promo,coupon,pages,reads,completed,completeError;
beforeEach(()=>{
  coupon={id:'cp_city',metadata:{app:'city-map',request_id:requestId},applies_to:{products:['prod_city']},percent_off:20,duration:'once'};
  promo={id:'promo_city',code:'CITY20',active:false,times_redeemed:0,max_redemptions:null,metadata:{app:'city-map',request_id:requestId},promotion:{type:'coupon',coupon:'cp_city'}};
  pages=null;reads=[];completed=[];completeError=false;
});
const stripe={promotionCodes:{
  list:async params=>{reads.push(params);return pages ? pages.shift() : {data:[promo],has_more:false};},
  retrieve:async()=>promo,
  create:()=>assert.fail('reconciliation must never create'),update:()=>assert.fail('reconciliation must never update'),
},coupons:{retrieve:async()=>coupon,create:()=>assert.fail('reconciliation must never create')}};
const job=()=>({operation_key:'create:'+requestId,action:'create_promo',payload:{code:'CITY20',percentOff:20,duration:'once',maxRedemptions:null,products:['prod_city']}});
const complete=async(key,result)=>{if(completeError) throw new Error('audit unavailable');completed.push({key,result});};
const run=(jobs=[job()])=>reconcilePromoOperations(stripe,['prod_city'],jobs,complete);
test('read-only matching creation recovers durable result including inactive promotions',async()=>{
  await run();assert.equal(completed.length,1);assert.equal(completed[0].result.promoCode.id,'promo_city');
  assert.equal(reads[0].code,'CITY20');assert.equal(reads[0].active,undefined);
});
test('foreign app, wrong request identity and mismatched discount never complete',async()=>{
  for(const mutate of [()=>{promo.metadata.app='other';},()=>{coupon.metadata.request_id='other';},()=>{coupon.percent_off=99;}]){
    const oldPromo=structuredClone(promo),oldCoupon=structuredClone(coupon);
    mutate();await run();assert.equal(completed.length,0);promo=oldPromo;coupon=oldCoupon;
  }
});
test('ownership, exact product set, duration and redemption limits must match',async()=>{
  for(const payload of [{products:['prod_other']},{duration:'forever'},{maxRedemptions:10}]){
    await run([{...job(),payload:{...job().payload,...payload}}]);assert.equal(completed.length,0);
  }
});
test('ambiguous matches or incomplete pagination stay pending',async()=>{
  pages=[{data:[promo,{...promo,id:'promo_second'}],has_more:false}];await run();assert.equal(completed.length,0);
  pages=[{data:[promo],has_more:true},{data:[{...promo,id:'promo_second'}],has_more:true},{data:[],has_more:true}];
  await run();assert.equal(completed.length,0);
});
test('pagination finds exactly one matching object only after full traversal',async()=>{
  pages=[{data:[{...promo,id:'promo_foreign',metadata:{app:'other'}}],has_more:true},{data:[promo],has_more:false}];
  await run();assert.equal(completed.length,1);assert.equal(reads[1].starting_after,'promo_foreign');
});
test('disable is confirmed only for own inactive promotion with matching products',async()=>{
  const disable={operation_key:'disable:fixture',action:'delete_promo',payload:{id:'promo_city',products:['prod_city']}};
  promo.active=true;await run([disable]);assert.equal(completed.length,0);
  promo.active=false;await run([disable]);assert.deepEqual(completed[0].result,{success:true,id:'promo_city'});
});
test('missing objects and audit failure remain pending; work is bounded',async()=>{
  pages=[{data:[],has_more:false}];await run();assert.equal(completed.length,0);
  pages=null;completeError=true;await run();assert.equal(completed.length,0);
  completeError=false;reads=[];await run([job(),job(),job(),job()]);assert.equal(reads.length,3);
});
