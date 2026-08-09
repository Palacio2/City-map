import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sentry-trace, baggage",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, anonKey);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile } = await supabaseAdmin.from("admin_profiles").select("role").eq("user_id", user.id).maybeSingle();

    const role = profile?.role || user.app_metadata?.role || "user";
    if (role !== "admin" && role !== "super_admin") throw new Error("Forbidden");

    const { data: cities, error: citiesErr } = await supabaseAdmin
      .from("cities")
      .select("id, name, country_id, countries(name)");

    if (citiesErr) throw citiesErr;

    const formattedCities = cities?.map((c: any) => ({
      id: c.id,
      name: c.name,
      country_id: c.country_id,
      countryName: c.countries?.name || "Unknown"
    })) || [];

    return new Response(JSON.stringify({ cities: formattedCities }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || "Server Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});