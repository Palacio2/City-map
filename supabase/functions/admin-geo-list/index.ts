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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseAdmin.from("admin_profiles").select("role, assigned_cities").eq("user_id", user.id).maybeSingle();
    const role = profile?.role || user.app_metadata?.role || "user";
    if (role !== "super_admin" && role !== "admin") throw new Error("Forbidden");

    const assignedCities = profile?.assigned_cities || [];
    const isSuperAdmin = role === "super_admin";

    const { action, countryId, cityId } = await req.json();
    let resultData = [];

    if (action === "get_countries") {
      let query = supabaseAdmin.from("countries").select("*").order("name");
      
      if (!isSuperAdmin && assignedCities.length > 0) {
        
        const { data: allowedCities } = await supabaseAdmin.from("cities").select("country_id").in("id", assignedCities);
        const allowedCountryIds = [...new Set(allowedCities?.map((c: any) => c.country_id) || [])];
        
        if (allowedCountryIds.length === 0) return new Response(JSON.stringify({ data: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        query = query.in("id", allowedCountryIds);
      } else if (!isSuperAdmin && assignedCities.length === 0) {
        return new Response(JSON.stringify({ data: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      const { data, error } = await query;
      if (error) throw error;
      resultData = data;
      
    } else if (action === "get_cities") {
      if (!countryId) throw new Error("Missing countryId");
      let query = supabaseAdmin.from("cities").select("*").eq("country_id", countryId).order("name");
      
      if (!isSuperAdmin) {
        if (assignedCities.length === 0) return new Response(JSON.stringify({ data: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        query = query.in("id", assignedCities);
      }

      const { data, error } = await query;
      if (error) throw error;
      resultData = data;
      
    } else if (action === "get_districts") {
      if (!cityId) throw new Error("Missing cityId");
      if (!isSuperAdmin && !assignedCities.includes(cityId)) throw new Error("Немає доступу до цього міста");
      
      const { data, error } = await supabaseAdmin.from("districts").select("*").eq("city_id", cityId).order("name");
      if (error) throw error;
      resultData = data;
      
    } else {
      throw new Error("Invalid action");
    }

    return new Response(JSON.stringify({ data: resultData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});