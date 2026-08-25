import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { user, supabaseAdmin, hasTab } = await verifyAdminUser(req);
        const { action, limit, selectedDate, log } = await req.json();

        if (action === 'get_audit_logs') {
            if (!hasTab('audit')) {
                throw new Error('Forbidden: No access to audit logs');
            }

            let query = supabaseAdmin
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (selectedDate) {
                const startOfDay = new Date(selectedDate);
                startOfDay.setHours(0, 0, 0, 0);
                
                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59, 999);
                
                query = query
                    .gte('created_at', startOfDay.toISOString())
                    .lte('created_at', endOfDay.toISOString());
            } else {
                query = query.limit(limit || 100);
            }

            const { data, error } = await query;
            if (error) throw error;
            return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'get_ai_logs') {
            if (!hasTab('ai')) {
                throw new Error('Forbidden: No access to ai logs');
            }

            const { data, error } = await supabaseAdmin
                .from('ai_system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit || 50);

            if (error) throw error;
            return new Response(JSON.stringify({ data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'insert_ai_log') {
            if (!hasTab('ai.toggle')) {
                // Only users with ai.toggle can toggle AI status
                throw new Error('Forbidden: No permission to change AI settings');
            }

            if (!log) throw new Error('Log payload missing');

            const { error } = await supabaseAdmin
                .from('ai_system_logs')
                .insert([log]);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'insert_auth_log') {
            const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
            const authLog = {
                admin_id: user.id,
                action: 'login_2fa_success',
                target_table: 'auth',
                record_id: user.id,
                new_data: { user_email: user.email, ip, timestamp: new Date().toISOString() }
            };
            const { error } = await supabaseAdmin.from('audit_logs').insert([authLog]);
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
