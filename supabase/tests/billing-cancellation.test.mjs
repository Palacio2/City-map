import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({entryPoints:['supabase/functions/_shared/billingDeletion.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {cancelBillingForDeletion}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const user='22222222-2222-4222-8222-222222222222';
function fixture(){
  const writes=[];
  const metadata={app:'city-map',user_id:user};
  const sub={id:'sub_fixture',customer:'cus_fixture',metadata,status:'active',items:{data:[{price:{id:'price_fixture'},current_period_start:1800000000,current_period_end:1800001000}],has_more:false}};
  const session={id:'cs_fixture',customer:'cus_fixture',metadata,mode:'subscription',status:'open',subscription:null};
  const page=data=>({data,has_more:false});
  const stripe={customers:{retrieve:async()=>({id:'cus_fixture',metadata})},subscriptions:{retrieve:async()=>sub,list:async()=>page([sub]),cancel:async(id,options)=>{writes.push(['cancel',id,options]);return {...sub,status:'canceled'};}},subscriptionSchedules:{list:async()=>page([])},checkout:{sessions:{retrieve:async()=>session,list:async()=>page([session]),expire:async id=>{writes.push(['expire',id]);return {...session,status:'expired'};}}},invoices:{list:async()=>page([])}};
  const snapshot={user_id:user,checkout_snapshot:{customer_id:'cus_fixture',session_id:'cs_fixture'},subscription_snapshot:[{payment_id:'SUB_sub_fixture'}]};
  return {stripe,sub,session,writes,snapshot,run:()=>cancelBillingForDeletion(stripe,snapshot,{price_fixture:'premium'})};
}
test('expires checkout then cancels immediately without new invoice or proration',async()=>{
  const f=fixture();const result=await f.run();
  assert.deepEqual(f.writes,[['expire','cs_fixture'],['cancel','sub_fixture',{invoice_now:false,prorate:false}]]);
  assert.equal(result.cancellation_confirmed,true);assert.deepEqual(result.outstanding_invoice_ids,[]);
});
test('foreign customer or subscription is rejected before any mutation',async()=>{
  for(const change of [f=>{f.sub.metadata={app:'other',user_id:user};},f=>{f.stripe.customers.retrieve=async()=>({metadata:{app:'other',user_id:user}});}]){
    const f=fixture();change(f);await assert.rejects(f.run());assert.equal(f.writes.length,0);
  }
});
test('uncertain checkout and unseen completed subscription fail before mutations',async()=>{
  const f=fixture();f.snapshot.checkout_snapshot.session_id=null;await assert.rejects(f.run(),/Uncertain Checkout/);
  const g=fixture();g.session.status='complete';g.session.subscription='sub_unseen';await assert.rejects(g.run(),/requires reconciliation/);
  assert.equal(f.writes.length+g.writes.length,0);
});
test('complete pagination detects a foreign subscription on the second page',async()=>{
  const f=fixture();f.stripe.subscriptions.list=async args=>args.starting_after?{data:[{...f.sub,id:'sub_other',metadata:{app:'other'}}],has_more:false}:{data:[f.sub],has_more:true};
  await assert.rejects(f.run());assert.equal(f.writes.length,0);
});
test('lost cancellation response cannot become success; terminal retry skips duplicate cancellation',async()=>{
  const f=fixture();f.stripe.subscriptions.cancel=async()=>{throw new Error('timeout');};
  await assert.rejects(f.run(),/timeout/);f.sub.status='canceled';f.session.status='expired';f.writes.length=0;
  assert.equal((await f.run()).cancellation_confirmed,true);assert.equal(f.writes.length,0);
});
test('outstanding invoices survive cancellation and prevent authorization',async()=>{
  const f=fixture();f.stripe.invoices.list=async()=>({data:[{id:'in_unpaid',customer:'cus_fixture',status:'open'}],has_more:false});
  const result=await f.run();assert.deepEqual(result.outstanding_invoice_ids,['in_unpaid']);assert.equal(result.auth_deletion_authorized,false);
});
