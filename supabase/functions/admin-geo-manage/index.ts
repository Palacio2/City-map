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

    const token = authHeader.replace("Bearer ", "");

    const supabaseAuthClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "", 
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: { user }, error: userError } = await supabaseAuthClient.auth.getUser(token);
    
    if (userError || !user) throw new Error("Unauthorized");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profile } = await supabaseAdmin.from("admin_profiles").select("role").eq("user_id", user.id).maybeSingle();
    if (!profile || (profile.role !== "super_admin" && profile.role !== "admin")) {
        throw new Error("Access denied");
    }

    const { action, payload } = await req.json();

    if (action === "create_districts") {
      const { cityId, names } = payload;
      const inserts = names.map((name: string) => ({ name, city_id: cityId }));
      const { error } = await supabaseAdmin.from("districts").upsert(inserts, { onConflict: "name, city_id" });
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } 
    
    if (action === "delete_district") {
      const { districtId } = payload;
      const { error } = await supabaseAdmin.from("districts").delete().eq("id", districtId);
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "import_geojson") {
      const { cityId, features } = payload;

      const { data: currentDistricts } = await supabaseAdmin
        .from("districts")
        .select("id, name")
        .eq("city_id", cityId);
      
      let successCount = 0;
      const geoInserts: any[] = [];

      for (const feature of features) {
        if (!feature.name) continue;

        const dbDistrict = currentDistricts?.find(d => 
          d.name.toLowerCase() === String(feature.name).trim().toLowerCase()
        );

        if (dbDistrict) {
          geoInserts.push({ district_id: dbDistrict.id, geojson: feature.geojson });
          successCount++;
        }
      }

      if (geoInserts.length > 0) {
        await supabaseAdmin.from("district_geo_data").upsert(geoInserts, { onConflict: "district_id" });
      }

      return new Response(JSON.stringify({ success: true, count: successCount }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});