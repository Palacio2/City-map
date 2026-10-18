import { secretKey } from '../_shared/keys.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import Stripe from 'npm:stripe@22.6.0';
import { resolvePromotion } from './promotion.ts';
import {
  assertSessionOwner,
  type Attempt,
  CheckoutError,
  type Session,
  startCheckout,
} from './checkout.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
function required(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error('Missing configuration: ' + name);
  return value;
}
const stripe = new Stripe(required('STRIPE_SECRET_KEY'), {
  apiVersion: '2026-08-26.dahlia',
  httpClient: Stripe.createFetchHttpClient(),
  timeout: 20_000,
  maxNetworkRetries: 1,
});
const db = createClient(required('SUPABASE_URL'), secretKey());
const origin = new URL(Deno.env.get('APP_URL') || 'https://city-map-alpha.vercel.app').origin;
if (!origin.startsWith('https://')) throw new Error('APP_URL must use HTTPS');
const prices: Record<string, string> = {};
const configuredPromoProducts = Deno.env.get('STRIPE_CITY_MAP_PRODUCT_IDS');
for (const plan of ['weekly', 'premium', 'realtor']) {
  prices[plan] = required('STRIPE_PRICE_' + plan.toUpperCase());
}
const terminal = (status: string) => ['canceled', 'incomplete_expired'].includes(status);
const reference = (value: string | { id: string } | null): string | null =>
  typeof value === 'string' ? value : value?.id ?? null;
function session(value: Stripe.Checkout.Session): Session {
  return {
    id: value.id,
    status: value.status,
    url: value.url,
    customer: reference(value.customer),
    subscription: reference(value.subscription),
    payment_status: value.payment_status,
    metadata: value.metadata,
    allow_promotion_codes: value.allow_promotion_codes,
  };
}
async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await db.rpc(name, args);
  if (error) throw error;
  return data;
}
async function ensureNoExistingSubscription(userId: string, customerId: string | null) {
  const { data, error } = await db.from('user_subscriptions').select('payment_id,status,ends_at')
    .eq('user_id', userId).limit(101);
  if (error) throw error;
  if (!data || data.length > 100) throw new CheckoutError('payment.errors.checkout_reconciliation');
  for (const row of data) {
    if (typeof row.payment_id === 'string' && /^SUB_sub_[A-Za-z0-9]+$/.test(row.payment_id)) {
      const sub = await stripe.subscriptions.retrieve(row.payment_id.slice(4));
      if (!terminal(sub.status)) throw new CheckoutError('payment.errors.already_active');
    } else if (
      ['active', 'trialing'].includes(row.status) && Date.parse(row.ends_at) > Date.now()
    ) throw new CheckoutError('payment.errors.already_active');
  }
  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (
      customer.deleted || customer.metadata.app !== 'city-map' ||
      customer.metadata.user_id !== userId
    ) throw new CheckoutError('payment.errors.checkout_owner', 403);
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 100,
    });
    if (subscriptions.has_more) throw new CheckoutError('payment.errors.checkout_reconciliation');
    if (subscriptions.data.some((sub) => !terminal(sub.status))) {
      throw new CheckoutError('payment.errors.already_active');
    }
  }
}
const deps = {
  now: () => Date.now(),
  claim: (userId: string, plan: string, price: string, promotion: string | null) =>
    rpc('claim_billing_checkout', { p_user_id: userId, p_plan: plan, p_price: price, p_promotion: promotion }),
  save: (
    attempt: Attempt,
    patch: { customer?: string; session?: string; plan?: string; price?: string; promotion?: string | null },
  ) =>
    rpc('save_billing_checkout', {
      p_user_id: attempt.user_id,
      p_token: attempt.lease_token,
      p_customer: patch.customer ?? null,
      p_session: patch.session ?? null,
      p_reset_plan: patch.plan ?? null,
      p_reset_price: patch.price ?? null,
      p_reset_promotion: patch.promotion ?? null,
    }),
  release: async (attempt: Attempt) => {
    await rpc('release_billing_checkout', {
      p_user_id: attempt.user_id,
      p_token: attempt.lease_token,
    });
  },
  ensureNoExistingSubscription,
  createCustomer: async (userId: string, key: string) =>
    (await stripe.customers.create({ metadata: { app: 'city-map', user_id: userId } }, {
      idempotencyKey: key,
    })).id,
  retrieveSession: async (id: string) => session(await stripe.checkout.sessions.retrieve(id)),
  expireSession: async (id: string) => session(await stripe.checkout.sessions.expire(id)),
  subscriptionTerminated: async (id: string) =>
    terminal((await stripe.subscriptions.retrieve(id)).status),
  createSession: async (a: Attempt) =>
    session(
      await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: a.customer_id!,
        line_items: [{ price: a.price_id, quantity: 1 }],
        ...(a.promotion_id ? { discounts: [{ promotion_code: a.promotion_id }] } : { allow_promotion_codes: false }),
        client_reference_id: a.user_id,
        metadata: { app: 'city-map', user_id: a.user_id, attempt_id: a.attempt_id },
        subscription_data: {
          metadata: { app: 'city-map', user_id: a.user_id, plan_key: a.plan_key },
        },
        expires_at: Math.floor(Date.parse(a.attempt_created_at) / 1000) + 23 * 3600,
        success_url: origin + '/payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: origin + '/subscription',
        integration_identifier: 'city-map-checkout-qmvkdztr',
      }, { idempotencyKey: 'city-map:checkout:' + a.attempt_id }),
    ),
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const { data: { user }, error: authError } = await db.auth.getUser(auth.slice(7));
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);
    const text = await req.text();
    if (text.length > 4096) return json({ error: 'Invalid request' }, 413);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(text);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    } catch {
      return json({ error: 'Invalid request' }, 400);
    }
    if (body.action === 'status') {
      if (typeof body.sessionId !== 'string' || !/^cs_[A-Za-z0-9_]+$/.test(body.sessionId)) {
        return json({ error: 'Invalid session' }, 400);
      }
      const { data, error } = await db.from('billing_checkout_state').select('customer_id').eq(
        'user_id',
        user.id,
      ).maybeSingle();
      if (error) throw error;
      if (!data?.customer_id) throw new CheckoutError('payment.errors.checkout_owner', 403);
      const value = session(await stripe.checkout.sessions.retrieve(body.sessionId));
      assertSessionOwner(value, user.id, data.customer_id);
      return json({
        sessionId: value.id,
        status: value.status,
        paymentStatus: value.payment_status,
        confirmed: value.status === 'complete' &&
          ['paid', 'no_payment_required'].includes(value.payment_status),
      });
    }
    if (body.action === 'cancel') {
      if (
        typeof body.subscriptionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.subscriptionId)
      ) return json({ error: 'Invalid subscription' }, 400);
      const { data, error } = await db.from('user_subscriptions').select('payment_id').eq(
        'id',
        body.subscriptionId,
      ).eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      if (!data || !/^SUB_sub_[A-Za-z0-9]+$/.test(data.payment_id ?? '')) {
        return json({ error: 'Subscription not found' }, 404);
      }
      const id = data.payment_id.slice(4), sub = await stripe.subscriptions.retrieve(id);
      if (
        sub.metadata.user_id !== user.id || (sub.metadata.app && sub.metadata.app !== 'city-map') ||
        sub.items.has_more || sub.items.data.length !== 1 ||
        !Object.values(prices).includes(sub.items.data[0].price.id)
      ) throw new CheckoutError('payment.errors.checkout_owner', 403);
      if (terminal(sub.status)) return json({ error: 'Subscription already ended' }, 409);
      const updated = await stripe.subscriptions.update(id, { cancel_at_period_end: true });
      const { error: writeError } = await db.from('user_subscriptions').update({
        cancel_at: updated.cancel_at ? new Date(updated.cancel_at * 1000).toISOString() : null,
      }).eq('id', body.subscriptionId).eq('user_id', user.id);
      if (writeError) throw writeError;
      return json({ success: true });
    }
    // Reject the retired automatic PaymentIntent contract before any Stripe write.
    if (
      body.action !== 'checkout' || typeof body.planKey !== 'string' ||
      !Object.hasOwn(prices, body.planKey)
    ) return json({ error: 'payment.errors.invalid_request' }, 400);
    if ('promotionId' in body || 'discounts' in body || 'coupon' in body) return json({ error: 'payment.errors.invalid_request' }, 400);
    const promotion = await resolvePromotion(stripe, body.promoCode, prices[body.planKey],
      configuredPromoProducts);
    return json(await startCheckout(deps, user.id, body.planKey, prices[body.planKey], promotion));
  } catch (error) {
    if (error instanceof CheckoutError) return json({ error: error.code }, error.status);
    console.error('Payment operation failed');
    return json({ error: 'payment.errors.create_failed' }, 503);
  }
});
