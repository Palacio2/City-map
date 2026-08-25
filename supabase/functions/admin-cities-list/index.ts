import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { supabaseAdmin, isSuperAdmin, user, hasTab } = await verifyAdminUser(req);

    let reqBody = {};
    try {
        const reqText = await req.text();
        if (reqText) reqBody = JSON.parse(reqText);
    } catch (e) {
        // ignore JSON parse errors
    }
    const mapMode = (reqBody as any)?.mapMode === true;

    const { data: profile } = await supabaseAdmin.from("admin_profiles").select("assigned_cities").eq("user_id", user.id).maybeSingle();
    const assignedCities = profile?.assigned_cities || [];
    const canAssignCities = hasTab("users.assign_cities");

    let query = supabaseAdmin.from("cities").select("id, name, country_id, countries(name)");

    if (!isSuperAdmin) {
        if (mapMode || !canAssignCities) {
            if (assignedCities.length === 0) {
                return new Response(JSON.stringify({ cities: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
            }
            query = query.in("id", assignedCities);
        }
    }

    const { data: cities, error: citiesErr } = await query;

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