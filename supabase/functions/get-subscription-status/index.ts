import { publishableKey } from '../_shared/keys.ts';
import { subscriptionState } from '../_shared/subscriptionState.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.112.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'private, no-store'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
      });
    }
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      publishableKey(),
      {
        global: {
          headers: {
            Authorization: authorization
          }
        }
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
      });
    }

    const { data: subscriptions, error } = await supabaseClient
      .from('user_subscriptions')
      .select('id, plan_name, starts_at, ends_at, status, payment_id, cancel_at')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete'])
      .limit(501);

    if (error) throw error;

    if (!subscriptions || subscriptions.length > 500) throw new Error('Subscription reconciliation required');
    return new Response(JSON.stringify(subscriptionState(subscriptions)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
