import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sentry-trace, baggage",
};

export const getAdminClient = () => {
    return createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
};

export const verifyAdminUser = async (req: Request) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const supabaseAdmin = getAdminClient();

    const { data: profile } = await supabaseAdmin
        .from("admin_profiles")
        .select("role, allowed_tabs")
        .eq("user_id", user.id)
        .maybeSingle();

    const role = profile?.role || user.app_metadata?.role || "user";
    const allowedTabs = profile?.allowed_tabs || [];

    if (role !== "super_admin" && role !== "admin") {
        throw new Error("Forbidden: Not an admin");
    }

    return {
        user,
        role,
        allowedTabs,
        isSuperAdmin: role === "super_admin",
        supabaseAdmin,
        hasTab: (tab: string) => role === "super_admin" || allowedTabs.includes(tab)
    };
};
