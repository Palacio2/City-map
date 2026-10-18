import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

function validateField(value: unknown, creating: boolean) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid field');
    const field = value as Record<string, unknown>;
    if ((creating || 'field_code' in field) && (typeof field.field_code !== 'string' || !/^[a-z][a-z0-9_]*$/.test(field.field_code))) throw new Error('Invalid field code');
    for (const key of ['is_active', 'is_premium', 'is_realtor_only', 'is_visible_form', 'is_visible_table']) {
        if (key in field && typeof field[key] !== 'boolean') throw new Error('Invalid field flag');
    }
    if ('data_type' in field && !['integer', 'number', 'numeric', 'float', 'boolean', 'text'].includes(String(field.data_type))) throw new Error('Invalid field type');
}

Deno.serve(async (req) => {
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
            validateField(payload, true);
            const { error } = await supabaseAdmin.from('fields_config').insert([payload]);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'update_field') {
            if (!hasTab('fields.edit')) throw new Error('Forbidden: Missing fields.edit permission');
            const { id, updates } = payload;
            validateField(updates, false);
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
