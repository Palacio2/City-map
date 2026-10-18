import { it, expect } from 'vitest';
import { normalizeSubscription } from './subscriptionAccess';
const now = Date.parse('2026-10-05T00:00:00Z');
const valid = { plan: 'realtor', status: 'active', expiresAt: '2026-10-06T00:00:00Z' };
const paid = { id: '11111111-1111-4111-8111-111111111111', plan: 'premium', status: 'past_due',
  expiresAt: '2026-10-01T00:00:00Z', cancel_at: null };
it('preserves paid billing independently of free or gift access through repeated normalization', () => {
  for (const access of [{ plan: 'free' }, { ...valid, source: 'gift' }]) {
    const normalized = normalizeSubscription({ ...access, paidSubscriptions: [paid] }, now);
    expect(normalized.paidSubscriptions).toEqual([paid]);
    expect(normalizeSubscription(normalized, now).paidSubscriptions).toEqual([paid]);
  }
});
it('drops malformed billing entries and preserves scheduled cancellation', () => {
  const cancel_at = '2026-10-20T00:00:00Z';
  expect(normalizeSubscription({ paidSubscriptions: [null, {}, { ...paid, id: 'gift' },
    { ...paid, status: 'canceled' }, { ...paid, cancel_at }, paid] }, now).paidSubscriptions)
    .toEqual([{ ...paid, cancel_at }]);
});
it.each(['canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', '', undefined])('denies paid access for status %s', status => {
  expect(normalizeSubscription({ ...valid, status }, now).plan).toBe('free');
});
it.each([null, '', 'invalid', '2026-10-04T00:00:00Z', '2026-10-05T00:00:00Z'])('denies invalid or elapsed expiry %s', expiresAt => {
  expect(normalizeSubscription({ ...valid, expiresAt }, now).plan).toBe('free');
});
it.each([null, {}, { ...valid, plan: 'constructor' }, { ...valid, plan: 'unknown' }, { ...valid, isExpired: true }])('fails closed for malformed/unrecognized records %#', value => {
  expect(normalizeSubscription(value, now).plan).toBe('free');
});
it('accepts active/trialing plans and includes inherited features without duplicates', () => {
  for (const status of ['active', 'trialing']) {
    const data = normalizeSubscription({ ...valid, status }, now);
    expect(data.plan).toBe('realtor');
    expect(data.features).toContain('save_favorites'); expect(data.features).toContain('roi_calculator');
    expect(new Set(data.features).size).toBe(data.features?.length);
  }
  expect(normalizeSubscription({ ...valid, plan: 'weekly' }, now).features).not.toContain('roi_calculator');
});
