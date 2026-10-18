import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";
import { readJsonObject, RequestError } from '../_shared/request.ts';
const headers = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' };

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
    try {
        const { user, supabaseAdmin, hasTab } = await verifyAdminUser(req);
        const { action, limit = 100, selectedDate, log } = await readJsonObject(req, 16_384);
        if (!Number.isInteger(limit) || Number(limit) < 1 || Number(limit) > 500) throw new RequestError('Invalid log limit');

        if (action === 'get_audit_logs') {
            if (!hasTab('audit')) {
                throw new RequestError('Forbidden: No access to audit logs', 403);
            }

            let query = supabaseAdmin
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false }).limit(Number(limit));

            if (selectedDate) {
                if (typeof selectedDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate) || !Number.isFinite(Date.parse(selectedDate))) throw new RequestError('Invalid log date');
                const startOfDay = new Date(selectedDate);
                startOfDay.setHours(0, 0, 0, 0);
                
                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59, 999);
                
                query = query
                    .gte('created_at', startOfDay.toISOString())
                    .lte('created_at', endOfDay.toISOString());
            }

            const { data, error } = await query;
            if (error) throw error;
            return Response.json({ data }, { headers });
        }

        if (action === 'get_ai_logs') {
            if (!hasTab('ai')) {
                throw new RequestError('Forbidden: No access to ai logs', 403);
            }

            const { data, error } = await supabaseAdmin
                .from('ai_system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(Number(limit));

            if (error) throw error;
            return Response.json({ data }, { headers });
        }

        if (action === 'insert_ai_log') {
            if (!hasTab('ai.toggle')) {
                // Only users with ai.toggle can toggle AI status
                throw new RequestError('Forbidden: No permission to change AI settings', 403);
            }

            if (!log || typeof log !== 'object' || Array.isArray(log)) throw new RequestError('Log payload missing');
            const entry = log as Record<string, unknown>;
            if (typeof entry.system_action !== 'string' || entry.system_action.length > 1000) throw new RequestError('Invalid system action');

            const { error } = await supabaseAdmin
                .from('ai_system_logs')
                .insert([{ log_type: 'client_event', system_action: entry.system_action, user_id: user.id, user_email: user.email }]);

            if (error) throw error;
            return Response.json({ success: true }, { headers });
        }

        if (action === 'insert_client_event') {
            if (!log || typeof log !== 'object' || Array.isArray(log)) throw new RequestError('Invalid client event');
            const entry = log as Record<string, unknown>;
            if (typeof entry.action !== 'string' || entry.action.length < 1 || entry.action.length > 150) throw new RequestError('Invalid event action');
            const { error } = await supabaseAdmin.from('audit_logs').insert({
                admin_id: user.id, action: 'client_event', target_table: 'client',
                new_data: { source: 'client', claimed_action: entry.action, details: entry.details ?? null },
            });
            if (error) throw error;
            return Response.json({ success: true }, { headers });
        }

        if (action === 'insert_auth_log') {
            const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
            const authLog = {
                admin_id: user.id,
                action: 'verified_admin_session',
                target_table: 'auth',
                record_id: user.id,
                new_data: { user_email: user.email, ip, timestamp: new Date().toISOString() }
            };
            const { error } = await supabaseAdmin.from('audit_logs').insert([authLog]);
            if (error) throw error;
            return Response.json({ success: true }, { headers });
        }

        throw new RequestError('Unknown action');

    } catch (error) {
        return new Response(JSON.stringify({ error: error instanceof RequestError ? error.message : 'Log service unavailable' }), {
            headers,
            status: error instanceof RequestError ? error.status : 503
        });
    }
});
