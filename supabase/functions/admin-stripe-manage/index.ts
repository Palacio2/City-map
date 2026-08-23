import Stripe from 'npm:stripe@^14.21.0';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { verifyAdminUser, corsHeaders } from '../_shared/auth.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user, supabaseAdmin, isSuperAdmin, hasTab } = await verifyAdminUser(req);

    const { action, payload } = await req.json();
    if (!action) throw new Error('Missing action');

    if (action === 'grant_subscription' || action === 'revoke_subscription') {
      if (!hasTab('users.gift_sub')) {
        throw new Error('Forbidden: Required gift_sub permission');
      }
    } else if (['create_promo', 'list_promos', 'delete_promo'].includes(action)) {
      if (!hasTab('users.promo_codes')) {
        throw new Error('Forbidden: Required promo_codes permission');
      }
    } else if (!isSuperAdmin) {
      throw new Error('Forbidden: Super Admins only');
    }

    let result = {};

    if (action === 'grant_subscription') {
      const targetUserId = payload.targetUserId || payload.userId || payload.user_id;
      const planName = payload.planName || payload.plan_name;
      const days = payload.days;

      if (!targetUserId) throw new Error('Missing target user ID');

      const { data: targetProfile } = await supabaseAdmin.from("admin_profiles").select("role").eq("user_id", targetUserId).maybeSingle();
      const targetRole = targetProfile?.role || "user";

      if ((targetRole === "admin" || targetRole === "super_admin") && !isSuperAdmin) {
        throw new Error("Тільки Super Admin може керувати підписками інших адміністраторів");
      }
      
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
    else if (action === 'revoke_subscription') {
      const targetUserId = payload.targetUserId || payload.userId || payload.user_id;
      if (!targetUserId) throw new Error('Missing target user ID');

      const { data: targetProfile } = await supabaseAdmin.from("admin_profiles").select("role").eq("user_id", targetUserId).maybeSingle();
      const targetRole = targetProfile?.role || "user";

      if ((targetRole === "admin" || targetRole === "super_admin") && !isSuperAdmin) {
        throw new Error("Тільки Super Admin може керувати підписками інших адміністраторів");
      }

      await supabaseAdmin
        .from('user_subscriptions')
        .update({ status: 'canceled', cancelled_at: new Date().toISOString() })
        .eq('user_id', targetUserId)
        .eq('status', 'active');

      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { plan: 'free' }
      });

      await supabaseAdmin.from('audit_logs').insert({
        admin_id: user.id,
        action: 'REVOKE_SUBSCRIPTION',
        target_table: 'user_subscriptions',
        record_id: targetUserId,
        new_data: { plan: 'free' }
      });

      result = { success: true, message: `Revoked subscription for user` };
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