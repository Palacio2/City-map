import { object } from '../_shared/stripeSubscription.ts';
import { stripeCurrencyDivisor } from '../../../shared/billingCurrency.ts';
const reference = (value: unknown) => typeof value === 'string' ? value : object(value).id;
export function paidInvoice(value: unknown, subscriptionId: string, customer: unknown, prices: Record<string,string>) {
  const invoice = object(value);
  const subscription = reference(invoice.subscription) ?? reference(object(object(invoice.parent).subscription_details).subscription);
  if (subscription !== subscriptionId || reference(invoice.customer) !== reference(customer) || !reference(customer)) throw new Error('Invoice ownership mismatch');
  if (invoice.status !== 'paid' || typeof invoice.id !== 'string' || !/^in_[A-Za-z0-9]+$/.test(invoice.id)) throw new Error('Invalid paid invoice');
  if (!Number.isSafeInteger(invoice.amount_paid) || Number(invoice.amount_paid) < 0 || typeof invoice.currency !== 'string' || !/^[a-z]{3}$/.test(invoice.currency)) throw new Error('Invalid invoice amount');
  const paidAt = object(invoice.status_transitions).paid_at ?? invoice.created;
  if (!Number.isSafeInteger(paidAt) || Number(paidAt) <= 0 || Number(paidAt) > 253402300799) throw new Error('Invalid invoice date');
  const lines = object(invoice.lines);
  const plans = new Set((Array.isArray(lines.data) ? lines.data : []).map(line => {
    const item = object(line);
    return prices[String(reference(item.price) ?? reference(object(object(item.pricing).price_details).price))];
  }).filter(Boolean));
  return {
    id: invoice.id, payment_id: invoice.id, invoice_number: typeof invoice.number === 'string' ? invoice.number : null,
    plan_name: plans.size === 1 && lines.has_more !== true ? [...plans][0] : null,
    created_at: new Date(Number(paidAt) * 1000).toISOString(),
    // Keep legacy amount in major units during rollout; new clients use the
    // explicit integer field and never infer units from the displayed currency.
    amount: Number(invoice.amount_paid) / stripeCurrencyDivisor(invoice.currency.toUpperCase()),
    amount_minor: Number(invoice.amount_paid), currency: invoice.currency.toUpperCase(), status: 'paid',
  };
}
