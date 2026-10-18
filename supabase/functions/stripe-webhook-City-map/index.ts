import { secretKey } from '../_shared/keys.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import Stripe from 'npm:stripe@22.6.0';
import { createWebhookHandler } from './handler.ts';

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error('Missing configuration: ' + name);
  return value;
}
const key = required('STRIPE_SECRET_KEY');
const mode = /^(?:sk|rk)_(live|test)_/.exec(key)?.[1];
if (!mode) throw new Error('Unsupported Stripe key mode');
const stripe = new Stripe(key, {
  apiVersion: '2026-08-26.dahlia', httpClient: Stripe.createFetchHttpClient(), timeout: 20_000, maxNetworkRetries: 1,
});
const secret = required('STRIPE_WEBHOOK_SECRET_CITY_MAP');
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const db = createClient(required('SUPABASE_URL'), secretKey());
const prices: Record<string, string> = {};
for (const plan of ['weekly', 'premium', 'realtor']) {
  const price = required('STRIPE_PRICE_' + plan.toUpperCase());
  if (!/^price_[A-Za-z0-9]+$/.test(price) || Object.hasOwn(prices, price)) throw new Error('Invalid Stripe price configuration');
  prices[price] = plan;
}
async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await db.rpc(name, args);
  if (error) throw error;
  return data;
}
Deno.serve(createWebhookHandler({
  prices, livemode: mode === 'live',
  verify: (body, signature) => stripe.webhooks.constructEventAsync(body, signature, secret, undefined, cryptoProvider),
  claim: (eventId, subscriptionId) => rpc('claim_stripe_webhook', { p_event_id: eventId, p_subscription_id: subscriptionId }),
  retrieve: subscriptionId => stripe.subscriptions.retrieve(subscriptionId),
  owner: async subscriptionId => {
    return await rpc('billing_subscription_owner', {p_subscription_id:subscriptionId});
  },
  finish: async (eventId, subscriptionId, type, token, record) => {
    await rpc('finish_stripe_webhook', { p_event_id: eventId, p_subscription_id: subscriptionId, p_event_type: type, p_token: token, p_record: record });
  },
  release: async (subscriptionId, token) => { await rpc('release_stripe_webhook', { p_subscription_id: subscriptionId, p_token: token }); },
}));
