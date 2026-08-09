import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sendRes = (data: any, status: number) => new Response(JSON.stringify(data), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    let authUserId = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const supabaseAuthClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "", 
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const { data: { user } } = await supabaseAuthClient.auth.getUser(token);
      if (user) {
        authUserId = user.id;
      }
    }

    const { 
      name, email, message, type = 'contact', 
      user_id, page_url, screenshot_url, browser_info, screen_size,
      consent_accepted
    } = body;

    const finalUserId = authUserId || user_id;

    if (!email) return sendRes({ error: 'Вкажіть Email' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendRes({ error: 'Невірний Email' }, 400);

    if (type === 'contact') {
      if (!message || message.length < 10) return sendRes({ error: 'Повідомлення занадто коротке' }, 400);
      if (!name || name.length < 2) return sendRes({ error: "Ім'я занадто коротке" }, 400);
      
      if (consent_accepted !== true) return sendRes({ error: 'Необхідна згода на обробку даних' }, 400);
    } else {
      if ((!message || message.trim() === '') && !screenshot_url) {
        return sendRes({ error: 'Додайте опис або скріншот' }, 400);
      }
    }

    const finalMessage = message && message.trim().length > 0 ? message.trim() : '[Без опису]';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .from('contacts_messages')
      .insert([{
        name: name ? name.trim() : null,
        email: email.trim(),
        message: finalMessage,
        type,
        user_id: finalUserId || null,
        page_url: page_url || null,
        screenshot_url: screenshot_url || null,
        browser_info: browser_info || null,
        screen_size: screen_size || null,
        status: 'new',
        consent_accepted: type === 'contact' ? consent_accepted : null
      }])
      .select('id')
      .single();

    if (error) throw error;

    return sendRes({ success: true, id: data.id }, 200);

  } catch (error) {
    return sendRes({ error: error.message }, 500);
  }
});