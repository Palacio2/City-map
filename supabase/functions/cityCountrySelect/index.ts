import { publishableKey } from '../_shared/keys.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.112.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      publishableKey()
    )

    const url = new URL(req.url)
    const path = url.pathname

    // 1. Get Countries
    if (path.endsWith('/countries')) {
      const { data, error } = await supabase
        .from('countries')
        .select('name, is_available')
        .order('name')

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (path.includes('/popular-cities')) {
      let countryName = url.searchParams.get('country') || ''
      if (!countryName && path.includes('/popular-cities/')) {
        countryName = decodeURIComponent(path.split('/popular-cities/').pop() ?? '').trim()
      }

      let query = supabase
        .from('popular_cities_view')
        .select('*')
        .order('total_visits', { ascending: false })
        .order('districts_count', { ascending: false })
        .order('city_name', { ascending: true })
        .limit(6)

      if (countryName) {
        query = query.eq('country_name', countryName)
      }

      const { data, error } = await query

      if (error) throw error

      const topCities = (data || []).map((item: any) => ({
        id: `${item.country_name}_${item.city_name}`,
        city: item.city_name,
        country: item.country_name,
        is_available: item.is_available,
        districtsCount: item.districts_count,
        visits: item.total_visits,
      }))

      return new Response(JSON.stringify(topCities), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 3. Get Cities by Country
    if (path.includes('/cities/')) {
      const countryName = decodeURIComponent(path.split('/cities/').pop() ?? '').trim()

      const { data, error } = await supabase
        .from('cities')
        .select(`
          name, 
          is_available,
          countries!inner(name)
        `)
        .eq('countries.name', countryName) 
        .order('name')

      if (error) throw error

      const cleanData = (data || []).map((item: any) => ({
        name: item.name,
        is_available: item.is_available
      }))

      return new Response(JSON.stringify(cleanData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})