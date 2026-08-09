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

    const { cityId } = await req.json();
    if (!cityId) throw new Error("Missing cityId");

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    const { data: profile } = await supabaseAdmin.from("admin_profiles").select("role, assigned_cities").eq("user_id", user.id).maybeSingle();
    const role = profile?.role || user.app_metadata?.role || "user";
    
    if (role !== "super_admin" && role !== "admin") throw new Error("Forbidden");
    if (role === "admin" && profile?.assigned_cities && !profile.assigned_cities.includes(cityId)) {
        throw new Error("Немає доступу до цього міста");
    }

    const { data, error } = await supabaseAdmin
      .from('districts')
      .select(`id, name, is_available, district_geo_data (geojson, poi_data)`)
      .eq('city_id', cityId);

    if (error) throw error;

    const mapData = data.map((d: any) => {
        
        const geoData = Array.isArray(d.district_geo_data) ? d.district_geo_data[0] : d.district_geo_data;
        return {
            id: d.id,
            name: d.name,
            is_available: d.is_available,
            geojson: geoData?.geojson || null,
            poi_data: geoData?.poi_data || null
        };
    });

    return new Response(JSON.stringify({ data: mapData }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});