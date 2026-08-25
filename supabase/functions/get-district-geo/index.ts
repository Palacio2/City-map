import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2';
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { getUserAccess, getFieldsConfig, corsHeaders } from '../_shared/security.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
      districtId = decodeURIComponent(url.searchParams.get('districtId') || '');
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
      .select('geojson, poi_data')
      .eq('district_id', String(districtId))
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const result = data || { geojson: null, poi_data: [] };

    // SECURITY: Filter POIs
    const access = await getUserAccess(req);
    
    // Only strip if not full access
    if (!access.isPremium || !access.isRealtor) {
      const fieldsConfig = await getFieldsConfig();
      
      let rawPois = result.poi_data || [];
      if (typeof rawPois === 'string') {
        try { rawPois = JSON.parse(rawPois); } catch { rawPois = []; }
      }
      
      if (Array.isArray(rawPois)) {
        result.poi_data = rawPois.filter((poi: any) => {
          if (access.isRealtor) return true; // Realtors see everything, wait, what if they don't have premium? The logic usually grants premium to realtors.
          
          let isPremiumPoi = false;
          let isRealtorPoi = false;
          let foundField = false;

          for (const field of fieldsConfig) {
            // Check if this field corresponds to the POI type
            if (field.field_code === poi.type || `${field.field_code}_count` === poi.type) {
              foundField = true;
              if (field.parser_config?.isRealtorOnly) isRealtorPoi = true;
              else if (field.parser_config?.isPremium) isPremiumPoi = true;
              break;
            }
          }
          
          if (!foundField) {
            // Default behavior in frontend was to assume premium if not found. Let's replicate.
            isPremiumPoi = true;
          }

          if (access.isFree) {
            return !isPremiumPoi && !isRealtorPoi;
          }
          
          // User is premium, but not realtor
          return !isRealtorPoi;
        });
      }
    }

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
