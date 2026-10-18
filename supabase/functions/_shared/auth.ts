import { secretKey, publishableKey } from './keys.ts';
import { createClient } from "npm:@supabase/supabase-js@2.112.2";
import { normalizeAdminProfile, requireVerifiedMfa } from '../../../shared/authorization.js';

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sentry-trace, baggage",
};

export const getAdminClient = (verifiedActor?: string) => {
    return createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        secretKey(),
        verifiedActor ? { global: { headers: { 'x-citymaps-admin-actor': verifiedActor } } } : undefined
    );
};

export const verifyAdminUser = async (req: Request) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        publishableKey(),
        { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");
    requireVerifiedMfa(token);

    const supabaseAdmin = getAdminClient();

    const { data: profile, error: profileError } = await supabaseAdmin
        .from("admin_profiles")
        .select("role, allowed_tabs, assigned_cities")
        .eq("user_id", user.id)
        .maybeSingle();

    if (profileError) throw new Error('Unable to verify admin permissions');
    const access = normalizeAdminProfile(profile);

    return {
        user,
        ...access,
        // Never copy this header from the incoming request. PostgREST accepts
        // the actor context only on our server's service-role connection.
        supabaseAdmin: getAdminClient(user.id),
        hasTab: (tab: string) => access.isSuperAdmin || access.allowedTabs.includes(tab)
    };
};
