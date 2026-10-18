// Runtime-neutral validation for both old webhook payloads and current Stripe reads.
type ObjectData = Record<string, unknown>;
export const object = (value: unknown): ObjectData => value && typeof value === 'object' && !Array.isArray(value) ? value as ObjectData : {};
const id = (value: unknown) => typeof value === 'string' ? value : object(value).id;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const statuses = ['active', 'trialing', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused'];

export function eventSubscriptionId(type: string, payload: unknown): string | null {
  const data = object(payload);
  let value: unknown;
  if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
    'customer.subscription.paused', 'customer.subscription.resumed'].includes(type)) value = data.id;
  else if (['invoice.paid', 'invoice.payment_succeeded', 'invoice.payment_failed', 'invoice.marked_uncollectible',
    'invoice.voided', 'checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(type)) {
    value = id(data.subscription) ?? id(object(object(data.parent).subscription_details).subscription);
  } else return null;
  if (value == null) return null; // One-off invoices / sessions from the other application.
  if (typeof value !== 'string' || !/^sub_[A-Za-z0-9]+$/.test(value)) throw new Error('Invalid subscription ID');
  return value;
}
function date(value: unknown, required = false): string | null {
  if (value == null && !required) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > 253402300799) throw new Error('Invalid Stripe timestamp');
  return new Date(value * 1000).toISOString();
}
export function subscriptionRecord(value: unknown, prices: Record<string, string>, existingOwner: string | null) {
  const sub = object(value), metadata = object(sub.metadata), items = object(sub.items);
  const rows = Array.isArray(items.data) ? items.data.map(object) : [];
  const recognized = rows.filter(item => typeof id(item.price) === 'string' && Object.hasOwn(prices, String(id(item.price))));
  if (!recognized.length && !existingOwner && metadata.app !== 'city-map') return null;
  if (recognized.length !== 1 || rows.length !== 1 || items.has_more === true) throw new Error('Unrecognized or mixed subscription prices');
  const item = recognized[0], plan = prices[String(id(item.price))];
  if (!['weekly', 'premium', 'realtor'].includes(plan)) throw new Error('Invalid price mapping');
  // An existing database association wins. Legacy metadata is allowed only for a
  // recognized City-map price; it never selects the plan or overrides an owner.
  const owner = existingOwner ?? metadata.user_id;
  if (typeof owner !== 'string' || !uuid.test(owner)) throw new Error('Missing subscription owner');
  if (existingOwner && metadata.user_id && metadata.user_id !== existingOwner) throw new Error('Subscription owner mismatch');
  if (metadata.app && metadata.app !== 'city-map') throw new Error('Subscription application mismatch');
  if (typeof sub.id !== 'string' || !/^sub_[A-Za-z0-9]+$/.test(sub.id)) throw new Error('Invalid subscription ID');
  if (typeof sub.status !== 'string' || !statuses.includes(sub.status)) throw new Error('Invalid subscription status');
  const startsAt = date(item.current_period_start ?? sub.current_period_start, true)!;
  const endsAt = date(item.current_period_end ?? sub.current_period_end, true)!;
  if (Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error('Invalid subscription period');
  return { user_id: owner, payment_id: 'SUB_' + sub.id, plan_name: plan, status: sub.status,
    starts_at: startsAt, ends_at: endsAt, cancel_at: date(sub.cancel_at), cancelled_at: date(sub.canceled_at) };
}
