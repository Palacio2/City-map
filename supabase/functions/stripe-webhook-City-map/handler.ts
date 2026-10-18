import { eventSubscriptionId, object, subscriptionRecord } from '../_shared/stripeSubscription.ts';

type RecordData = ReturnType<typeof subscriptionRecord>;
export interface WebhookDependencies {
  verify(body: string, signature: string): Promise<unknown>;
  claim(eventId: string, subscriptionId: string): Promise<{ state: string; token?: string }>;
  retrieve(subscriptionId: string): Promise<unknown>;
  owner(subscriptionId: string): Promise<string | null>;
  finish(eventId: string, subscriptionId: string, type: string, token: string, record: RecordData): Promise<void>;
  release(subscriptionId: string, token: string): Promise<void>;
  prices: Record<string, string>;
  livemode: boolean;
}
export function createWebhookHandler(deps: WebhookDependencies) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
    const signature = req.headers.get('stripe-signature');
    if (!signature) return new Response('Missing signature', { status: 400 });
    let event;
    try { event = object(await deps.verify(await req.text(), signature)); }
    catch { return new Response('Invalid signature', { status: 400 }); }
    let subscriptionId: string | null = null, token: string | undefined;
    try {
      if (event.livemode !== deps.livemode) throw new Error('Stripe mode mismatch');
      if (typeof event.id !== 'string' || !/^evt_[A-Za-z0-9]+$/.test(event.id) || typeof event.type !== 'string') throw new Error('Invalid event');
      subscriptionId = eventSubscriptionId(event.type, object(event.data).object);
      if (!subscriptionId) return Response.json({ received: true, ignored: true });
      const claim = await deps.claim(event.id, subscriptionId);
      if (claim.state === 'duplicate') return Response.json({ received: true, duplicate: true });
      if (claim.state !== 'claimed' || !claim.token) return new Response('Retry later', { status: 503, headers: { 'Retry-After': '5' } });
      token = claim.token;
      // Read after taking the per-subscription lease: even an old invoice event
      // reconciles current Stripe state instead of replaying stale access.
      const current = await deps.retrieve(subscriptionId);
      if (object(current).id !== subscriptionId || object(current).livemode !== deps.livemode) throw new Error('Stripe object mismatch');
      const owner = await deps.owner(subscriptionId);
      const record = subscriptionRecord(current, deps.prices, owner);
      await deps.finish(event.id, subscriptionId, event.type, token, record);
      return Response.json({ received: true });
    } catch {
      if (subscriptionId && token) {
        try { await deps.release(subscriptionId, token); } catch { /* Lease expiry permits retry after a database outage. */ }
      }
      // Do not echo payloads, customer data or provider errors.
      console.error('Stripe webhook reconciliation failed');
      return new Response('Webhook processing failed', { status: 500 });
    }
  };
}
