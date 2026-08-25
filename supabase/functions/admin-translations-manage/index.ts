import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { supabaseAdmin, hasTab } = await verifyAdminUser(req);
        const { action, payload } = await req.json();

        if (action === 'get_all') {
            if (!hasTab('translations')) throw new Error('Forbidden: Missing translations permission');
            
            let allData: Record<string, unknown>[] = [];
            let from = 0;
            const limit = 1000;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await supabaseAdmin
                    .from('translations')
                    .select('*')
                    .order('translation_key')
                    .range(from, from + limit - 1);

                if (error) throw error;
                allData = [...allData, ...data];
                
                if (data.length < limit) {
                    hasMore = false;
                } else {
                    from += limit;
                }
            }

            return new Response(JSON.stringify({ data: allData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'insert') {
            if (!hasTab('translations.add')) throw new Error('Forbidden: Missing translations.add permission');
            const { error } = await supabaseAdmin.from('translations').insert([payload]);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'update') {
            if (!hasTab('translations.edit')) throw new Error('Forbidden: Missing translations.edit permission');
            const { key, updates } = payload;
            const { error } = await supabaseAdmin.from('translations').update(updates).eq('translation_key', key);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'delete') {
            if (!hasTab('translations.delete')) throw new Error('Forbidden: Missing translations.delete permission');
            const { key } = payload;
            const { error } = await supabaseAdmin.from('translations').delete().eq('translation_key', key);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'delete_many') {
            if (!hasTab('translations.delete')) throw new Error('Forbidden: Missing translations.delete permission');
            const { keys } = payload;
            const { error } = await supabaseAdmin.from('translations').delete().in('translation_key', keys.slice(0, 999));
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        throw new Error('Unknown action');

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
});
