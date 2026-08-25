import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { supabaseAdmin, isSuperAdmin, hasTab } = await verifyAdminUser(req);

    // Parse request body
    const reqBodyText = await req.text();
    const reqBody = reqBodyText ? JSON.parse(reqBodyText) : {};
    const action = reqBody.action;
    const payload = reqBody.payload || {};

    if (!hasTab("scraper")) {
        throw new Error("Forbidden: missing scraper tab access");
    }

    let responseData = null;

    switch (action) {
      case "getRules":
        const { data: rules, error: rulesErr } = await supabaseAdmin
            .from("scraper_rules")
            .select("*")
            .order("created_at");
        if (rulesErr) throw rulesErr;
        responseData = rules || [];
        break;

      case "insertRule":
        if (!hasTab("scraper.add_rule")) {
            throw new Error("Forbidden: missing scraper.add_rule permission");
        }
        const { data: inserted, error: insertErr } = await supabaseAdmin
            .from("scraper_rules")
            .insert([payload])
            .select()
            .single();
        if (insertErr) throw insertErr;
        responseData = inserted;
        break;

      case "updateRule":
        if (!hasTab("scraper.edit_rule")) {
            throw new Error("Forbidden: missing scraper.edit_rule permission");
        }
        if (!payload.id) throw new Error("Missing rule id");
        const { data: updated, error: updateErr } = await supabaseAdmin
            .from("scraper_rules")
            .update(payload)
            .eq("id", payload.id)
            .select()
            .single();
        if (updateErr) throw updateErr;
        responseData = updated;
        break;

      case "deleteRule":
        if (!hasTab("scraper.delete_rule")) {
            throw new Error("Forbidden: missing scraper.delete_rule permission");
        }
        if (!payload.id) throw new Error("Missing rule id");
        const { error: deleteErr } = await supabaseAdmin
            .from("scraper_rules")
            .delete()
            .eq("id", String(payload.id));
        if (deleteErr) throw deleteErr;
        responseData = { success: true };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ data: responseData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Server Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
