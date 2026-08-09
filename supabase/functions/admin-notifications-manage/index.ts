import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sentry-trace, baggage",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const { action, payload } = await req.json();

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { data: profile } = await supabaseAdmin.from("admin_profiles").select("role").eq("user_id", user.id).maybeSingle();
    const role = profile?.role || user.app_metadata?.role || "user";
    if (role !== "super_admin" && role !== "admin") throw new Error("Forbidden");

    let result = {};

    if (action === 'get_all') {
      const { data, error } = await supabaseAdmin.from('global_notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      result = { notifications: data };
    } 
    else if (action === 'create') {
      if (payload.is_active) {
        
        await supabaseAdmin.from('global_notifications').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { error } = await supabaseAdmin.from('global_notifications').insert({ ...payload, created_by: user.id });
      if (error) throw error;
      result = { success: true };
    } 
    else if (action === 'update_status') {
      if (payload.is_active) {
        
        await supabaseAdmin.from('global_notifications').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { error } = await supabaseAdmin.from('global_notifications').update({ is_active: payload.is_active }).eq('id', payload.id);
      if (error) throw error;
      result = { success: true };
    } 
    else if (action === 'delete') {
      const { error } = await supabaseAdmin.from('global_notifications').delete().eq('id', payload.id);
      if (error) throw error;
      result = { success: true };
    } 
    else {
      throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});