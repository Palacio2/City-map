import { verifyAdminUser, corsHeaders as authHeaders } from "../_shared/auth.ts";
import { requireAction, requireCity } from '../../../shared/authorization.js';
import { signDistrictPhoto } from '../_shared/districtPhoto.ts';
const corsHeaders = { ...authHeaders, 'Cache-Control': 'private, no-store' };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, districtId, payload } = await req.json();
    if (!action || !districtId) throw new Error("Missing required fields");

    const access = await verifyAdminUser(req);
    const { supabaseAdmin } = access;

    const { data: districtCheck, error: districtCheckErr } = await supabaseAdmin.from('districts').select('city_id').eq('id', districtId).maybeSingle();
    
    if (districtCheckErr) throw districtCheckErr;
    if (!districtCheck) throw new Error("Район не знайдено");
    requireCity(access, districtCheck.city_id);
    if (action === 'get' || action === 'get_photo') requireAction(access, 'manual', 'parser', 'map');

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
        photo_url: photoData?.photo_url || null,
        photo_preview_url: await signDistrictPhoto(supabaseAdmin, photoData?.photo_url, districtId, 900)
      };

      return new Response(JSON.stringify({ data: fullData }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "get_photo") {
      const { data: photoData } = await supabaseAdmin.from('district_photos').select('photo_url').eq('district_id', districtId).limit(1).maybeSingle();
      return new Response(JSON.stringify({ data: await signDistrictPhoto(supabaseAdmin, photoData?.photo_url, districtId, 900) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "save") {
        requireAction(access, 'manual.save', 'parser.run_offline');
        
        const { 
            name, is_available, geojson, poi_data, photo_url, photo_preview_url,
            id, district_id, city_id, created_at, updated_at, data_updated_at, last_updated, cities, 
            ...filterFields 
        } = payload;

        if (geojson !== undefined || poi_data !== undefined) requireAction(access, 'manual.gis', 'parser.run_offline');

        const row: Record<string, unknown> = { district_id: districtId };
        if (name !== undefined || is_available !== undefined) row.base = { ...(name !== undefined && {name}), ...(is_available !== undefined && {is_available}) };
        if (geojson !== undefined || poi_data !== undefined) row.geo = { ...(geojson !== undefined && {geojson}), ...(poi_data !== undefined && {poi_data}) };
        if (photo_url) row.photo = { photo_url };
        if (Object.keys(filterFields).length) row.metrics = filterFields;
        const { error } = await supabaseAdmin.rpc('save_district_bundle', { p_actor: access.user.id, p_rows: [row] });
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error("Invalid action");
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: err.status === 403 || String(err.message).startsWith('Forbidden:') ? 403 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
