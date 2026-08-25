import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, targetUserId, payload = {} } = await req.json();
    if (!action) throw new Error("Missing action field");
    if (action !== "get_all" && !targetUserId) throw new Error("Missing targetUserId field");

    const { role, allowedTabs, supabaseAdmin } = await verifyAdminUser(req);

    if (action !== "get_all") {
      const { data: targetProfile } = await supabaseAdmin.from("admin_profiles").select("role").eq("user_id", targetUserId).maybeSingle();
      const targetRole = targetProfile?.role || "user";

      if ((targetRole === "admin" || targetRole === "super_admin") && role !== "super_admin") {
        throw new Error("Тільки Super Admin може керувати іншими адміністраторами");
      }
    }

    let responseData: any = { success: true };

    if (action === "get_all") {
      if (role !== "super_admin" && !allowedTabs.includes("users")) {
        throw new Error("Тільки адміністратор з доступом до вкладки 'Користувачі' може переглядати список");
      }

      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (authErr) throw authErr;

      const { data: statsData } = await supabaseAdmin.from('user_stats').select('user_id, total_time_seconds, last_active, is_terms_accepted');
      const { data: subsData } = await supabaseAdmin.from('user_subscriptions').select('user_id, plan_name, status').in('status', ['active', 'trialing']);
      const { data: activityData } = await supabaseAdmin.from('user_activity_logs').select('user_id, searches_count');
      const { data: profilesData } = await supabaseAdmin.from('admin_profiles').select('user_id, role, assigned_cities, allowed_tabs');

      const userSearches: Record<string, number> = {};
      if (activityData) {
        activityData.forEach((log: any) => {
          if (!userSearches[log.user_id]) userSearches[log.user_id] = 0;
          userSearches[log.user_id] += (log.searches_count || 0);
        });
      }

      const mergedUsers = authData.users.map((u: any) => {
        const stats = statsData?.find((s: any) => s.user_id === u.id);
        
        const userSubs = subsData?.filter((s: any) => s.user_id === u.id) || [];
        let bestPlan = 'basic';
        if (userSubs.some((s: any) => s.plan_name === 'realtor')) {
          bestPlan = 'realtor';
        } else if (userSubs.some((s: any) => s.plan_name === 'premium')) {
          bestPlan = 'premium';
        } else if (userSubs.some((s: any) => s.plan_name === 'weekly')) {
          bestPlan = 'weekly';
        } else if (userSubs.length > 0) {
          bestPlan = userSubs[0].plan_name;
        }

        const profile = profilesData?.find((p: any) => p.user_id === u.id);
        const totalSearches = userSearches[u.id] || 0;

        let currentRole = profile?.role || u.app_metadata?.role || 'user';
        if (currentRole === 'admin' && !profile) currentRole = 'user';

        return {
          id: u.id,
          email: u.email,
          role: currentRole,
          cities: profile?.assigned_cities || [],
          assigned_cities: profile?.assigned_cities || [],
          allowed_tabs: profile?.allowed_tabs || ["dashboard"],
          plan: bestPlan,
          rodo_accepted: u.user_metadata?.rodo_accepted || stats?.is_terms_accepted || false,
          last_active: stats?.last_active || u.last_sign_in_at,
          created_at: u.created_at,
          searches_count: totalSearches
        };
      });

      mergedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      responseData = { users: mergedUsers };
    }
    else if (action === "update_role") {
      if (role !== "super_admin") throw new Error("Тільки Super Admin може змінювати ролі");
      
      const { data: existingProfile } = await supabaseAdmin.from("admin_profiles").select("allowed_tabs").eq("user_id", targetUserId).maybeSingle();
      const newProfile: any = { user_id: targetUserId, role: payload.role };
      if (!existingProfile) {
        newProfile.allowed_tabs = ["dashboard"];
      }

      await supabaseAdmin.from("admin_profiles").upsert(newProfile, { onConflict: "user_id" });
      await supabaseAdmin.auth.admin.updateUserById(targetUserId, { app_metadata: { role: payload.role } });
    } 
    else if (action === "update_cities") {
      if (role !== "super_admin" && !allowedTabs.includes("users.assign_cities")) throw new Error("Тільки Super Admin або уповноважений адміністратор може призначати міста");
      
      await supabaseAdmin.from("admin_profiles").upsert({ user_id: targetUserId, assigned_cities: payload.cities }, { onConflict: "user_id" });
    }
    else if (action === "update_tabs") {
      if (role !== "super_admin") throw new Error("Тільки Super Admin може призначати доступи до вкладок");
      
      await supabaseAdmin.from("admin_profiles").upsert({ user_id: targetUserId, allowed_tabs: payload.tabs }, { onConflict: "user_id" });
    }
    else if (action === "delete_user") {
      if (role !== "super_admin" && !allowedTabs.includes("users.delete")) throw new Error("Тільки Super Admin або уповноважений адміністратор може видаляти користувачів");
      
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (error) throw error;
    }
    else if (action === "terminate_sessions") {
      if (role !== "super_admin" && !allowedTabs.includes("users.terminate")) throw new Error("Тільки Super Admin або уповноважений адміністратор може примусово завершувати сесії");
      const { error } = await supabaseAdmin.rpc('force_logout_user', { target_user_id: targetUserId });
      if (error) throw new Error(`Помилка SQL RPC: ${error.message}`);
    }
    else {
      throw new Error("Invalid action");
    }

    return new Response(JSON.stringify(responseData), {
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