import Stripe from 'npm:stripe@22.6.0';

// Synthetic credentials only; no Stripe API calls or real billing objects.
const stripe = new Stripe('sk_test_fixture_only');
const provider = Stripe.createSubtleCryptoProvider();
const secret = 'whsec_test_fixture_only';
const payload = JSON.stringify({ id: 'evt_fixture', type: 'customer.subscription.updated' });

Deno.test('Stripe SDK validates the raw body with the Deno crypto provider', async () => {
  const signature = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret, cryptoProvider: provider });
  const event = await stripe.webhooks.constructEventAsync(payload, signature, secret, undefined, provider);
  if (event.id !== 'evt_fixture') throw new Error('Unexpected event');
});

for (const scenario of ['tampered', 'expired', 'wrong-secret']) {
  Deno.test('Stripe signature rejects ' + scenario, async () => {
    const signature = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret, cryptoProvider: provider,
      timestamp: Math.floor(Date.now() / 1000) - (scenario === 'expired' ? 600 : 0) });
    try {
      await stripe.webhooks.constructEventAsync(scenario === 'tampered' ? payload + ' ' : payload, signature,
        scenario === 'wrong-secret' ? 'whsec_other_fixture' : secret, undefined, provider);
    } catch { return; }
    throw new Error('Invalid signature accepted');
  });
}
