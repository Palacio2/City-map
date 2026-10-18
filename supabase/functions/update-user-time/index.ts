import { publishableKey } from '../_shared/keys.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.112.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      publishableKey(),
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { seconds } = await req.json();

    if (!seconds || typeof seconds !== 'number' || seconds <= 0 || seconds > 600) {
      return new Response(JSON.stringify({ skipped: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { error } = await supabase.rpc('increment_user_time', { seconds_add: seconds });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
