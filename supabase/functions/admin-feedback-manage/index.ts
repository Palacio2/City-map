import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { role, allowedTabs, supabaseAdmin } = await verifyAdminUser(req);

    const payload = await req.json();
    const { action, id, newStatus } = payload;

    if (action === "change_status") {
      if (role !== "super_admin" && !allowedTabs.includes("feedback.change_status")) {
        throw new Error("Тільки Super Admin або уповноважений адміністратор може змінювати статус звернення");
      }
      
      if (!id || !newStatus) throw new Error("Missing id or newStatus");
      
      const { error } = await supabaseAdmin.from('contacts_messages').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "delete_message") {
      if (role !== "super_admin" && !allowedTabs.includes("feedback.delete")) {
        throw new Error("Тільки Super Admin або уповноважений адміністратор може видаляти звернення");
      }
      
      const { error } = await supabaseAdmin.from('contacts_messages').delete().eq('id', id);
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Unknown action");
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Server Error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
