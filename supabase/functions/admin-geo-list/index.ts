import { requireAction, requireCity } from '../../../shared/authorization.js';
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const access = await verifyAdminUser(req);
    const { supabaseAdmin, isSuperAdmin, allowedTabs, assignedCities } = access;

    requireAction(access, 'manual', 'parser', 'map');
    const { action, countryId, cityId } = await req.json();
    let resultData = [];

    if (action === "get_countries") {
      let query = supabaseAdmin.from("countries").select("*").order("name");
      
      if (!isSuperAdmin && !allowedTabs.includes("manual.create.country")) {
        if (assignedCities.length > 0) {
          const { data: allowedCities, error: citiesError } = await supabaseAdmin.from("cities").select("country_id").in("id", assignedCities);
          if (citiesError) throw citiesError;
          const allowedCountryIds = [...new Set(allowedCities?.map((c: any) => c.country_id) || [])];
          
          if (allowedCountryIds.length === 0) return new Response(JSON.stringify({ data: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          query = query.in("id", allowedCountryIds);
        } else {
          return new Response(JSON.stringify({ data: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
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
      requireCity(access, cityId);
      
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
      status: error?.status === 403 ? 403 : 400,
    });
  }
});