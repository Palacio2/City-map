import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
let handler, validAuth, links, sub, invoiceRows, reads, invoiceCalls, dbError;
const user='11111111-1111-4111-8111-111111111111';
const invoice = i => ({ id:`in_${i}`, status:'paid', currency:'pln', amount_paid:12345+i, created:1700000000+i,
  customer:'cus_owned', parent:{subscription_details:{subscription:'sub_owned'}},
  lines:{data:[{pricing:{price_details:{price:'price_premium'}}}],has_more:false} });
globalThis.billingFixture = {
  db: { auth:{getUser:async()=>({data:{user:validAuth?{id:user}:null},error:null})}, from:table=> {
    assert.equal(table,'user_subscriptions');
    const q={select:()=>q,eq:(key,value)=>{assert.equal(key,'user_id');assert.equal(value,user);return q;},like:()=>q,order:()=>q,
      range:async()=>({data:links,error:dbError})};return q;
  } },
  stripe: { subscriptions:{retrieve:async()=>{reads++;return sub;}},invoices:{list:async args=>{
    invoiceCalls++;assert.equal(args.subscription,'sub_owned');assert.equal(args.status,'paid');
    const start=args.starting_after?invoiceRows.findIndex(row=>row.id===args.starting_after)+1:0;
    return {data:invoiceRows.slice(start,start+100),has_more:start+100<invoiceRows.length};
  }} },
};
globalThis.Deno={serve:value=>{handler=value;},env:{get:key=>key==='SUPABASE_SECRET_KEY'?'sb_secret_fixture':key.startsWith('STRIPE_PRICE_')?'price_'+key.slice(13).toLowerCase():'fixture'}};
const bundle=await build({entryPoints:['supabase/functions/get-billing-history/index.ts'],bundle:true,write:false,format:'esm',platform:'node',
  plugins:[{name:'fixture',setup(b){
    b.onResolve({filter:/^npm:/},args=>({path:args.path.includes('stripe@')?'stripe':'db',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='stripe'
      ?'export default class Stripe {static createFetchHttpClient(){return {}} constructor(){return globalThis.billingFixture.stripe}}'
      :'export const createClient=()=>globalThis.billingFixture.db;'}));
  }}]});
await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
beforeEach(()=>{
  validAuth=true;links=[{payment_id:'SUB_sub_owned'}];reads=invoiceCalls=0;dbError=null;
  sub={id:'sub_owned',customer:'cus_owned',status:'active',metadata:{app:'city-map',user_id:user},
    items:{has_more:false,data:[{price:{id:'price_premium'},current_period_start:1700000000,current_period_end:1800000000}]}};
  invoiceRows=[invoice(1),invoice(2)];
});
const request=(body={},token='Bearer fixture')=>handler(new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:token},body:JSON.stringify(body)}));
test('history contains individual paid invoices, exact minor amounts and their currencies',async()=>{
  const response=await request();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');
  const result=await response.json();assert.equal(result.count,2);
  assert.deepEqual(result.subscriptions.map(row=>row.id),['in_2','in_1']);
  assert.equal(result.subscriptions[0].amount_minor,12347);assert.equal(result.subscriptions[0].amount,123.47);assert.equal(result.subscriptions[0].currency,'PLN');
  assert.equal(result.subscriptions[0].status,'paid');
});
test('invoice pagination includes renewals beyond one Stripe page',async()=>{
  invoiceRows=Array.from({length:101},(_,i)=>invoice(i));
  const result=await (await request({page:21,limit:5})).json();
  assert.equal(result.count,101);assert.equal(result.subscriptions.length,1);assert.equal(result.subscriptions[0].id,'in_0');assert.equal(invoiceCalls,2);
});
test('auth and pagination failures never reach Stripe',async()=>{
  validAuth=false;assert.equal((await request()).status,401);
  validAuth=true;for(const body of [{page:0},{page:1.5},{limit:51},{limit:'5'}])assert.equal((await request(body)).status,400);
  assert.equal(reads,0);
});
test('foreign app, owner and price prevent invoice reads on the shared account',async()=>{
  for(const mutate of [()=>{sub.metadata.app='other';},()=>{sub.metadata.user_id='foreign';},()=>{sub.items.data[0].price.id='price_foreign';}]){
    const original=structuredClone(sub);mutate();assert.equal((await request()).status,503);sub=original;
  }
  assert.equal(invoiceCalls,0);
});
test('foreign invoice customer or subscription is never exposed',async()=>{
  invoiceRows[0].customer='cus_foreign';assert.equal((await request()).status,503);
  invoiceRows[0]=invoice(1);invoiceRows[0].parent.subscription_details.subscription='sub_foreign';assert.equal((await request()).status,503);
});
test('gifts are not fabricated as payments and database errors do not return empty success',async()=>{
  links=[{payment_id:'GIFT_MANUAL_user'}];assert.deepEqual(await (await request()).json(),{subscriptions:[],count:0});assert.equal(reads,0);
  dbError=new Error('private SQL detail');const response=await request();assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private SQL detail/);
});

test('legacy major units and explicit minor units agree for each supported currency precision',async()=>{
  for (const [currency, minor, major] of [['jpy',123,123],['kwd',12345,12.345],['isk',12300,123],['ugx',12300,123]]) {
    invoiceRows=[{...invoice(1),currency,amount_paid:minor}];
    const response=await request();assert.equal(response.status,200);
    const row=(await response.json()).subscriptions[0];
    assert.equal(row.amount_minor,minor);assert.equal(row.amount,major);assert.equal(row.currency,currency.toUpperCase());
  }
});

test('invalid invoice amounts and dates fail closed without returning partial history',async()=>{
  for (const invalid of [{amount_paid:-1},{amount_paid:1.5},{amount_paid:Number.MAX_SAFE_INTEGER+1},{currency:'invalid'},{created:253402300800}]) {
    invoiceRows=[invoice(1),{...invoice(2),...invalid}];
    const response=await request();assert.equal(response.status,503);
    assert.deepEqual(await response.json(),{error:'Billing history unavailable'});
  }
});
