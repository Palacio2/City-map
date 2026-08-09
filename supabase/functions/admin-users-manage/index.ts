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
    
    const { action, targetUserId, payload = {} } = await req.json();
    if (!action || !targetUserId) throw new Error("Missing required fields");

    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "", 
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "", 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    const { data: profile } = await supabaseAdmin.from("admin_profiles").select("role").eq("user_id", user.id).maybeSingle();
    const role = profile?.role || user.app_metadata?.role || "user";
    
    if (role !== "super_admin" && role !== "admin") {
      throw new Error("Доступ заборонено. Тільки для адміністраторів.");
    }

    if (action === "update_role") {
      if (role !== "super_admin") throw new Error("Тільки Super Admin може змінювати ролі");
      
      await supabaseAdmin.from("admin_profiles").upsert({ user_id: targetUserId, role: payload.role }, { onConflict: "user_id" });
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, { app_metadata: { role: payload.role } });
    } 
    else if (action === "update_cities") {
      if (role !== "super_admin") throw new Error("Тільки Super Admin може призначати міста");
      
      await supabaseAdmin.from("admin_profiles").upsert({ user_id: targetUserId, assigned_cities: payload.cities }, { onConflict: "user_id" });
    }
    else if (action === "delete_user") {
      if (role !== "super_admin") throw new Error("Тільки Super Admin може видаляти користувачів");
      
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (error) throw error;
    }
    else if (action === "terminate_sessions") {
      const { error } = await supabaseAdmin.rpc('force_logout_user', { target_user_id: targetUserId });
      if (error) throw new Error(`Помилка SQL RPC: ${error.message}`);
    }
    else {
      throw new Error("Invalid action");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Server Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, 
    });
  }
});