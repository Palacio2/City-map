import { subscriptionState, type SubscriptionRow } from '../functions/_shared/subscriptionState.ts';
const now = Date.parse('2026-10-10');
const row = (patch: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  id: 'paid', plan_name: 'premium', status: 'active', payment_id: 'SUB_sub_test',
  starts_at: '2026-01-01', ends_at: '2026-12-01', ...patch,
});
Deno.test('strongest current access wins independently of expiry order and paid billing', () => {
  const gift = row({ id: 'gift', plan_name: 'realtor', payment_id: 'GIFT_MANUAL_test', ends_at: '2026-10-20' });
  for (const rows of [[row(), gift], [gift, row()]]) {
    const state = subscriptionState(rows, now);
    if (state.plan !== 'realtor' || state.id !== 'gift' || state.source !== 'gift'
      || state.paidSubscriptions.length !== 1 || state.paidSubscriptions[0].id !== 'paid') throw new Error('Access/billing mixed');
  }
});
Deno.test('revoked gift falls back to paid plan; equal plans prefer longest expiry', () => {
  const revoked = row({ id: 'gift', plan_name: 'realtor', payment_id: 'GIFT_x', status: 'canceled' });
  if (subscriptionState([row(), revoked], now).plan !== 'premium') throw new Error('Fallback failed');
  if (subscriptionState([row(), row({ id: 'short', ends_at: '2026-10-11' })], now).id !== 'paid') throw new Error('Tie failed');
});
Deno.test('expired, future, unknown and delinquent records cannot grant access', () => {
  for (const patch of [{ ends_at: '2026-10-10' }, { ends_at: 'bad' }, { starts_at: '2027-01-01' },
    { plan_name: 'constructor' }, { payment_id: 'unknown' }, { status: 'past_due' }, { status: 'unpaid' }, { status: 'paused' }]) {
    if (subscriptionState([row(patch)], now).plan !== 'free') throw new Error('Invalid access granted');
  }
});
Deno.test('overdue paid billing stays manageable without entitlement', () => {
  const state = subscriptionState([row({ status: 'past_due', ends_at: '2026-01-02' }),
    row({ id: 'second', status: 'unpaid' }), row({ id: 'terminal', status: 'canceled' })], now);
  if (state.plan !== 'free' || state.paidSubscriptions.length !== 2) throw new Error('Billing hidden or access granted');
});
Deno.test('scheduled cancellation preserves access until expiry', () => {
  const state = subscriptionState([row({ cancel_at: '2026-12-01' })], now);
  if (state.plan !== 'premium' || state.paidSubscriptions[0].cancel_at !== '2026-12-01') throw new Error('Cancellation lost');
});
