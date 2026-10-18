import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
let events,beginError,saveError,ready,cancelError,missingConfig;
globalThis.billingControllerFixture={cancel:async()=>{events.push('cancel');if(cancelError)throw cancelError;return {cancellation_confirmed:true};}};
globalThis.Deno={env:{get:name=>missingConfig?undefined:name==='STRIPE_SECRET_KEY'?'sk_test_fixture':'price_'+name.replaceAll('_','')}};
const bundle=await build({entryPoints:['supabase/functions/admin-users-manage/billing.ts'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'fixture',setup(b){
  b.onResolve({filter:/^npm:stripe/},()=>({path:'stripe',namespace:'fixture'}));
  b.onResolve({filter:/_shared\/billingDeletion\.ts$/},()=>({path:'cancel',namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='stripe'?'export default class Stripe {static createFetchHttpClient(){return {}}}':'export class BillingDeletionError extends Error {} export const cancelBillingForDeletion=()=>globalThis.billingControllerFixture.cancel();'}));
}}]});
const {reconcileDeletionBilling}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const db={rpc:async name=>{events.push(name);return name==='begin_billing_account_deletion'?{data:{user_id:'target'},error:beginError}:{data:ready,error:saveError};}};
beforeEach(()=>{events=[];beginError=saveError=cancelError=null;ready=true;missingConfig=false;});
test('configuration and failed freeze prevent Stripe cancellation',async()=>{
  missingConfig=true;await assert.rejects(reconcileDeletionBilling(db,'actor','target'),error=>error.status===503);assert.deepEqual(events,[]);
  missingConfig=false;beginError={code:'CM409'};await assert.rejects(reconcileDeletionBilling(db,'actor','target'),error=>error.status===409);assert.deepEqual(events,['begin_billing_account_deletion']);
});
test('successful flow freezes, cancels, then records confirmation in that order',async()=>{
  await reconcileDeletionBilling(db,'actor','target');assert.deepEqual(events,['begin_billing_account_deletion','cancel','record_billing_account_cancellation']);
});
test('uncertain cancellation never records completion or leaks remote errors',async()=>{
  cancelError=new Error('private upstream detail');await assert.rejects(reconcileDeletionBilling(db,'actor','target'),error=>error.status===503&&!error.message.includes('private'));
  assert.deepEqual(events,['begin_billing_account_deletion','cancel']);
});
test('audit failure and outstanding billing cannot authorize deletion',async()=>{
  saveError={code:'XX000'};await assert.rejects(reconcileDeletionBilling(db,'actor','target'),error=>error.status===503);
  saveError=null;ready=false;await assert.rejects(reconcileDeletionBilling(db,'actor','target'),error=>error.status===409);
});
