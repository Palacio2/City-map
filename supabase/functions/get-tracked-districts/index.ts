import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2';
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY'); 
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

    const { data: trackedData, error: dbError } = await supabase
      .from('user_tracked_districts')
      .select(`
        id, country, city, district, district_id, created_at,
        districts (
          updated_at,
          district_filter_data ( average_rent_price, average_sale_price_sqm, average_property_price )
        )
      `)
      
      .eq('user_id', user.id) 
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    const result = trackedData.map(item => {
      const rawFilterData = item.districts?.district_filter_data;
      let filterStats: any = {};
      
      if (Array.isArray(rawFilterData)) {
         filterStats = rawFilterData[0] || {};
      } else if (rawFilterData && typeof rawFilterData === 'object') {
         filterStats = rawFilterData;
      }

      return {
        id: item.id,
        country: item.country,
        city: item.city,
        district: item.district,
        district_id: item.district_id,
        rental_price: filterStats.average_rent_price || 0,
        sale_price: filterStats.average_sale_price_sqm || filterStats.average_property_price || 0,
        updated_at: item.districts?.updated_at || item.created_at
      };
    });

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