import { subscriptionPlans } from '../config/subscriptionPlans';
import type { PaidSubscription, SubscriptionData } from '../types';

const paidPlans = ['weekly', 'premium', 'realtor'];
const hierarchy: Record<string, string[]> = {
  free: ['free'], weekly: ['weekly'], premium: ['weekly', 'premium'], realtor: ['weekly', 'premium', 'realtor'],
};

export function normalizeSubscription(value: unknown, now = Date.now()): SubscriptionData {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const plan = typeof data.plan === 'string' ? data.plan : 'free';
  const expiresAt = typeof data.expiresAt === 'string' ? data.expiresAt : null;
  const expiry = expiresAt ? Date.parse(expiresAt) : NaN;
  const active = paidPlans.includes(plan) && ['active', 'trialing'].includes(String(data.status))
    && data.isExpired !== true && Number.isFinite(expiry) && expiry > now;
  const effectivePlan = active ? plan : 'free';
  const features = [...new Set(hierarchy[effectivePlan].flatMap(key => subscriptionPlans[key].features))];
  const uuid = (value: unknown): value is string => typeof value === 'string'
    && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
  const date = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
  const paidSubscriptions: PaidSubscription[] = [];
  if (Array.isArray(data.paidSubscriptions)) {
    for (const row of data.paidSubscriptions) {
      if (!row || typeof row !== 'object' || !uuid(row.id) || !paidPlans.includes(row.plan)
        || !['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete'].includes(row.status)
        || paidSubscriptions.some(item => item.id === row.id)) continue;
      paidSubscriptions.push({ id: row.id, plan: row.plan, status: row.status,
        expiresAt: date(row.expiresAt), cancel_at: date(row.cancel_at) });
    }
  }
  return {
    billingUnavailable: data.billingUnavailable === true,
    id: active && uuid(data.id) ? data.id : null,
    source: active && (data.source === 'gift' || data.source === 'paid') ? data.source : null,
    paidSubscriptions,
    plan: effectivePlan, features, expiresAt: active ? expiresAt : null,
    status: active ? String(data.status) : 'active', isExpired: false,
  };
}
