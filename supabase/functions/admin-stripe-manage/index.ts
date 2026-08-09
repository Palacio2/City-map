import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'npm:stripe@^14.21.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sentry-trace, baggage',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile } = await supabaseAdmin
      .from('admin_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isSuperAdmin = profile?.role === 'super_admin' || user.app_metadata?.role === 'super_admin';
    if (!isSuperAdmin) throw new Error('Forbidden: Super Admins only');

    const { action, payload } = await req.json();
    if (!action) throw new Error('Missing action');

    let result = {};

    if (action === 'grant_subscription') {
      const targetUserId = payload.targetUserId || payload.userId || payload.user_id;
      const planName = payload.planName || payload.plan_name;
      const days = payload.days;

      if (!targetUserId) throw new Error('Missing target user ID');
      
      await supabaseAdmin
        .from('user_subscriptions')
        .update({ status: 'canceled', cancelled_at: new Date().toISOString() })
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .like('payment_id', 'GIFT_%');

      const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const mockPaymentId = `GIFT_MANUAL_${targetUserId}`;

      const { error } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert({
          user_id: targetUserId,
          payment_id: mockPaymentId,
          plan_name: planName,
          status: 'active',
          starts_at: new Date().toISOString(),
          ends_at: endsAt,
          amount: 0,
          cancelled_at: null
        }, { onConflict: 'payment_id' });

      if (error) throw error;
      
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { plan: planName }
      });
      
      await supabaseAdmin.from('audit_logs').insert({
        admin_id: user.id,
        action: 'GRANT_SUBSCRIPTION',
        target_table: 'user_subscriptions',
        record_id: targetUserId,
        new_data: { plan: planName, days: days }
      });

      result = { success: true, message: `Granted ${planName} for ${days} days` };
    }
    else if (action === 'create_promo') {
      const { code, percentOff, duration, maxRedemptions } = payload;
      
      const coupon = await stripe.coupons.create({
        percent_off: percentOff,
        duration: duration,
        duration_in_months: duration === 'repeating' ? 1 : undefined,
      });

      const promoCode = await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: code,
        max_redemptions: maxRedemptions || undefined,
      });

      await supabaseAdmin.from('audit_logs').insert({
        admin_id: user.id,
        action: 'CREATE_PROMO_CODE',
        target_table: 'stripe',
        new_data: { code: promoCode.code, percent_off: percentOff }
      });

      result = { success: true, promoCode: promoCode };
    }
    else if (action === 'list_promos') {
      const codes = await stripe.promotionCodes.list({ limit: 50, active: true });
      result = { success: true, codes: codes.data };
    }
    else if (action === 'delete_promo') {
      const { id } = payload;
      await stripe.promotionCodes.update(id, { active: false });
      result = { success: true };
    }
    else {
      throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});