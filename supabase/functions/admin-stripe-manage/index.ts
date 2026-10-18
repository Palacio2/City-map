import { manageGift, GiftError } from './gifts.ts';
import { readJsonObject, RequestError } from '../_shared/request.ts';
import Stripe from 'npm:stripe@22.6.0';
import { managePromo } from './promos.ts';
import { reconcilePromoOperations } from './reconcile.ts';
import { promoProducts, PromoError } from '../_shared/promotionScope.ts';
import { verifyAdminUser, corsHeaders } from '../_shared/auth.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2026-08-26.dahlia',
  httpClient: Stripe.createFetchHttpClient(),
  timeout: 20_000,
  maxNetworkRetries: 1,
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const access = await verifyAdminUser(req);
    const { user, supabaseAdmin, isSuperAdmin, hasTab } = access;

    const { action, payload: rawPayload } = await readJsonObject(req);
    if (typeof action !== 'string' || !action || !rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) throw new PromoError('Invalid request');
    const payload = rawPayload as Record<string, unknown>;
    if (action === 'revoke_subscription') throw new GiftError('Use revoke_gift for gifts; paid billing must be canceled through Stripe', 410);

    if (action === 'grant_subscription' || action === 'revoke_gift') {
      if (!hasTab('users.gift_sub')) {
        throw new GiftError('Forbidden: Required gift_sub permission', 403);
      }
    } else if (['create_promo', 'list_promos', 'delete_promo'].includes(action)) {
      if (!hasTab('users.promo_codes')) {
        throw new PromoError('Forbidden: Required promo_codes permission', 403);
      }
    } else if (!isSuperAdmin) {
      throw new Error('Forbidden: Super Admins only');
    }

    let result = {};

    if (action === 'grant_subscription' || action === 'revoke_gift') {
      result = await manageGift(action, payload, access);
    }
    else if (['create_promo', 'list_promos', 'delete_promo'].includes(action)) {
      const products = promoProducts(Deno.env.get('STRIPE_CITY_MAP_PRODUCT_IDS'));
      const complete = async (key: string, result: Record<string, unknown>) => {
        const {error} = await supabaseAdmin.rpc('complete_promo_operation', {p_actor:user.id,p_key:key,p_result:result});
        if(error) throw new PromoError('Promotion changed, but audit confirmation is pending; retry the same request',503);
      };
      result = await managePromo(stripe, action, payload,
        products, {
          begin: async (key, operation, payload) => {
            const {data,error} = await supabaseAdmin.rpc('prepare_promo_operation', {
              p_actor:user.id,p_key:key,p_action:operation,p_payload:payload,
            });
            if(error) throw new PromoError(error.code === 'CM409' ? 'Promotion request conflict or reconciliation required' : 'Unable to record promotion request', error.code === 'CM409' ? 409 : 503);
            return data;
          },
          complete,
        });
      if (action === 'list_promos') {
        try {
          const {data: pending,error} = await supabaseAdmin.rpc('pending_promo_operations',{p_actor:user.id});
          if (!error && Array.isArray(pending)) await reconcilePromoOperations(stripe,products,pending,complete);
        } catch { /* Deferred reconciliation must not hide the promotion list. */ }
      }
    }
    else {
      throw new PromoError('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    });

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof GiftError || error instanceof PromoError || error instanceof RequestError
      ? error.message : 'Promotion service unavailable' }), {
      status: error instanceof GiftError || error instanceof PromoError || error instanceof RequestError ? error.status : 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    });
  }
});
