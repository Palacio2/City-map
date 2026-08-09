import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^14.21.0';

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_CITY_MAP');
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const stripe = new Stripe(stripeKey!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const safeDate = (timestamp: any): string | null => {
    if (!timestamp || typeof timestamp !== 'number') return null;
    try {
        return new Date(timestamp * 1000).toISOString();
    } catch (e) {
        console.error(`Date conversion error for timestamp ${timestamp}:`, e);
        return null;
    }
};

async function upsertSubscription(subscription: any) {
    const userId = subscription.metadata?.user_id;
    const planKey = subscription.metadata?.plan_key;

    console.log(`[DB] Processing subscription ${subscription.id} for User: ${userId}. Status: ${subscription.status}`);

    if (!userId) {
        console.error("[DB Error] No user_id found in metadata");
        return;
    }

    const startsAt = safeDate(subscription.current_period_start);
    const endsAt = safeDate(subscription.current_period_end);
    const cancelAt = safeDate(subscription.cancel_at);
    const canceledAt = safeDate(subscription.canceled_at);
    const finalEndsAt = endsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert({
            user_id: userId,
            payment_id: `SUB_${subscription.id}`,
            plan_name: planKey || 'realtor',
            status: subscription.status, 
            starts_at: startsAt || new Date().toISOString(),
            ends_at: finalEndsAt,
            cancel_at: cancelAt,
            cancelled_at: canceledAt
        }, { onConflict: 'payment_id' }); 

    if (error) {
        console.error("[DB Error] Failed to upsert:", error);
    } else {
        console.log("[DB Success] Subscription updated.");
    }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
        console.error("❌ Missing stripe-signature header");
        return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret!);
    } catch (err: any) {
      console.error(`❌ Signature Verification Failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`✅ Event received: ${event.type}`);

    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated' || 
        event.type === 'customer.subscription.deleted') {
        
        await upsertSubscription(event.data.object);
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      console.log(`💰 Invoice payment succeeded: ${invoice.id}`);
      
      if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata?.user_id;
          
          if (userId) {
             const endsAt = safeDate(subscription.current_period_end);

             const { error } = await supabaseAdmin
              .from('user_subscriptions')
              .upsert({
                user_id: userId,
                payment_id: `SUB_${subscription.id}`,
                status: 'active',
                amount: invoice.amount_paid / 100,
                ends_at: endsAt
              }, { onConflict: 'payment_id' }); 
             
             if (error) console.error("[DB Error] Invoice update failed:", error);
             else console.log("[DB Success] Invoice processed, subscription active.");
          }
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      headers: { 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (err: any) {
    console.error(`❌ Global Error: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});