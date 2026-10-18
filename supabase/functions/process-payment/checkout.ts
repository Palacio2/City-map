export interface Attempt {
  user_id: string;
  customer_id: string | null;
  attempt_id: string;
  attempt_created_at: string;
  plan_key: string;
  price_id: string;
  promotion_id: string | null;
  session_id: string | null;
  lease_token: string;
}
export interface Session {
  id: string;
  status: string | null;
  url: string | null;
  customer: string | null;
  subscription: string | null;
  payment_status: string;
  metadata: Record<string, string> | null;
  allow_promotion_codes?: boolean | null;
}
export class CheckoutError extends Error {
  code: string;
  status: number;
  constructor(code: string, status = 409) {
    super(code);
    this.code = code;
    this.status = status;
  }
}
export interface CheckoutDependencies {
  claim(userId: string, plan: string, price: string, promotion: string | null): Promise<Attempt | { busy: true }>;
  save(
    attempt: Attempt,
    patch: { customer?: string; session?: string; plan?: string; price?: string; promotion?: string | null },
  ): Promise<Attempt>;
  release(attempt: Attempt): Promise<void>;
  ensureNoExistingSubscription(userId: string, customerId: string | null): Promise<void>;
  createCustomer(userId: string, key: string): Promise<string>;
  retrieveSession(id: string): Promise<Session>;
  expireSession(id: string): Promise<Session>;
  subscriptionTerminated(id: string): Promise<boolean>;
  createSession(attempt: Attempt): Promise<Session>;
  now(): number;
}
export function assertSessionOwner(session: Session, userId: string, customerId?: string | null) {
  if (
    session.metadata?.app !== 'city-map' || session.metadata?.user_id !== userId ||
    (customerId && session.customer !== customerId)
  ) throw new CheckoutError('payment.errors.checkout_owner', 403);
}
function result(session: Session) {
  if (session.status === 'complete') return { sessionId: session.id, completed: true, url: null };
  if (session.status !== 'open' || !session.url) {
    throw new CheckoutError('payment.errors.checkout_unavailable');
  }
  const url = new URL(session.url);
  if (
    url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' || url.username ||
    url.password || url.port
  ) throw new Error('Invalid checkout URL');
  return { sessionId: session.id, completed: false, url: session.url };
}
export async function startCheckout(
  deps: CheckoutDependencies,
  userId: string,
  plan: string,
  price: string,
  promotion: string | null = null,
) {
  const claimed = await deps.claim(userId, plan, price, promotion);
  if ('busy' in claimed) throw new CheckoutError('payment.errors.checkout_busy', 503);
  let attempt = claimed;
  try {
    if (attempt.session_id) {
      let previous = await deps.retrieveSession(attempt.session_id);
      assertSessionOwner(previous, userId, attempt.customer_id);
      if (previous.status === 'complete') {
        if (!previous.subscription || !await deps.subscriptionTerminated(previous.subscription)) {
          return result(previous);
        }
      } else if (previous.status === 'open') {
        if (attempt.plan_key === plan && attempt.price_id === price && attempt.promotion_id === promotion
          && previous.allow_promotion_codes !== true) {
          await deps.ensureNoExistingSubscription(userId, attempt.customer_id);
          return result(previous);
        }
        // Expiration is atomic at Stripe: if checkout completed concurrently this
        // fails, and no second session is created. The next request re-reads it.
        previous = await deps.expireSession(previous.id);
        if (previous.status !== 'expired') {
          throw new CheckoutError('payment.errors.checkout_busy', 503);
        }
      } else if (previous.status !== 'expired') throw new Error('Unknown checkout state');
      attempt = await deps.save(attempt, { plan, price, promotion });
    }
    // Never reuse an uncertain creation request beyond Stripe's retention window.
    // In particular, do not rotate an unknown attempt just because it is old.
    const age = deps.now() - Date.parse(attempt.attempt_created_at);
    if (!Number.isFinite(age) || age < -60_000 || age >= 22 * 3600_000) {
      throw new CheckoutError('payment.errors.checkout_reconciliation');
    }
    if (attempt.plan_key !== plan || attempt.price_id !== price || attempt.promotion_id !== promotion) {
      throw new CheckoutError('payment.errors.checkout_resume_original');
    }
    await deps.ensureNoExistingSubscription(userId, attempt.customer_id);
    if (!attempt.customer_id) {
      const customer = await deps.createCustomer(userId, 'city-map:customer:' + attempt.attempt_id);
      attempt = await deps.save(attempt, { customer });
    }
    const session = await deps.createSession(attempt);
    assertSessionOwner(session, userId, attempt.customer_id);
    await deps.save(attempt, { session: session.id });
    return result(session);
  } finally {
    await deps.release(attempt);
  }
}
