export interface SubscriptionRow {
  id: string;
  plan_name: string;
  status: string;
  payment_id: string | null;
  starts_at?: string | null;
  ends_at: string | null;
  cancel_at?: string | null;
}
const ranks: Record<string, number> = { weekly: 1, premium: 2, realtor: 3 };
const renewable = new Set(['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete']);
const source = (row: SubscriptionRow) => /^SUB_sub_[A-Za-z0-9]+$/.test(row.payment_id ?? '')
  ? 'paid' : row.payment_id?.startsWith('GIFT_') ? 'gift' : null;

export function subscriptionState(rows: SubscriptionRow[], now = Date.now()) {
  const recognized = rows.filter(row => Object.hasOwn(ranks, row.plan_name) && source(row));
  const access = recognized.filter(row => ['active', 'trialing'].includes(row.status)
    && Date.parse(row.ends_at ?? '') > now
    && (!row.starts_at || Date.parse(row.starts_at) <= now))
    .sort((a, b) => ranks[b.plan_name] - ranks[a.plan_name]
      || Date.parse(b.ends_at!) - Date.parse(a.ends_at!) || a.id.localeCompare(b.id))[0];
  // Billing survives loss of entitlement and is independent of the strongest gift/plan.
  const paidSubscriptions = recognized.filter(row => source(row) === 'paid' && renewable.has(row.status))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(row => ({ id: row.id, plan: row.plan_name, status: row.status, expiresAt: row.ends_at,
      cancel_at: row.cancel_at ?? null }));
  return {
    id: access?.id ?? null, plan: access?.plan_name ?? 'free', status: access?.status ?? 'active',
    expiresAt: access?.ends_at ?? null, source: access ? source(access) : null,
    paidSubscriptions,
  };
}
