import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
let handler;
const writes = [];
let cancelRow, stripeSubscription, retrieveError, persistenceError;
let checkoutEnabled, checkoutRow, checkoutSession, promotionApp;
beforeEach(() => { cancelRow = null; stripeSubscription = null; retrieveError = persistenceError = false;
  checkoutEnabled = false; checkoutRow = checkoutSession = null; promotionApp = 'city-map'; });
const db = {
  auth: {
    getUser: async (token) => ({
      data: { user: token === 'valid' ? { id: 'user' } : null },
      error: null,
    }),
  },
  rpc: async (name, args) => {
    writes.push('rpc');
    if (checkoutEnabled) {
      if (name === 'claim_billing_checkout') checkoutRow ??= { user_id: args.p_user_id,
        plan_key: args.p_plan, price_id: args.p_price, promotion_id: args.p_promotion,
        attempt_id: 'attempt', attempt_created_at: new Date().toISOString(), customer_id: null,
        session_id: null, lease_token: 'lease' };
      if (name === 'save_billing_checkout') {
        checkoutRow.customer_id = args.p_customer ?? checkoutRow.customer_id;
        checkoutRow.session_id = args.p_session ?? checkoutRow.session_id;
      }
      return { data: checkoutRow, error: null };
    }
    throw new Error('unexpected RPC');
  },
  from(table) {
    const filters = [];
    let patch;
    const q = {
      select: () => q,
      limit: () => q,
      eq: (key, value) => { filters.push([key, value]); return q; },
      update: value => { patch = value; return q; },
      maybeSingle: async () => ({ data: table === 'user_subscriptions' ? cancelRow : null, error: null }),
      then(resolve) {
        writes.push({ type: 'db', patch, filters });
        resolve({ data: [], error: persistenceError ? new Error('DB unavailable') : null });
      },
    };
    return q;
  },
};
class FakeStripe {
  static createFetchHttpClient() {
    return {};
  }
  promotionCodes = { list: async () => ({ has_more: false, data: [{ id: 'promo_city', code: 'CITY100', active: true,
    metadata: { app: promotionApp }, customer: null, expires_at: null, max_redemptions: null, times_redeemed: 0,
    promotion: { type: 'coupon', coupon: { id: 'coupon_city', valid: true, percent_off: 100,
      metadata: { app: 'city-map' }, applies_to: { products: ['prod_city'] } } },
  }] }) };
  prices = { retrieve: async () => ({ active: true, product: 'prod_city' }) };
  customers = { create: async () => ({ id: 'cus_city' }),
    retrieve: async () => ({ id: 'cus_city', metadata: { app: 'city-map', user_id: 'user' } }) };
  checkout = {
    sessions: {
      retrieve: async () => {
        if (checkoutEnabled) return checkoutSession;
        writes.push('stripe');
        throw new Error('unexpected Stripe');
      },
      create: async (params, options) => {
        writes.push({ type: 'session-create', params, options });
        checkoutSession = { id: 'cs_test_city', status: 'open', url: 'https://checkout.stripe.com/c/pay/city',
          customer: params.customer, subscription: null, payment_status: 'unpaid', metadata: params.metadata,
          allow_promotion_codes: false };
        return checkoutSession;
      },
    },
  };
  subscriptions = {
    list: async () => ({ data: [], has_more: false }),
    retrieve: async id => {
      writes.push({ type: 'retrieve', id });
      if (retrieveError) throw new Error('Stripe unavailable');
      return stripeSubscription;
    },
    update: async (id, patch) => {
      writes.push({ type: 'stripe-update', id, patch });
      return { ...stripeSubscription, cancel_at: 1893456000 };
    },
  };
}
globalThis.paymentTest = { db, FakeStripe };
globalThis.Deno = {
  env: {
    get: (name) =>
      /^SUPABASE_(SECRET|PUBLISHABLE)_KEYS?$/.test(name) ? undefined :
      name === 'APP_URL'
        ? 'https://city-map-alpha.vercel.app'
        : name === 'STRIPE_CITY_MAP_PRODUCT_IDS' ? 'prod_city'
        : name.startsWith('STRIPE_PRICE_')
        ? 'price_' + name.slice(13)
        : 'fixture',
  },
  serve: (value) => {
    handler = value;
  },
};
const bundle = await build({
  entryPoints: ['supabase/functions/process-payment/index.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  plugins: [{
    name: 'mock-io',
    setup(b) {
      b.onResolve({ filter: /^(https:|npm:)/ }, (args) => ({ path: args.path, namespace: 'mock' }));
      b.onLoad(
        { filter: /.*/, namespace: 'mock' },
        (args) => ({
          contents: args.path.startsWith('npm:stripe')
            ? 'export default globalThis.paymentTest.FakeStripe;'
            : 'export const createClient=()=>globalThis.paymentTest.db;',
        }),
      );
    },
  }],
});
await import(
  'data:text/javascript;base64,' +
    Buffer.from(bundle.outputFiles[0].text + '\n//# sourceURL=payment-handler.test-bundle.js')
      .toString('base64')
);
delete globalThis.Deno;
delete globalThis.paymentTest;
async function request(body, token = 'valid', method = 'POST') {
  writes.length = 0;
  const headers = token ? { Authorization: 'Bearer ' + token } : {};
  const response = await handler(
    new Request('https://example.invalid', {
      method,
      headers,
      ...(method === 'POST'
        ? { body: typeof body === 'string' ? body : JSON.stringify(body) }
        : {}),
    }),
  );
  return response;
}
test('payment handler rejects unsupported methods and missing/invalid authentication', async () => {
  assert.equal((await request({}, 'valid', 'GET')).status, 405);
  for (const token of ['', 'invalid']) {
    assert.equal((await request({ action: 'checkout', planKey: 'weekly' }, token)).status, 401);
  }
  assert.deepEqual(writes, []);
});
test('checkout persists the verified promo ID and sends only that discount to Stripe', async () => {
  checkoutEnabled = true;
  assert.equal((await request({ action: 'checkout', planKey: 'weekly', promoCode: 'CITY100' })).status, 200);
  assert.equal(checkoutRow.promotion_id, 'promo_city');
  const created = writes.find(item => item.type === 'session-create');
  assert.deepEqual(created.params.discounts, [{ promotion_code: 'promo_city' }]);
  assert.notEqual(created.params.allow_promotion_codes, true);
  assert.equal(created.options.idempotencyKey, 'city-map:checkout:attempt');
  assert.equal((await request({ action: 'checkout', planKey: 'weekly', promoCode: 'CITY100' })).status, 200);
  assert.equal(writes.some(item => item.type === 'session-create'), false);
});
test('undiscounted checkout disables account-wide promotion entry', async () => {
  checkoutEnabled = true;
  assert.equal((await request({ action: 'checkout', planKey: 'weekly' })).status, 200);
  const created = writes.find(item => item.type === 'session-create');
  assert.equal(created.params.allow_promotion_codes, false);
  assert.equal(created.params.discounts, undefined);
  assert.equal(checkoutRow.promotion_id, null);
});
test('foreign codes and client-supplied Stripe discount IDs cannot create checkout state', async () => {
  checkoutEnabled = true; promotionApp = 'other';
  for (const patch of [{ promoCode: 'CITY100' }, { promoCode: [] }, { promotionId: 'promo_city' },
    { coupon: 'coupon_city' }, { discounts: [{ promotion_code: 'promo_city' }] }]) {
    assert.equal((await request({ action: 'checkout', planKey: 'weekly', ...patch })).status, 400);
    assert.equal(checkoutRow, null);
    assert.deepEqual(writes, []);
  }
});
test('retired automatic contract and malformed input cannot create Stripe objects', async () => {
  for (
    const body of ['{', 'null', '[]', { planKey: 'weekly' }, {
      action: 'checkout',
      planKey: 'constructor',
    }, { action: 'unknown' }]
  ) {
    assert.equal((await request(body)).status, 400);
    assert.deepEqual(writes, []);
  }
  assert.equal((await request('x'.repeat(4097))).status, 413);
});
test('status requires an owned customer mapping before retrieving a Stripe session', async () => {
  assert.equal((await request({ action: 'status', sessionId: 'cs_test_other' })).status, 403);
  assert.deepEqual(writes, []);
});
test('cancel rejects a foreign or missing DB subscription before Stripe mutation', async () => {
  assert.equal(
    (await request({ action: 'cancel', subscriptionId: '11111111-1111-4111-8111-111111111111' }))
      .status,
    404,
  );
  assert.deepEqual(writes, []);
});

const cancellation = { action: 'cancel', subscriptionId: '11111111-1111-4111-8111-111111111111' };
function ownedSubscription() {
  cancelRow = { payment_id: 'SUB_sub_owned' };
  stripeSubscription = { status: 'active', metadata: { user_id: 'user', app: 'city-map' },
    items: { has_more: false, data: [{ price: { id: 'price_WEEKLY' } }] } };
}
test('paid cancellation schedules Stripe renewal stop and preserves current entitlement', async () => {
  ownedSubscription();
  assert.equal((await request(cancellation)).status, 200);
  assert.deepEqual(writes[1], { type: 'stripe-update', id: 'sub_owned', patch: { cancel_at_period_end: true } });
  assert.equal(writes[2].patch.cancel_at, '2030-01-01T00:00:00.000Z');
  assert.equal('status' in writes[2].patch, false);
  assert.deepEqual(writes[2].filters, [['id', cancellation.subscriptionId], ['user_id', 'user']]);
});
test('foreign app, foreign owner, unknown price and partial item lists cannot be canceled', async () => {
  for (const mutate of [s => { s.metadata.app = 'other-app'; }, s => { s.metadata.user_id = 'other'; },
    s => { s.items.data[0].price.id = 'price_other'; }, s => { s.items.has_more = true; }]) {
    ownedSubscription(); mutate(stripeSubscription);
    assert.equal((await request(cancellation)).status, 403);
    assert.equal(writes.some(write => write.type === 'stripe-update'), false);
  }
});
test('gifts and terminated subscriptions cannot enter paid cancellation', async () => {
  ownedSubscription(); cancelRow.payment_id = 'GIFT_MANUAL_user';
  assert.equal((await request(cancellation)).status, 404);
  assert.deepEqual(writes, []);
  ownedSubscription(); stripeSubscription.status = 'canceled';
  assert.equal((await request(cancellation)).status, 409);
  assert.equal(writes.some(write => write.type === 'stripe-update'), false);
});
test('Stripe or persistence failures never report successful cancellation', async () => {
  ownedSubscription(); retrieveError = true;
  assert.equal((await request(cancellation)).status, 503);
  assert.equal(writes.some(write => write.type === 'stripe-update'), false);
  retrieveError = false; persistenceError = true;
  assert.equal((await request(cancellation)).status, 503);
});
