import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventSubscriptionId, subscriptionRecord } from '../functions/_shared/stripeSubscription.ts';
import { createWebhookHandler, type WebhookDependencies } from '../functions/stripe-webhook-City-map/handler.ts';
const owner = '11111111-1111-4111-8111-111111111111';
const prices = { price_week: 'weekly', price_pro: 'premium', price_agent: 'realtor' };
const item = { price: { id: 'price_week' }, current_period_start: 1780000000, current_period_end: 1780604800 };
const subscription = () => ({ id: 'sub_city', livemode: true, status: 'active', metadata: { user_id: owner, plan_key: 'realtor' }, items: { data: [item] } });
const event = (type = 'customer.subscription.updated') => ({ id: 'evt_city', livemode: true, type, data: { object: { id: 'sub_city' } } });

test('uses recognized price and exact item period, never metadata plan or thirty-day fallback', () => {
  const record = subscriptionRecord(subscription(), prices, null)!;
  assert.equal(record.plan_name, 'weekly');
  assert.equal(Date.parse(record.ends_at) - Date.parse(record.starts_at), 7 * 86400000);
  assert.equal(record.user_id, owner);
});
test('accepts legacy periods and current expanded invoice subscription references', () => {
  const old = { ...subscription(), items: { data: [{ price: 'price_pro' }] }, current_period_start: item.current_period_start, current_period_end: item.current_period_end };
  assert.equal(subscriptionRecord(old, prices, null)?.plan_name, 'premium');
  assert.equal(eventSubscriptionId('invoice.paid', { parent: { subscription_details: { subscription: { id: 'sub_city' } } } }), 'sub_city');
  assert.equal(eventSubscriptionId('invoice.payment_succeeded', { subscription: 'sub_city' }), 'sub_city');
});
test('ignores unrelated subscriptions but fails closed for known owners with unknown prices', () => {
  const other = { ...subscription(), metadata: {}, items: { data: [{ ...item, price: 'price_other' }] } };
  assert.equal(subscriptionRecord(other, prices, null), null);
  assert.throws(() => subscriptionRecord(other, prices, owner));
});
for (const [label, patch] of [
  ['missing period', { items: { data: [{ price: 'price_week' }] } }],
  ['invalid period', { items: { data: [{ ...item, current_period_end: 1 }] } }],
  ['mixed items', { items: { data: [item, { ...item, price: 'price_other' }] } }],
  ['paginated items', { items: { data: [item], has_more: true } }],
  ['missing owner', { metadata: {} }],
  ['invalid status', { status: 'paid' }],
  ['wrong application', { metadata: { user_id: owner, app: 'other' } }],
] as const) test('rejects ' + label, () => assert.throws(() => subscriptionRecord({ ...subscription(), ...patch }, prices, null)));
test('existing association cannot be reassigned through metadata', () => {
  assert.throws(() => subscriptionRecord(subscription(), prices, '22222222-2222-4222-8222-222222222222'));
  assert.equal(subscriptionRecord({ ...subscription(), metadata: {} }, prices, owner)?.user_id, owner);
});
function harness(overrides: Partial<WebhookDependencies> = {}, incoming: unknown = event()) {
  const calls: string[] = [];
  let saved: unknown;
  const deps: WebhookDependencies = {
    prices, livemode: true,
    verify: async () => { calls.push('verify'); return incoming; },
    claim: async () => { calls.push('claim'); return { state: 'claimed', token: 'token' }; },
    retrieve: async () => { calls.push('retrieve'); return subscription(); },
    owner: async () => { calls.push('owner'); return owner; },
    finish: async (_e, _s, _t, _lease, record) => { calls.push('finish'); saved = record; },
    release: async () => { calls.push('release'); }, ...overrides,
  };
  const handler = createWebhookHandler(deps);
  return { calls, saved: () => saved, send: (headers = { 'stripe-signature': 'valid' }, method = 'POST') => handler(new Request('https://example.invalid', { method, headers, ...(method === 'POST' ? { body: '{}' } : {}) })) };
}
test('rejects method, missing signature and invalid signature before any database operation', async () => {
  const h = harness();
  assert.equal((await h.send({}, 'GET')).status, 405);
  assert.equal((await h.send({})).status, 400); assert.deepEqual(h.calls, []);
  const bad = harness({ verify: async () => { throw new Error('signature secret'); } });
  const res = await bad.send(); assert.equal(res.status, 400); assert.equal((await res.text()).includes('secret'), false);
});
test('acquires lease before reading current subscription and commits once', async () => {
  const h = harness(); assert.equal((await h.send()).status, 200);
  assert.deepEqual(h.calls, ['verify', 'claim', 'retrieve', 'owner', 'finish']);
});
test('old successful invoice cannot reactivate a canceled subscription', async () => {
  const incoming = { ...event('invoice.payment_succeeded'), data: { object: { subscription: 'sub_city', amount_paid: 99999 } } };
  const h = harness({ retrieve: async () => ({ ...subscription(), status: 'canceled' }) }, incoming);
  assert.equal((await h.send()).status, 200);
  assert.equal((h.saved() as { status: string }).status, 'canceled');
  assert.equal(Object.hasOwn(h.saved() as object, 'amount'), false);
});
test('payment failure reconciles past_due instead of granting active', async () => {
  const incoming = { ...event('invoice.payment_failed'), data: { object: { parent: { subscription_details: { subscription: 'sub_city' } } } } };
  const h = harness({ retrieve: async () => ({ ...subscription(), status: 'past_due' }) }, incoming);
  assert.equal((await h.send()).status, 200); assert.equal((h.saved() as { status: string }).status, 'past_due');
});
test('duplicate receipt prevents another read/write; busy lease asks Stripe to retry', async () => {
  for (const [state, expected] of [['duplicate', 200], ['busy', 503]] as const) {
    const h = harness({ claim: async () => ({ state }) });
    assert.equal((await h.send()).status, expected); assert.deepEqual(h.calls, ['verify']);
  }
});
for (const step of ['retrieve', 'owner', 'finish'] as const) test(step + ' failure is retryable and releases only its lease', async () => {
  const h = harness({ [step]: async () => { throw new Error('sensitive provider error'); } });
  const res = await h.send(); assert.equal(res.status, 500);
  assert.equal(await res.text(), 'Webhook processing failed'); assert.equal(h.calls.at(-1), 'release');
});
test('mode mismatch cannot reach database and unrelated event is ignored', async () => {
  const wrong = harness({}, { ...event(), livemode: false }); assert.equal((await wrong.send()).status, 500); assert.deepEqual(wrong.calls, ['verify']);
  const other = harness({}, event('customer.created')); assert.equal((await other.send()).status, 200); assert.deepEqual(other.calls, ['verify']);
});
test('overlapping delivery never reads Stripe under another worker lease', async () => {
  let unlock!: () => void; let claimed = false, reads = 0, writes = 0;
  const gate = new Promise<void>(resolve => { unlock = resolve; });
  const h = harness({
    claim: async () => { if (claimed) return { state: 'busy' }; claimed = true; return { state: 'claimed', token: 'token' }; },
    retrieve: async () => { reads++; await gate; return subscription(); },
    finish: async () => { writes++; },
  });
  const first = h.send();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal((await h.send()).status, 503); unlock();
  assert.equal((await first).status, 200); assert.equal(reads, 1); assert.equal(writes, 1);
});
