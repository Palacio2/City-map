import { subscriptionState } from '../_shared/subscriptionState.ts';
import { verifyAdminUser, corsHeaders } from "../_shared/auth.ts";
import { readJsonObject, RequestError } from '../_shared/request.ts';
import { AccessError } from '../../../shared/authorization.js';
import { userManagementRequest } from './validation.ts';
import { collectPages } from '../_shared/pagination.ts';
import { reconcileDeletionBilling } from './billing.ts';

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const { user, role, allowedTabs, supabaseAdmin } = await verifyAdminUser(req);
    const { action, targetUserId, payload } = userManagementRequest(await readJsonObject(req), user.id);

    if (action !== "get_all") {
      const { data: targetProfile, error: targetError } = await supabaseAdmin.from("admin_profiles").select("role").eq("user_id", targetUserId).maybeSingle();
      if (targetError) throw new RequestError('Unable to verify target permissions', 503);
      const targetRole = targetProfile?.role || "user";
      if (!['user', 'admin', 'super_admin'].includes(targetRole)) throw new AccessError('Invalid target permissions');

      if ((targetRole === "admin" || targetRole === "super_admin") && role !== "super_admin") {
        throw new Error("Тільки Super Admin може керувати іншими адміністраторами");
      }
    }

    let responseData: any = { success: true };

    if (action === "get_all") {
      if (role !== "super_admin" && !allowedTabs.includes("users")) {
        throw new Error("Тільки адміністратор з доступом до вкладки 'Користувачі' може переглядати список");
      }

      const users = await collectPages<any>(async (offset, size) => {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: offset / size + 1, perPage: size });
        if (error) throw error;
        return data.users;
      });
      const readRows = (table: string, columns: string, order: string, active = false) => collectPages<any>(async (offset, size) => {
        let query = supabaseAdmin.from(table).select(columns).order(order).range(offset, offset + size - 1);
        if (active) query = query.in('status', ['active', 'trialing']);
        const { data, error } = await query;
        if (error || !data) throw new RequestError('Unable to load users', 503);
        return data;
      });
      const [statsData, subsData, activityData, profilesData] = await Promise.all([
        readRows('user_stats','user_id, total_time_seconds, last_active, is_terms_accepted','user_id'),
        readRows('user_subscriptions','id, user_id, plan_name, status, payment_id, starts_at, ends_at, cancel_at','id',true),
        readRows('user_activity_logs','user_id, searches_count','id'),
        readRows('admin_profiles','user_id, role, assigned_cities, allowed_tabs','user_id'),
      ]);

      const userSearches: Record<string, number> = {};
      if (activityData) {
        activityData.forEach((log: any) => {
          if (!userSearches[log.user_id]) userSearches[log.user_id] = 0;
          userSearches[log.user_id] += (log.searches_count || 0);
        });
      }

      const mergedUsers = users.map((u: any) => {
        const stats = statsData?.find((s: any) => s.user_id === u.id);
        
        const userSubs = subsData?.filter((s: any) => s.user_id === u.id) || [];
        const bestPlan = subscriptionState(userSubs).plan;

        const profile = profilesData?.find((p: any) => p.user_id === u.id);
        const totalSearches = userSearches[u.id] || 0;

        const currentRole = profile?.role || 'user';

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
      
      const { error } = await supabaseAdmin.rpc('set_admin_role', { p_actor: user.id, p_target: targetUserId, p_role: payload.role });
      if (error) throw new RequestError('Unable to update role', 503);
    } 
    else if (action === "update_cities") {
      if (role !== "super_admin" && !allowedTabs.includes("users.assign_cities")) throw new Error("Тільки Super Admin або уповноважений адміністратор може призначати міста");
      
      const { error } = await supabaseAdmin.from("admin_profiles").upsert({ user_id: targetUserId, assigned_cities: payload.cities }, { onConflict: "user_id" });
      if (error) throw new RequestError('Unable to assign cities', 503);
    }
    else if (action === "update_tabs") {
      if (role !== "super_admin") throw new Error("Тільки Super Admin може призначати доступи до вкладок");
      
      const { error } = await supabaseAdmin.from("admin_profiles").upsert({ user_id: targetUserId, allowed_tabs: payload.tabs }, { onConflict: "user_id" });
      if (error) throw new RequestError('Unable to assign permissions', 503);
    }
    else if (action === "delete_user") {
      if (role !== "super_admin" && !allowedTabs.includes("users.delete")) throw new Error("Тільки Super Admin або уповноважений адміністратор може видаляти користувачів");

      // Retain reconciliation links even for locally terminal subscriptions.
      // The database trigger repeats this guard atomically with Auth deletion.
      const { data: checkout, error: checkoutError } = await supabaseAdmin.from('billing_checkout_state')
        .select('user_id').eq('user_id', targetUserId).maybeSingle();
      if (checkoutError) throw new RequestError('Unable to verify billing before deletion', 503);
      const { data: billing, error: billingError } = await supabaseAdmin.from('user_subscriptions')
        .select('payment_id').eq('user_id', targetUserId).like('payment_id', 'SUB\\_%').limit(1);
      if (billingError || !billing) throw new RequestError('Unable to verify billing before deletion', 503);
      if (checkout || billing.length) await reconcileDeletionBilling(supabaseAdmin,user.id,targetUserId);
      const { data: alreadyDeleted, error: prepareError } = await supabaseAdmin.rpc('prepare_admin_user_deletion', {p_actor:user.id,p_target:targetUserId});
      if (prepareError || typeof alreadyDeleted !== 'boolean') throw new RequestError('Unable to record account deletion request', 503);
      if (!alreadyDeleted) {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        if (error) throw new RequestError('Account deletion not confirmed; retry to reconcile its status', 503);
      }
    }
    else if (action === "terminate_sessions") {
      if (role !== "super_admin" && !allowedTabs.includes("users.terminate")) throw new Error("Тільки Super Admin або уповноважений адміністратор може примусово завершувати сесії");
      const { error } = await supabaseAdmin.rpc('admin_terminate_user_sessions', { p_actor: user.id, p_target: targetUserId });
      if (error) throw new RequestError('Unable to terminate sessions', 503);
    }
    else {
      throw new Error("Invalid action");
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json", 'Cache-Control': 'private, no-store' },
      status: 200,
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof RequestError || error instanceof AccessError ? error.message : 'User management failed' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", 'Cache-Control': 'private, no-store' },
      status: error instanceof RequestError || error instanceof AccessError ? error.status : 503,
    });
  }
});
