import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    if (user.app_metadata?.role !== 'admin' && user.app_metadata?.role !== 'super_admin') {
        throw new Error('Forbidden: Admins only');
    }

    const { targetUserId, action, value } = await req.json();
    if (!targetUserId || !action) throw new Error('Missing parameters');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let targetTable = '';

    if (action === 'update_role') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        app_metadata: { role: value }
      });
      if (error) throw error;
      
      if (value === 'user') {
          await supabaseAdmin.from('admin_profiles').delete().eq('user_id', targetUserId);
      } else {
          await supabaseAdmin.from('admin_profiles').upsert({ 
            user_id: targetUserId, 
            role: value,
            updated_at: new Date().toISOString()
          });
      }
      targetTable = 'auth.users / admin_profiles';

    } else if (action === 'update_cities') {
      const { error } = await supabaseAdmin.from('admin_profiles').upsert({ 
        user_id: targetUserId, 
        assigned_cities: value,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      targetTable = 'admin_profiles';

    } else if (action === 'update_tabs') {
      const { error } = await supabaseAdmin.from('admin_profiles').upsert({ 
        user_id: targetUserId, 
        allowed_tabs: value,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      targetTable = 'admin_profiles';

    } else if (action === 'update_rodo') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { rodo_accepted: value }
      });
      if (error) throw error;
      
      await supabaseAdmin.from('user_stats').update({ is_terms_accepted: value }).eq('user_id', targetUserId);
      targetTable = 'auth.users / user_stats';
      
    } else if (action === 'delete_user') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (error) throw error;

      await supabaseAdmin.from('admin_profiles').delete().eq('user_id', targetUserId);
      targetTable = 'auth.users';

    } else if (action === 'terminate_sessions') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { session_revoked_at: new Date().toISOString() }
      });
      if (error) throw error;
      targetTable = 'auth.users';
      
    } else {
      throw new Error('Invalid action');
    }

    await supabaseAdmin.from('audit_logs').insert({
      admin_id: user.id,
      action: action.toUpperCase(),
      target_table: targetTable,
      record_id: targetUserId,
      new_data: { value: value || null }
    });

    return new Response(JSON.stringify({ success: true }), {
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