import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, payload } = await req.json();

    const { user, supabaseAdmin, isSuperAdmin, allowedTabs } = await verifyAdminUser(req);

    let result = {};

    if (action === 'get_all') {
      if (!isSuperAdmin && !allowedTabs.includes("notifications")) throw new Error("Forbidden: missing notifications permission");
      const { data, error } = await supabaseAdmin.from('global_notifications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      result = { notifications: data };
    } 
    else if (action === 'create') {
      if (!isSuperAdmin && !allowedTabs.includes("notifications.send")) throw new Error("Forbidden: missing notifications.send permission");
      
      if (!payload.message || typeof payload.message !== 'string' || payload.message.length > 500) {
        throw new Error("Validation Error: message must be 1-500 characters");
      }

      // Basic rate limiting: prevent creating more than 1 notification per minute per admin
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const { data: recentNotifications } = await supabaseAdmin
        .from('global_notifications')
        .select('id')
        .eq('created_by', user.id)
        .gte('created_at', oneMinuteAgo);
      
      if (recentNotifications && recentNotifications.length > 0) {
        throw new Error("Rate limit exceeded: please wait a minute before sending another notification");
      }

      if (payload.is_active) {
        await supabaseAdmin.from('global_notifications').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { error } = await supabaseAdmin.from('global_notifications').insert({ ...payload, created_by: user.id });
      if (error) throw error;
      result = { success: true };
    } 
    else if (action === 'update_status') {
      if (!isSuperAdmin && !allowedTabs.includes("notifications.send")) throw new Error("Forbidden: missing notifications.send permission");
      if (payload.is_active) {
        
        await supabaseAdmin.from('global_notifications').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { error } = await supabaseAdmin.from('global_notifications').update({ is_active: payload.is_active }).eq('id', payload.id);
      if (error) throw error;
      result = { success: true };
    } 
    else if (action === 'delete') {
      if (!isSuperAdmin && !allowedTabs.includes("notifications.send")) throw new Error("Forbidden: missing notifications.send permission");
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