import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";
import { requireAction, requireCity } from '../../../shared/authorization.js';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const { cityId } = await req.json();
    if (!cityId) throw new Error("Missing cityId");

    const access = await verifyAdminUser(req);
    const { supabaseAdmin } = access;
    requireAction(access, 'map', 'manual', 'parser');
    requireCity(access, cityId);

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
    return new Response(JSON.stringify({ error: err.message }), { status: err.status === 403 ? 403 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
