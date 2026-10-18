import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertSessionOwner,
  type Attempt,
  type CheckoutDependencies,
  type Session,
  startCheckout,
} from '../functions/process-payment/checkout.ts';
const now = Date.parse('2026-10-09T00:00:00Z');
function fixture(patch: Partial<Attempt> = {}, changes: Partial<CheckoutDependencies> = {}) {
  let row: Attempt = {
    user_id: 'user',
    customer_id: null,
    attempt_id: 'attempt',
    attempt_created_at: new Date(now).toISOString(),
    plan_key: 'weekly',
    price_id: 'price_week',
    promotion_id: null,
    session_id: null,
    lease_token: 'lease',
    ...patch,
  };
  const calls: string[] = [];
  const session: Session = {
    id: 'cs_test_one',
    status: 'open',
    url: 'https://checkout.stripe.com/c/pay/cs_test_one',
    customer: 'cus_one',
    subscription: null,
    payment_status: 'unpaid',
    metadata: { app: 'city-map', user_id: 'user' },
  };
  const deps: CheckoutDependencies = {
    now: () => now,
    claim: async () => {
      calls.push('claim');
      return { ...row };
    },
    save: async (_a, p) => {
      calls.push('save');
      row = {
        ...row,
        customer_id: p.customer ?? row.customer_id,
        session_id: p.session ?? row.session_id,
        ...(p.plan
          ? {
            plan_key: p.plan,
            price_id: p.price!,
            promotion_id: p.promotion ?? null,
            session_id: null,
            attempt_id: 'new',
            attempt_created_at: new Date(now).toISOString(),
          }
          : {}),
      };
      return { ...row };
    },
    release: async () => {
      calls.push('release');
    },
    ensureNoExistingSubscription: async () => {
      calls.push('existing');
    },
    createCustomer: async (_u, key) => {
      calls.push(key);
      return 'cus_one';
    },
    retrieveSession: async () => {
      calls.push('retrieve');
      return { ...session };
    },
    expireSession: async () => {
      calls.push('expire');
      return { ...session, status: 'expired' };
    },
    subscriptionTerminated: async () => false,
    createSession: async (a) => {
      calls.push('create:' + a.attempt_id);
      return { ...session };
    },
    ...changes,
  };
  return {
    deps,
    calls,
    session,
    row: () => row,
    run: (plan = 'weekly', price = 'price_week', promotion: string | null = null) => startCheckout(deps, 'user', plan, price, promotion),
  };
}
test('persists customer and session and reuses them on subsequent calls', async () => {
  const f = fixture();
  const first = await f.run();
  const second = await f.run();
  assert.deepEqual(first, second);
  assert.equal(f.calls.filter((x) => x.startsWith('city-map:customer:')).length, 1);
  assert.equal(f.calls.filter((x) => x.startsWith('create:')).length, 1);
});
test('busy lease makes no Stripe call', async () => {
  const f = fixture({}, { claim: async () => ({ busy: true }) });
  await assert.rejects(f.run(), /checkout_busy/);
  assert.deepEqual(f.calls, []);
});
test('lost create response retries with the same durable attempt key', async () => {
  const keys: string[] = [];
  const f = fixture();
  let fail = true;
  f.deps.createSession = async (a) => {
    keys.push(a.attempt_id);
    if (fail) {
      fail = false;
      throw new Error('lost response');
    }
    return f.session;
  };
  await assert.rejects(f.run());
  await f.run();
  assert.deepEqual(keys, ['attempt', 'attempt']);
  assert.equal(f.row().customer_id, 'cus_one');
});
test('lost customer persistence retries with the same customer idempotency key', async () => {
  const f = fixture();
  const save = f.deps.save;
  let fail = true;
  f.deps.save = async (a, p) => {
    if (p.customer && fail) {
      fail = false;
      throw new Error('DB failed');
    }
    return save(a, p);
  };
  await assert.rejects(f.run());
  await f.run();
  assert.equal(f.calls.filter((x) => x === 'city-map:customer:attempt').length, 2);
});
test('unknown attempt older than retention safety margin requires reconciliation instead of creating again', async () => {
  const f = fixture({ attempt_created_at: new Date(now - 22 * 3600_000).toISOString() });
  await assert.rejects(f.run(), /reconciliation/);
  assert.deepEqual(f.calls, ['claim', 'release']);
});
test('configuration cannot change during an uncertain creation', async () => {
  const f = fixture();
  await assert.rejects(f.run('realtor', 'price_agent'), /resume_original/);
  assert.deepEqual(f.calls, ['claim', 'release']);
});
test('switching plan expires the old session before replacing the attempt', async () => {
  const f = fixture({ session_id: 'cs_test_one', customer_id: 'cus_one' });
  await f.run('realtor', 'price_agent');
  assert.ok(f.calls.indexOf('expire') < f.calls.indexOf('create:new'));
  assert.equal(f.row().plan_key, 'realtor');
});
test('checkout completion racing expiration prevents a second session', async () => {
  const f = fixture({ session_id: 'cs_test_one', customer_id: 'cus_one' }, {
    expireSession: async () => {
      throw new Error('already completed');
    },
  });
  await assert.rejects(f.run('realtor', 'price_agent'));
  assert.equal(f.calls.some((x) => x.startsWith('create:')), false);
});
test('completed paid or awaiting-payment checkout is returned without creating another subscription', async () => {
  const f = fixture({ session_id: 'cs_test_one', customer_id: 'cus_one' });
  f.session.status = 'complete';
  f.session.subscription = 'sub_one';
  assert.equal((await f.run()).completed, true);
  assert.deepEqual(f.calls, ['claim', 'retrieve', 'release']);
});
test('terminated previous subscription allows a new attempt retaining customer mapping', async () => {
  const f = fixture({ session_id: 'cs_test_one', customer_id: 'cus_one' }, {
    subscriptionTerminated: async () => true,
  });
  f.session.status = 'complete';
  f.session.subscription = 'sub_old';
  f.deps.createSession = async () => ({
    ...f.session,
    id: 'cs_test_new',
    status: 'open',
    subscription: null,
  });
  await f.run();
  assert.equal(f.row().attempt_id, 'new');
  assert.equal(f.row().customer_id, 'cus_one');
});
test('existing subscription or failed lookup prevents Stripe creation', async () => {
  for (const message of ['already active', 'database down']) {
    const f = fixture({}, {
      ensureNoExistingSubscription: async () => {
        throw new Error(message);
      },
    });
    await assert.rejects(f.run());
    assert.equal(f.calls.some((x) => x.startsWith('create:')), false);
  }
});
test('session ownership and application must match; external checkout URLs are rejected', async () => {
  const f = fixture({ session_id: 'cs_test_one', customer_id: 'cus_one' });
  f.session.metadata!.user_id = 'other';
  await assert.rejects(f.run(), /owner/);
  assert.throws(
    () => assertSessionOwner({ ...f.session, metadata: { app: 'other', user_id: 'user' } }, 'user'),
    /owner/,
  );
  assert.throws(
    () =>
      assertSessionOwner(
        { ...f.session, metadata: { app: 'city-map', user_id: 'user' } },
        'user',
        'cus_other',
      ),
    /owner/,
  );
  const bad = fixture();
  bad.session.url = 'https://checkout.stripe.com.evil.example/pay';
  await assert.rejects(bad.run(), /Invalid checkout URL/);
});

test('changing or removing a promo expires an open session before rotating the attempt', async () => {
  for (const next of ['promo_new', null]) {
    const f = fixture({ promotion_id: 'promo_old', session_id: 'cs_test_one', customer_id: 'cus_one' });
    await f.run('weekly', 'price_week', next);
    assert.equal(f.row().promotion_id, next);
    assert.ok(f.calls.indexOf('expire') < f.calls.indexOf('create:new'));
  }
});
test('a lost discounted session response cannot silently change or remove the discount', async () => {
  const f = fixture({ promotion_id: 'promo_city', customer_id: 'cus_one' });
  const attempts: Attempt[] = [];
  f.deps.createSession = async a => { attempts.push({ ...a }); throw new Error('lost response'); };
  await assert.rejects(f.run('weekly', 'price_week', 'promo_city'), /lost response/);
  await assert.rejects(f.run(), /resume_original/);
  await assert.rejects(f.run('weekly', 'price_week', 'promo_other'), /resume_original/);
  await assert.rejects(f.run('weekly', 'price_week', 'promo_city'), /lost response/);
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].attempt_id, attempts[1].attempt_id);
  assert.equal(attempts[1].promotion_id, 'promo_city');
});
test('legacy open checkout with account-wide promotion entry is expired instead of reused', async () => {
  const f = fixture({ session_id: 'cs_test_one', customer_id: 'cus_one' });
  f.session.allow_promotion_codes = true;
  await f.run();
  assert.ok(f.calls.indexOf('expire') < f.calls.indexOf('create:new'));
});
