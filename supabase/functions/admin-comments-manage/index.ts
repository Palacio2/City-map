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

    if (!hasTab("comments")) {
        throw new Error("Forbidden: missing comments tab access");
    }

    let responseData = null;

    switch (action) {
      case "getComments":
        const { data: comments, error: commentsErr } = await supabaseAdmin
            .from("district_comments")
            .select(`
                *,
                districts (city_id)
            `)
            .order("created_at", { ascending: false });
        if (commentsErr) throw commentsErr;
        responseData = comments || [];
        break;

      case "hideComment":
        if (!hasTab("comments.hide")) {
            throw new Error("Forbidden: missing comments.hide permission");
        }
        if (!payload.id) throw new Error("Missing comment id");
        const { error: hideErr } = await supabaseAdmin
            .from("district_comments")
            .update({ is_hidden: payload.isHidden })
            .eq("id", payload.id);
        if (hideErr) throw hideErr;
        responseData = { success: true };
        break;

      case "deleteComment":
        if (!hasTab("comments.delete")) {
            throw new Error("Forbidden: missing comments.delete permission");
        }
        if (!payload.id) throw new Error("Missing comment id");
        const { error: deleteErr } = await supabaseAdmin
            .from("district_comments")
            .delete()
            .eq("id", payload.id);
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
