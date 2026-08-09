import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    
    console.log(`[Request] Method: ${req.method}`);

    const bodyText = await req.text();
    console.log(`[Request Body] ${bodyText}`);
    
    let body;
    try {
        body = JSON.parse(bodyText);
    } catch (e) {
        throw new Error("Invalid JSON body");
    }

    const { action, subscriptionId, planKey, promoCode } = body;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
        console.error("[Auth Error]", authError);
        throw new Error('Unauthorized');
    }
    console.log(`[Auth] User verified: ${user.id}`);

    // ==========================================
    
    // ==========================================
    if (action === 'cancel') {
        console.log(`[Cancel] Starting cancellation for subId: ${subscriptionId}`);

        if (!subscriptionId) throw new Error("Subscription ID is required for cancellation");

        const { data: subData, error: subError } = await supabaseAdmin
            .from('user_subscriptions')
            .select('payment_id')
            .eq('id', subscriptionId) 
            .eq('user_id', user.id)   
            .single();

        if (subError || !subData) {
            console.error("[Cancel Error] Subscription not found in DB:", subError);
            throw new Error("Subscription not found");
        }

        const stripeSubId = subData.payment_id.replace('SUB_', '');
        console.log(`[Cancel] Stripe ID found: ${stripeSubId}`);

        const updatedSub = await stripe.subscriptions.update(stripeSubId, { 
            cancel_at_period_end: true 
        });
        console.log(`[Cancel] Stripe updated. Cancel At: ${updatedSub.cancel_at}`);

        if (updatedSub.cancel_at) {
            await supabaseAdmin
                .from('user_subscriptions')
                .update({ 
                    cancel_at: new Date(updatedSub.cancel_at * 1000).toISOString()
                })
                .eq('id', subscriptionId);
        }

        return new Response(JSON.stringify({ success: true }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 
        });
    }

    // ==========================================
    
    // ==========================================
    console.log(`[Create] Starting creation for plan: ${planKey}`);

    const { data: activeSub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .maybeSingle();

    if (activeSub) {
        console.log("[Create] Active subscription already exists");
        throw new Error("У вас вже є активна підписка.");
    }

    const priceId = Deno.env.get(`STRIPE_PRICE_${planKey.toUpperCase()}`);
    if (!priceId) throw new Error(`Price not found for plan: ${planKey}`);

    let customerId;
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = newCustomer.id;
    }

    let promotionCodeId;
    if (promoCode) {
      console.log(`[Create] Checking promo code: ${promoCode}`);
      const codes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
      if (codes.data.length === 0) throw new Error("Невірний промокод");
      promotionCodeId = codes.data[0]?.id;
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent'], 
      metadata: { 
        user_id: user.id, 
        plan_key: planKey 
      },
      promotion_code: promotionCodeId,
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const amountDue = invoice.amount_due;
    
    console.log(`[Create] Sub created. Amount Due: ${amountDue}`);

    let clientSecret = "";
    let mode = "payment";

    if (amountDue === 0) {
        
        const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent;
        if (!setupIntent) throw new Error("Failed to initialize setup intent for free plan");
        
        clientSecret = setupIntent.client_secret!;
        mode = "setup"; 
    } else {
        
        const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
        if (!paymentIntent) throw new Error("Failed to initialize payment intent");
        
        clientSecret = paymentIntent.client_secret!;
        mode = "payment";
    }

    return new Response(
      JSON.stringify({ 
          clientSecret: clientSecret,
          subscriptionId: subscription.id,
          amount: amountDue / 100,
          mode: mode 
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error(`[Global Error] ${error.message}`);
    
    return new Response(JSON.stringify({ error: error.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 
    });
  }
});