import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 }) 
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    let body;
    try { body = await req.json() } catch { throw new Error('Invalid JSON') }
    
    const { districtId, action } = body
    if (!districtId) throw new Error('District ID required')

    if (action === 'check') {
      const { data, error } = await supabaseClient
        .from('favorite_districts')
        .select('id')
        .eq('user_id', user.id)
        .eq('district_id', districtId)
        .maybeSingle()

      if (error) throw error
      
      return new Response(JSON.stringify({ isFavorite: !!data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    if (action === 'toggle') {
      
      const { data: existing } = await supabaseClient
        .from('favorite_districts')
        .select('id')
        .eq('user_id', user.id)
        .eq('district_id', districtId)
        .maybeSingle()

      let result;
      
      if (existing) {
        
        const { error } = await supabaseClient.from('favorite_districts').delete().eq('id', existing.id)
        if (error) throw error
        result = { success: true, isFavorite: false }
      } else {
        
        const { error } = await supabaseClient.from('favorite_districts').insert({ user_id: user.id, district_id: districtId })
        if (error) throw error
        result = { success: true, isFavorite: true }
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401 : 400
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status
    })
  }
})