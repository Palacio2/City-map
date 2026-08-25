import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.2';
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { getUserAccess, getFieldsConfig, stripRestrictedFields, corsHeaders } from '../_shared/security.ts';

const CACHE_TTL = 300; 

const districtCache = new Map();

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

    const url = new URL(req.url);
    let countryName = decodeURIComponent(url.searchParams.get('country') || '');
    let cityName = decodeURIComponent(url.searchParams.get('city') || '');
    let idsParam = url.searchParams.get('ids'); 
    let filtersParam = url.searchParams.get('filters');

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.country) countryName = body.country;
        if (body.city) cityName = body.city;
        if (body.ids) idsParam = body.ids;
        if (body.filters) filtersParam = body.filters;
      } catch (e) {
        // body might be empty
      }
    }

    // SECURITY: Get user access level
    const access = await getUserAccess(req);
    const accessLevel = access.isRealtor ? 'realtor' : (access.isPremium ? 'premium' : 'free');

    let orderedIds: string[] = [];

    if (!idsParam && countryName && cityName) {
        const { data: popularIds, error: rpcError } = await supabase.rpc('get_popular_district_ids', {
            city_name: cityName,
            country_name: countryName
        });

        if (!rpcError && popularIds && popularIds.length > 0) {
            orderedIds = popularIds.map((item: any) => item.id);
            
            idsParam = orderedIds.join(',');
        }
    } else if (idsParam) {
        orderedIds = idsParam.split(',');
    }

    const withFilters = filtersParam === 'true' || !!idsParam;

    if (!idsParam && (!countryName || !cityName)) {
      return new Response(JSON.stringify({ error: 'Params required: ids OR (country, city)' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    const cacheKey = idsParam 
        ? `ids:${idsParam}:${accessLevel}`
        : `${countryName}|${cityName}|${withFilters}:${accessLevel}`;

    if (CACHE_TTL > 0) {
        const cached = districtCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL * 1000)) {
          return new Response(JSON.stringify(cached.data), { 
            headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'Cache-Control': `public, max-age=${CACHE_TTL}` 
            } 
          });
        }
    }

    let selectQuery = `
      id, name, is_available, updated_at,
      district_photos(photo_url, is_main, description),
      cities!inner(name, countries!inner(name))
    `;
    
    if (withFilters) {
      selectQuery += `, district_filter_data(*)`;
    }

    let query = supabase
      .from('districts')
      .select(selectQuery)
      .eq('is_available', true);

    if (idsParam) {
        const ids = idsParam.split(',');
        query = query.in('id', ids);
    } else {
        query = query
          .eq('cities.name', cityName)
          .eq('cities.countries.name', countryName);
    }
      
    const { data: districts, error } = await query;

    if (error) throw error;

    // Get fields configuration to know what to strip
    const fieldsConfig = await getFieldsConfig();

    let result = districts.map((d: any) => {
      let mainPhoto = null;
      if (Array.isArray(d.district_photos)) {
          mainPhoto = d.district_photos.find((p: any) => p.is_main) || d.district_photos[0];
      } else if (d.district_photos && typeof d.district_photos === 'object') {
          mainPhoto = d.district_photos;
      }

      let f = null;
      if (withFilters && d.district_filter_data) {
        f = Array.isArray(d.district_filter_data) ? d.district_filter_data[0] : d.district_filter_data;
        
        // SECURITY: Strip restricted fields
        stripRestrictedFields(f, fieldsConfig, access);
      }

      const bestDate = f?.data_updated_at || f?.last_updated || d.updated_at;

      const item: any = {
        id: d.id,
        name: d.name,
        city: d.cities?.name,
        country: d.cities?.countries?.name,
        available: d.is_available,
        photo_url: mainPhoto?.photo_url || null,
        photo_description: mainPhoto?.description || d.name,
        updated_at: bestDate, 
      };

      if (f) {
          item.filterData = f;
      }

      return item;
    });

    if (orderedIds.length > 0) {
        result.sort((a: any, b: any) => {
            const indexA = orderedIds.indexOf(a.id);
            const indexB = orderedIds.indexOf(b.id);

            const valA = indexA === -1 ? 9999 : indexA;
            const valB = indexB === -1 ? 9999 : indexB;

            return valA - valB;
        });
    } else {
        
        result.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    if (CACHE_TTL > 0) {
        districtCache.set(cacheKey, { timestamp: Date.now(), data: result });
    }

    return new Response(JSON.stringify(result), { 
      headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache' 
      } 
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    });
  }
});