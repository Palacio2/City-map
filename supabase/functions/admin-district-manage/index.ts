import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, districtId, payload } = await req.json();
    if (!action || !districtId) throw new Error("Missing required fields");

    const { supabaseAdmin, isSuperAdmin, user, hasTab, role, allowedTabs } = await verifyAdminUser(req);

    const { data: districtCheck, error: districtCheckErr } = await supabaseAdmin.from('districts').select('city_id').eq('id', districtId).maybeSingle();
    
    if (districtCheckErr) throw districtCheckErr;
    if (!districtCheck && action !== "save") throw new Error("Район не знайдено");

    if (!isSuperAdmin && districtCheck) {
        const { data: profile } = await supabaseAdmin.from("admin_profiles").select("assigned_cities").eq("user_id", user.id).maybeSingle();
        if (!profile?.assigned_cities?.includes(districtCheck.city_id)) {
           throw new Error("Немає доступу до міста цього району");
        }
    }

    if (action === "get") {
      const { data: dist, error: distErr } = await supabaseAdmin.from('districts').select('*').eq('id', districtId).maybeSingle();
      const { data: filterData } = await supabaseAdmin.from('district_filter_data').select('*').eq('district_id', districtId).maybeSingle();
      const { data: geoData } = await supabaseAdmin.from('district_geo_data').select('*').eq('district_id', districtId).maybeSingle();
      const { data: photoData } = await supabaseAdmin.from('district_photos').select('*').eq('district_id', districtId).eq('is_main', true).maybeSingle();

      if (distErr) throw distErr;
      if (!dist) throw new Error("Район не знайдено");

      let parsedGeojson = geoData?.geojson;
      let parsedPoi = geoData?.poi_data;
      if (typeof parsedGeojson === 'string') { try { parsedGeojson = JSON.parse(parsedGeojson); } catch(e) {} }
      if (typeof parsedPoi === 'string') { try { parsedPoi = JSON.parse(parsedPoi); } catch(e) {} }

      const fullData = {
        ...dist,
        ...filterData,
        district_id: districtId,
        geojson: parsedGeojson,
        poi_data: parsedPoi,
        photo_url: photoData?.photo_url || null
      };

      return new Response(JSON.stringify({ data: fullData }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "save") {
        if (role !== "super_admin" && !allowedTabs.includes("manual.edit") && !allowedTabs.includes("parser.run_offline")) {
            throw new Error("Forbidden: missing manual.edit or parser.run_offline permission");
        }
        
        const { 
            name, is_available, geojson, poi_data, photo_url, 
            id, district_id, city_id, created_at, updated_at, data_updated_at, last_updated, cities, 
            ...filterFields 
        } = payload;

        if (name !== undefined || is_available !== undefined) {
            await supabaseAdmin.from('districts').update({ 
                ...(name !== undefined && {name}), 
                ...(is_available !== undefined && {is_available}),
                updated_at: new Date().toISOString()
            }).eq('id', districtId);
        }

        if (geojson !== undefined || poi_data !== undefined) {
            const geoUpdate: any = { district_id: districtId };
            if (geojson !== undefined) geoUpdate.geojson = geojson;
            if (poi_data !== undefined) geoUpdate.poi_data = poi_data;
            await supabaseAdmin.from('district_geo_data').upsert(geoUpdate, { onConflict: 'district_id' });
        }

        if (photo_url) {
            await supabaseAdmin.from('district_photos').upsert({
                district_id: districtId,
                photo_url: photo_url,
                is_main: true,
                updated_at: new Date().toISOString()
            }, { onConflict: 'district_id' });
        }

        if (Object.keys(filterFields).length > 0) {
            filterFields.district_id = districtId;
            filterFields.last_updated = new Date().toISOString();
            await supabaseAdmin.from('district_filter_data').upsert(filterFields, { onConflict: 'district_id' });
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Invalid action");
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});