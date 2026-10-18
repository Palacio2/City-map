-- This preserves the legacy manual-gift timing. Gift queues and Stripe deferral
-- require a separate lifecycle migration before release.
create or replace function public.manage_manual_gift(
  p_actor uuid, p_target uuid, p_action text, p_plan text default null, p_days integer default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  actor public.admin_profiles%rowtype;
  target_role text;
  old_rows jsonb;
  changed integer;
  applied_at timestamptz;
begin
  if p_actor is null or p_target is null or p_action is null
    or p_action not in ('grant_subscription', 'revoke_gift') then
    raise exception 'Invalid gift request' using errcode = '22023';
  end if;
  if p_action = 'grant_subscription' and (p_plan is null or p_plan not in ('premium', 'realtor')
    or p_days is null or p_days < 1 or p_days > 365) then
    raise exception 'Invalid gift plan or duration' using errcode = '22023';
  end if;
  -- Serialize gift grant/revoke for a recipient, including an absent gift row.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('manual-gift:' || p_target::text, 0));
  perform 1 from auth.users where id = p_target for key share;
  if not found then raise exception 'Unknown gift recipient' using errcode = '22023'; end if;
  -- Recheck persisted permissions inside the same transaction as the mutation.
  perform 1 from public.admin_profiles where user_id in (p_actor, p_target) order by user_id for share;
  select * into actor from public.admin_profiles where user_id = p_actor;
  if not found or actor.role not in ('admin', 'super_admin')
    or (actor.role <> 'super_admin' and not coalesce('users.gift_sub' = any(actor.allowed_tabs), false)) then
    raise exception 'Gift permission denied' using errcode = '42501';
  end if;
  select role into target_role from public.admin_profiles where user_id = p_target;
  if target_role is not null and (target_role not in ('user', 'admin', 'super_admin')
    or (target_role <> 'user' and actor.role <> 'super_admin')) then
    raise exception 'Gift recipient permission denied' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) into old_rows
    from public.user_subscriptions s where user_id = p_target and left(payment_id, 5) = 'GIFT_';
  applied_at := clock_timestamp();
  if p_action = 'grant_subscription' then
    insert into public.user_subscriptions(user_id, payment_id, plan_name, status, starts_at, ends_at, amount, cancelled_at, cancel_at)
      values (p_target, 'GIFT_MANUAL_' || p_target::text, p_plan, 'active', applied_at,
        applied_at + p_days * interval '24 hours', 0, null, null)
      on conflict (payment_id) do update set user_id = excluded.user_id, plan_name = excluded.plan_name,
        status = excluded.status, starts_at = case
          when public.user_subscriptions.plan_name = excluded.plan_name
            and public.user_subscriptions.status in ('active', 'trialing')
            and public.user_subscriptions.ends_at > applied_at
          then public.user_subscriptions.starts_at
          else excluded.starts_at
        end,
        ends_at = case
          when public.user_subscriptions.plan_name = excluded.plan_name
            and public.user_subscriptions.status in ('active', 'trialing')
            and public.user_subscriptions.ends_at > applied_at
          then public.user_subscriptions.ends_at + p_days * interval '24 hours'
          else excluded.ends_at
        end,
        amount = excluded.amount, cancelled_at = null, cancel_at = null;
  else
    update public.user_subscriptions set status = 'canceled', cancelled_at = applied_at
      where user_id = p_target and status in ('active', 'trialing') and left(payment_id, 5) = 'GIFT_';
  end if;
  get diagnostics changed = row_count;
  insert into public.audit_logs(admin_id, action, target_table, record_id, old_data, new_data)
    values (p_actor, case when p_action = 'grant_subscription' then 'GRANT_SUBSCRIPTION' else 'REVOKE_GIFT' end,
      'user_subscriptions', p_target::text, old_rows,
      jsonb_build_object('source', 'gift', 'plan', p_plan, 'days', p_days, 'changed', changed));
  return jsonb_build_object('success', true, 'source', 'gift');
end;
$$;
revoke all on function public.manage_manual_gift(uuid,uuid,text,text,integer) from public, anon, authenticated;
grant execute on function public.manage_manual_gift(uuid,uuid,text,text,integer) to service_role;
