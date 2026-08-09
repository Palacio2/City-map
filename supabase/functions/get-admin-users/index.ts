import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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
    
    if (user.app_metadata?.role !== 'admin' && user.app_metadata?.role !== 'super_admin') {
        throw new Error('Forbidden: Admins only');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });
    if (authErr) throw authErr;

    const { data: statsData } = await supabaseAdmin
      .from('user_stats')
      .select('user_id, total_time_seconds, last_active, is_terms_accepted');

    const { data: subsData } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id, plan_name, status')
      .in('status', ['active', 'trialing']);

    const { data: activityData } = await supabaseAdmin
      .from('user_activity_logs')
      .select('user_id, searches_count');
      
    const { data: profilesData } = await supabaseAdmin
      .from('admin_profiles')
      .select('user_id, role, assigned_cities');

    const userSearches: Record<string, number> = {};
    if (activityData) {
      activityData.forEach(log => {
        if (!userSearches[log.user_id]) userSearches[log.user_id] = 0;
        userSearches[log.user_id] += (log.searches_count || 0);
      });
    }

    const mergedUsers = authData.users.map((u) => {
      const stats = statsData?.find(s => s.user_id === u.id);
      const sub = subsData?.find(s => s.user_id === u.id);
      const profile = profilesData?.find(p => p.user_id === u.id);
      const totalSearches = userSearches[u.id] || 0;

      let currentRole = profile?.role || u.app_metadata?.role || 'user';
      if (currentRole === 'admin' && !profile) {
          currentRole = 'user';
      }

      return {
        id: u.id,
        email: u.email,
        role: currentRole, 
        assigned_cities: profile?.assigned_cities || [],
        plan: sub?.plan_name || 'basic',
        rodo_accepted: u.user_metadata?.rodo_accepted || stats?.is_terms_accepted || false,
        last_active: stats?.last_active || u.last_sign_in_at,
        created_at: u.created_at,
        searches_count: totalSearches
      };
    });

    mergedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return new Response(JSON.stringify({ users: mergedUsers }), {
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