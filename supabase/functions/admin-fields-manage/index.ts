import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { supabaseAdmin, hasTab } = await verifyAdminUser(req);
        const { action, payload } = await req.json();

        if (action === 'get_fields') {
            if (!hasTab('fields')) throw new Error('Forbidden: Missing fields permission');
            const { data, error } = await supabaseAdmin.from('fields_config').select('*').order('sort_order');
            if (error) throw error;
            return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'get_groups') {
            if (!hasTab('fields')) throw new Error('Forbidden: Missing fields permission');
            const { data, error } = await supabaseAdmin.from('field_groups').select('*').order('sort_order');
            if (error) throw error;
            return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'create_field') {
            if (!hasTab('fields.add')) throw new Error('Forbidden: Missing fields.add permission');
            const { error } = await supabaseAdmin.from('fields_config').insert([payload]);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'update_field') {
            if (!hasTab('fields.edit')) throw new Error('Forbidden: Missing fields.edit permission');
            const { id, updates } = payload;
            const { error } = await supabaseAdmin.from('fields_config').update(updates).eq('id', id);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'delete_field') {
            if (!hasTab('fields.delete')) throw new Error('Forbidden: Missing fields.delete permission');
            const { id } = payload;
            const { error } = await supabaseAdmin.from('fields_config').delete().eq('id', String(id));
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
