import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

let handler, allowed, products, calls, rows, coupon, auditError, failPromo, prepareError, receipts, pendingJobs;
const ownedCoupon = () => ({ id: 'cp_city', metadata: { app: 'city-map' },
  applies_to: { products: ['prod_city'] }, percent_off: 20, duration: 'once' });
const ownedPromo = () => ({ id: 'promo_city', code: 'CITY20', metadata: { app: 'city-map' },
  promotion: { type: 'coupon', coupon: 'cp_city' }, times_redeemed: 0 });
class FakeStripe {
  static createFetchHttpClient() { return {}; }
  coupons = {
    retrieve: async id => { calls.push(['coupon.retrieve', id]); return coupon; },
    create: async (params, options) => { calls.push(['coupon.create', params, options]); return coupon; },
  };
  promotionCodes = {
    list: async params => { calls.push(['list', params]); return rows; },
    retrieve: async id => { calls.push(['retrieve', id]); return rows.data[0]; },
    update: async (id, params) => { calls.push(['update', id, params]); return {}; },
    create: async (params, options) => {
      calls.push(['create', params, options]);
      if (failPromo) throw new Error('Ambiguous network failure');
      return ownedPromo();
    },
  };
}
globalThis.promoFixture = {
  Stripe: FakeStripe,
  access: () => ({ user: { id: 'admin' }, isSuperAdmin: true, hasTab: () => allowed,
    supabaseAdmin: { rpc: async (name,args) => {
      if(name==='pending_promo_operations') return {data:pendingJobs,error:null};
      if(name==='prepare_promo_operation') {
        calls.push(['begin',args]);
        return {error:prepareError,data:receipts.get(args.p_key) ?? null};
      }
      assert.equal(name,'complete_promo_operation');
      calls.push(['audit',args]);
      if(!auditError) receipts.set(args.p_key,args.p_result);
      return {error:auditError};
    } } }),
};
globalThis.Deno = { env: { get: key => /^SUPABASE_(SECRET|PUBLISHABLE)_KEYS?$/.test(key) ? undefined : key === 'STRIPE_CITY_MAP_PRODUCT_IDS' ? products : 'fixture' },
  serve: fn => { handler = fn; } };
const bundle = await build({ entryPoints: ['supabase/functions/admin-stripe-manage/index.ts'],
  bundle: true, write: false, platform: 'node', format: 'esm', plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({ filter: /_shared\/auth\.ts$/ }, () => ({ path: 'auth', namespace: 'fixture' }));
    b.onResolve({ filter: /^npm:stripe/ }, () => ({ path: 'stripe', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: path === 'auth'
      ? 'export const corsHeaders={}; export const verifyAdminUser=async()=>globalThis.promoFixture.access();'
      : 'export default globalThis.promoFixture.Stripe;' }));
  } }] });
await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
beforeEach(() => {
  allowed = true; products = 'prod_city'; calls = []; coupon = ownedCoupon();
  rows = { data: [ownedPromo()], has_more: false }; auditError = null; failPromo = false;
  prepareError=null;receipts=new Map();pendingJobs=[];
});
const payload = { code: 'CITY20', percentOff: 20, duration: 'once', requestId: '11111111-1111-4111-8111-111111111111' };
const request = (action, value = {}) => handler(new Request('https://fixture.invalid', {
  method: 'POST', body: JSON.stringify({ action, payload: value }),
}));
test('permission and missing product allowlist fail before Stripe reads or writes', async () => {
  allowed = false;
  assert.equal((await request('list_promos')).status, 403);
  allowed = true; products = '';
  assert.equal((await request('create_promo', payload)).status, 503);
  assert.deepEqual(calls, []);
});
test('new coupons are restricted to City-map products and both objects are tagged', async () => {
  assert.equal((await request('create_promo', payload)).status, 200);
  assert.equal(calls[0][0],'begin');
  assert.deepEqual(calls[1][1].applies_to, { products: ['prod_city'] });
  assert.equal(calls[1][1].metadata.app, 'city-map');
  assert.deepEqual(calls[2][1].promotion, { type: 'coupon', coupon: 'cp_city' });
  assert.equal(calls[2][1].metadata.app, 'city-map');
  assert.equal(calls[3][0], 'audit');
});
test('unavailable or expired request journal blocks every Stripe mutation',async()=>{
  for(const error of [{code:'XX000'},{code:'CM409'}]) {
    prepareError=error;calls=[];
    assert.equal((await request('create_promo',payload)).status,error.code==='CM409'?409:503);
    assert.equal(calls.some(c=>['coupon.create','create','update'].includes(c[0])),false);
    assert.equal((await request('delete_promo',{id:'promo_city'})).status,error.code==='CM409'?409:503);
    assert.equal(calls.some(c=>c[0]==='update'),false);
  }
});
test('completed creation returns durable result without new Stripe calls',async()=>{
  const first=await (await request('create_promo',payload)).json();
  calls=[];
  assert.deepEqual(await (await request('create_promo',payload)).json(),first);
  assert.deepEqual(calls.map(c=>c[0]),['begin']);
});
test('opening the list reconciles pending own operations without Stripe mutations',async()=>{
  const key='create:'+payload.requestId;
  coupon.metadata.request_id=payload.requestId;
  rows.data[0].metadata.request_id=payload.requestId;
  pendingJobs=[{operation_key:key,action:'create_promo',payload:{code:'CITY20',percentOff:20,duration:'once',maxRedemptions:null,products:['prod_city']}}];
  assert.equal((await request('list_promos')).status,200);
  assert.equal(receipts.get(key).promoCode.id,'promo_city');
  assert.equal(calls.some(c=>['coupon.create','create','update'].includes(c[0])),false);
  auditError=new Error('audit outage');
  assert.equal((await request('list_promos')).status,200);
});
test('failed completion can be retried with the same creation keys',async()=>{
  auditError=new Error('audit down');
  assert.equal((await request('create_promo',payload)).status,503);
  auditError=null;
  assert.equal((await request('create_promo',payload)).status,200);
  const creates=calls.filter(c=>c[0]==='create');
  assert.deepEqual(creates[0][2],creates[1][2]);
});
test('invalid discounts, duration, code, limits and retry identity cannot create objects', async () => {
  for (const patch of [{ percentOff: 101 }, { percentOff: 0 }, { percentOff: 1.5 }, { percentOff: '20' },
    { duration: 'unexpected' }, { duration: ['once'] }, { code: 'A B' }, { code: '' }, { maxRedemptions: 0 }, { requestId: 'bad' }]) {
    assert.equal((await request('create_promo', { ...payload, ...patch })).status, 400);
  }
  assert.deepEqual(calls, []);
});
test('list filters foreign, legacy, unrestricted and mixed-product coupons and returns pagination', async () => {
  rows = { data: [ownedPromo(), { ...ownedPromo(), id: 'promo_foreign', metadata: { app: 'other' } },
    ...[{}, { metadata: {} }, { applies_to: { products: ['prod_city', 'prod_other'] } }].map((patch, i) => ({
      ...ownedPromo(), id: 'promo_bad' + i, promotion: { type: 'coupon', coupon: i === 0
        ? { ...ownedCoupon(), applies_to: undefined } : { ...ownedCoupon(), ...patch } },
    }))], has_more: true };
  const response = await request('list_promos', { cursor: 'promo_before' });
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  const body = await response.json();
  assert.deepEqual(body.codes.map(row => row.id), ['promo_city']);
  assert.equal(body.nextCursor, 'promo_bad2');
  assert.equal(calls[0][1].starting_after, 'promo_before');
  assert.equal(body.codes[0].metadata, undefined);
});
test('even super admin cannot disable foreign or unscoped promotions', async () => {
  for (const patch of [{ metadata: {} }, { applies_to: undefined }, { applies_to: { products: ['prod_other'] } }]) {
    coupon = { ...ownedCoupon(), ...patch };
    assert.equal((await request('delete_promo', { id: 'promo_city' })).status, 404);
  }
  coupon = ownedCoupon(); rows.data[0].metadata.app = 'other';
  assert.equal((await request('delete_promo', { id: 'promo_city' })).status, 404);
  assert.equal(calls.some(call => call[0] === 'update'), false);
});
test('disabling own code changes only active and reports audit failure explicitly', async () => {
  auditError = new Error('DB unavailable');
  const response = await request('delete_promo', { id: 'promo_city' });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /changed, but audit/);
  assert.deepEqual(calls.find(call => call[0] === 'update'), ['update', 'promo_city', { active: false }]);
});
test('ambiguous creation retry reuses both idempotency keys without deleting the coupon', async () => {
  failPromo = true;
  assert.equal((await request('create_promo', payload)).status, 503);
  failPromo = false;
  assert.equal((await request('create_promo', payload)).status, 200);
  const creates = calls.filter(call => call[0] === 'create');
  const coupons = calls.filter(call => call[0] === 'coupon.create');
  assert.deepEqual(creates[0][2], creates[1][2]);
  assert.deepEqual(coupons[0][2], coupons[1][2]);
});
