import { secretKey } from '../_shared/keys.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import Stripe from 'npm:stripe@22.6.0';
import { readJsonObject, RequestError } from '../_shared/request.ts';
import { collectPages } from '../_shared/pagination.ts';
import { subscriptionRecord } from '../_shared/stripeSubscription.ts';
import { paidInvoice } from './invoice.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'private, no-store',
};
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  try {
    const token = req.headers.get('Authorization');
    if (!token?.startsWith('Bearer ')) throw new RequestError('Unauthorized', 401);
    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', secretKey());
    const { data: { user }, error: authError } = await db.auth.getUser(token.slice(7));
    if (authError || !user) throw new RequestError('Unauthorized', 401);
    const { page = 1, limit = 5 } = await readJsonObject(req);
    if (!Number.isSafeInteger(page) || Number(page) < 1 || Number(page) > 2000 || !Number.isSafeInteger(limit) || Number(limit) < 1 || Number(limit) > 50) throw new RequestError('Invalid pagination');
    const links = await collectPages<{ payment_id: string }>(async (offset, size) => {
      const { data, error } = await db.from('user_subscriptions').select('payment_id').eq('user_id', user.id)
        .like('payment_id', 'SUB_sub_%').order('id').range(offset, offset + size - 1);
      if (error) throw error;
      return data ?? [];
    });
    const ids = [...new Set(links.map(row => row.payment_id).filter(id => /^SUB_sub_[A-Za-z0-9]+$/.test(id)).map(id => id.slice(4)))];
    if (ids.length > 100) throw new Error('Billing history requires reconciliation');
    if (!ids.length) return Response.json({ subscriptions: [], count: 0 }, { headers });
    const key = Deno.env.get('STRIPE_SECRET_KEY');
    if (!key) throw new Error('Billing not configured');
    const stripe = new Stripe(key, { apiVersion: '2026-08-26.dahlia', httpClient: Stripe.createFetchHttpClient(), timeout: 20_000, maxNetworkRetries: 1 });
    const prices: Record<string, string> = {};
    for (const plan of ['weekly', 'premium', 'realtor']) {
      const price = Deno.env.get('STRIPE_PRICE_' + plan.toUpperCase());
      if (!price) throw new Error('Billing price configuration missing');
      prices[price] = plan;
    }
    const history = new Map<string, ReturnType<typeof paidInvoice>>();
    let pageReads = 0;
    for (const id of ids) {
      const sub = await stripe.subscriptions.retrieve(id);
      // Match the webhook's price/owner/application validation, including
      // verified local associations for legacy City-Maps subscriptions.
      const verified = subscriptionRecord(sub, prices, user.id);
      if (!verified || verified.user_id !== user.id) throw new Error('Subscription ownership mismatch');
      let cursor: string | undefined;
      for (let batch = 0; ; batch++) {
        if (batch >= 100 || ++pageReads > 100) throw new Error('Billing history exceeds safe size');
        const invoices = await stripe.invoices.list({ subscription: id, status: 'paid', limit: 100, ...(cursor ? { starting_after: cursor } : {}) });
        for (const invoice of invoices.data) {
          const item = paidInvoice(invoice, id, sub.customer, prices);
          history.set(item.id, item);
          if (history.size > 10_000) throw new Error('Billing history exceeds safe size');
        }
        if (!invoices.has_more) break;
        const next = invoices.data.at(-1)?.id;
        if (!next || next === cursor) throw new Error('Invalid invoice pagination');
        cursor = next;
      }
    }
    const ordered = [...history.values()].sort((a,b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
    const start = (Number(page) - 1) * Number(limit);
    return Response.json({ subscriptions: ordered.slice(start, start + Number(limit)), count: ordered.length }, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof RequestError ? error.message : 'Billing history unavailable' },
      { status: error instanceof RequestError ? error.status : 503, headers });
  }
});
