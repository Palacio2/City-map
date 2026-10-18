import { publishableKey } from '../_shared/keys.ts';
import { mapTrackedDistrict } from './mapper.ts';
import { getDistrictDataClient, getUserAccess, getFieldsConfig, stripRestrictedFields } from '../_shared/security.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.112.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'private, no-store',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    const supabaseKey = publishableKey();
    const authHeader = req.headers.get('Authorization');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase variables');
    }

    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: trackedData, error: dbError } = await getDistrictDataClient()
      .from('user_tracked_districts')
      .select(`
        id, country, city, district, district_id, created_at,
        districts!inner (
          updated_at, is_available,
          district_filter_data ( average_rent_price, average_sale_price_sqm, average_property_price )
        )
      `)

      .eq('user_id', user.id)
      .eq('districts.is_available', true)
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    const access = await getUserAccess(req);
    const fields = await getFieldsConfig();
    const result = trackedData.map(item => mapTrackedDistrict(item, stats => {
      const filtered = { ...stats };
      stripRestrictedFields(filtered, fields, access);
      return filtered;
    }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('API Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
