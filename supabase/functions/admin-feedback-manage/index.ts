import { verifyAdminUser, corsHeaders as authHeaders } from "../_shared/auth.ts";
import { feedbackObjectPath, canManageFeedback } from "../_shared/feedbackStorage.ts";
import { cleanFeedbackAttachment, retryFeedbackAttachments } from '../_shared/feedbackDeletion.ts';
const corsHeaders = { ...authHeaders, 'Cache-Control': 'private, no-store' };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { role, allowedTabs, supabaseAdmin, user } = await verifyAdminUser(req);

    const payload = await req.json();
    const { action, id, newStatus } = payload;

    if (!canManageFeedback(role, allowedTabs, action)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

      if (!id) throw new Error('Missing id');
      const { data: job, error } = await supabaseAdmin.rpc('delete_feedback_message', {p_actor:user.id,p_message:id});
      if (error) throw error;
      const cleanupPending = job ? !(await cleanFeedbackAttachment(supabaseAdmin,user.id,job)) : false;

      return new Response(JSON.stringify({ success: true, cleanup_pending: cleanupPending }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "get_messages") {
      if (role !== "super_admin" && !allowedTabs.includes("feedback")) {
        throw new Error("Немає доступу до перегляду звернень");
      }

      if (canManageFeedback(role,allowedTabs,'delete_message')) await retryFeedbackAttachments(supabaseAdmin,user.id);

      const { data, error } = await supabaseAdmin
        .from("contacts_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const messages = await Promise.all((data ?? []).map(async message => {
        const path = feedbackObjectPath(message.screenshot_url, Deno.env.get('SUPABASE_URL') ?? '');
        if (!path) return { ...message, screenshot_url: null };
        const { data: signed, error: signError } = await supabaseAdmin.storage.from('feedback_images').createSignedUrl(path, 900);
        if (signError) {
          console.warn('Unable to sign feedback attachment');
          return { ...message, screenshot_url: null };
        }
        return { ...message, screenshot_url: signed.signedUrl };
      }));
      return new Response(JSON.stringify({ success: true, data: messages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
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
