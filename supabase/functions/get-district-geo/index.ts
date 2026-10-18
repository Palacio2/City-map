import { visiblePois } from '../_shared/fieldAccess.ts';
import { getDistrictDataClient, getUserAccess, getFieldsConfig, corsHeaders } from '../_shared/security.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json', Allow: 'GET, POST, OPTIONS' },
    });
  }

  try {
    const supabase = getDistrictDataClient();

    let districtId = null;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.districtId) districtId = body.districtId;
      } catch (e) {
        // body might be empty
      }
    } else {
      const url = new URL(req.url);
      districtId = url.searchParams.get('districtId') || '';
    }

    if (!districtId) {
      return new Response(JSON.stringify({ error: 'districtId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    // Fetch the data
    const { data, error } = await supabase
      .from('district_geo_data')
      .select('geojson, poi_data, districts!inner(is_available)')
      .eq('district_id', String(districtId))
      .eq('districts.is_available', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const result = { geojson: data?.geojson ?? null, poi_data: data?.poi_data ?? [] };

    // SECURITY: Filter POIs
    const access = await getUserAccess(req);

    result.poi_data = visiblePois(result.poi_data, await getFieldsConfig(), access);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
