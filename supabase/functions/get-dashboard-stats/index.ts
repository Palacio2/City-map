import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const [statsResult, weeklyResult, popularResult] = await Promise.all([
      supabaseClient.from('user_stats').select('*').eq('user_id', user.id).single(),
      supabaseClient.rpc('get_weekly_activity_stats', { uid: user.id }),
      supabaseClient.rpc('get_popular_districts_stats')
    ]);

    const dbStats = statsResult.data || {};
    
    return new Response(JSON.stringify({
      stats: {
        searches: dbStats.search_count || 0,
        viewed_districts_count: dbStats.viewed_districts_count || 0,
        savedDistricts: dbStats.saved_districts_count || 0,
        comparisons: dbStats.comparison_count || 0,
        total_time_seconds: dbStats.total_time_seconds || 0,
        favoriteDistrict: dbStats.favorite_district || null,
        lastActive: dbStats.last_active || null
      },
      weeklyActivity: weeklyResult.data || [],
      popularDistricts: popularResult.data || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});