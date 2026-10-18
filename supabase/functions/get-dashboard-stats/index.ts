import { publishableKey } from '../_shared/keys.ts';
import { createClient } from "npm:@supabase/supabase-js@2.112.2"
import { RequestError } from '../_shared/request.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Cache-Control': 'private, no-store',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST') return new Response(null, { status: 405, headers: { ...corsHeaders, Allow: 'GET, POST, OPTIONS' } });

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) throw new RequestError('Unauthorized', 401);
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      publishableKey(),
      { global: { headers: { Authorization: authorization } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new RequestError('Unauthorized', 401);

    const [statsResult, weeklyResult, popularResult] = await Promise.all([
      supabaseClient.from('user_stats').select('*').eq('user_id', user.id).maybeSingle(),
      supabaseClient.rpc('get_weekly_activity_stats', { uid: user.id }),
      supabaseClient.rpc('get_popular_districts_stats')
    ]);

    if (statsResult.error || weeklyResult.error || popularResult.error) throw new RequestError('Statistics unavailable', 503);
    const dbStats = statsResult.data || {};
    
    return new Response(JSON.stringify({
      stats: {
        searches: dbStats.viewed_districts_count || 0,
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
    return new Response(JSON.stringify({ error: error instanceof RequestError ? error.message : 'Statistics unavailable' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error instanceof RequestError ? error.status : 503,
    });
  }
});
