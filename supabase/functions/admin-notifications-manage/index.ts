import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
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

      const { error } = await supabaseAdmin.rpc('save_global_notification', {
        p_actor: user.id, p_action: action, p_payload: { ...payload, is_active: payload.is_active === true },
      });
      if (error) throw error;
      result = { success: true };
    } 
    else if (action === 'update_status') {
      if (!isSuperAdmin && !allowedTabs.includes("notifications.send")) throw new Error("Forbidden: missing notifications.send permission");
      const { error } = await supabaseAdmin.rpc('save_global_notification', {
        p_actor: user.id, p_action: action, p_payload: payload,
      });
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
    return new Response(JSON.stringify({ error: err.message }), { status: String(err.message).startsWith('Forbidden:') ? 403 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
