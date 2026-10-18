-- Durable intent survives eventual Auth deletion. No browser access and no
-- cascade: these identifiers are needed for late Stripe reconciliation.
create table if not exists public.billing_account_deletions (
  user_id uuid primary key,
  requested_by uuid not null,
  requested_at timestamptz not null default now(),
  checkout_snapshot jsonb,
  subscription_snapshot jsonb not null,
  cancellation_result jsonb,
  cancellation_recorded_at timestamptz
);
alter table public.billing_account_deletions enable row level security;
revoke all on public.billing_account_deletions from public,anon,authenticated,service_role;

create or replace function public.begin_billing_account_deletion(p_actor uuid,p_target uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_role text; actor_tabs text[]; target_role text;
  checkout public.billing_checkout_state; op public.billing_account_deletions;
begin
  if p_actor is null or p_target is null or p_actor=p_target then
    raise exception 'Invalid deletion target' using errcode='42501';
  end if;
  select role,allowed_tabs into actor_role,actor_tabs from public.admin_profiles where user_id=p_actor;
  if actor_role is distinct from 'super_admin' and
    (actor_role is distinct from 'admin' or not ('users.delete'=any(coalesce(actor_tabs,'{}')))) then
    raise exception 'Deletion permission required' using errcode='42501';
  end if;
  perform id from auth.users where id=p_target for update;
  if not found then raise exception 'Target user not found' using errcode='P0002'; end if;
  select role into target_role from public.admin_profiles where user_id=p_target;
  if target_role is not null and target_role not in ('user','admin','super_admin') then
    raise exception 'Invalid target permissions' using errcode='42501';
  end if;
  if target_role in ('admin','super_admin') and actor_role<>'super_admin' then
    raise exception 'Only super admin may manage administrators' using errcode='42501';
  end if;
  select * into op from public.billing_account_deletions where user_id=p_target for update;
  if found then
    update public.billing_account_deletions set cancellation_recorded_at=null where user_id=p_target;
    return to_jsonb(op);
  end if;
  select * into checkout from public.billing_checkout_state where user_id=p_target for update;
  if checkout.lease_until>clock_timestamp() then
    raise exception 'Checkout still in progress; retry later' using errcode='CM409';
  end if;
  insert into public.billing_account_deletions(user_id,requested_by,checkout_snapshot,subscription_snapshot)
    values(p_target,p_actor,case when checkout.user_id is not null then to_jsonb(checkout)-'lease_token' else null end,
      coalesce((select jsonb_agg(to_jsonb(s) order by s.payment_id) from public.user_subscriptions s where user_id=p_target),'[]'))
    returning * into op;
  insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
    values(p_actor,'billing_account_deletion_requested','auth.users',p_target::text,
      '{"checkout_frozen":true,"cancel_immediately":true}');
  return to_jsonb(op);
end $$;
revoke all on function public.begin_billing_account_deletion(uuid,uuid) from public,anon,authenticated;
grant execute on function public.begin_billing_account_deletion(uuid,uuid) to service_role;

-- Preserve the original checkout lease implementation behind a guarded entry.
-- Both this wrapper and deletion begin lock auth.users before checkout state.
do $$ begin
  if to_regprocedure('public.claim_billing_checkout_unfrozen(uuid,text,text,text)') is null then
    alter function public.claim_billing_checkout(uuid,text,text,text) rename to claim_billing_checkout_unfrozen;
  end if;
end $$;
revoke all on function public.claim_billing_checkout_unfrozen(uuid,text,text,text) from public,anon,authenticated,service_role;
create or replace function public.claim_billing_checkout(p_user_id uuid,p_plan text,p_price text,p_promotion text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  perform id from auth.users where id=p_user_id for share;
  if not found then raise exception 'User not found' using errcode='42501'; end if;
  if exists(select 1 from public.billing_account_deletions where user_id=p_user_id) then
    raise exception 'Account deletion in progress' using errcode='CM409';
  end if;
  return public.claim_billing_checkout_unfrozen(p_user_id,p_plan,p_price,p_promotion);
end $$;
revoke all on function public.claim_billing_checkout(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_billing_checkout(uuid,text,text,text) to service_role;

create table public.deleted_billing_subscriptions (
  subscription_id text primary key,
  user_id uuid not null,
  latest_record jsonb,
  updated_at timestamptz not null default now()
);
alter table public.deleted_billing_subscriptions enable row level security;
revoke all on public.deleted_billing_subscriptions from public,anon,authenticated,service_role;

-- Called both immediately before Auth and inside its DELETE transaction.
create function public.billing_deletion_ready(p_target uuid) returns boolean
language sql security definer set search_path='' as $$
  select exists (
    select 1 from public.billing_account_deletions d where d.user_id=p_target
      and d.cancellation_recorded_at > clock_timestamp()-interval '60 seconds'
      and d.cancellation_result->'cancellation_confirmed'='true'::jsonb
      and d.cancellation_result->'outstanding_invoice_ids'='[]'::jsonb
      and not exists(select 1 from public.billing_checkout_state c where c.user_id=p_target
        and (c.lease_until>clock_timestamp() or c.customer_id is distinct from d.checkout_snapshot->>'customer_id'
          or c.session_id is distinct from d.checkout_snapshot->>'session_id'))
      and not exists(select 1 from public.user_subscriptions s where s.user_id=p_target and s.payment_id like 'SUB\_%' escape '\'
        and not exists(select 1 from public.deleted_billing_subscriptions a
          where a.user_id=p_target and 'SUB_'||a.subscription_id=s.payment_id))
  );
$$;
revoke all on function public.billing_deletion_ready(uuid) from public,anon,authenticated,service_role;

create function public.record_billing_account_cancellation(p_actor uuid,p_target uuid,p_result jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare op public.billing_account_deletions; sub_id text;
begin
  -- Repeat current permission/hierarchy checks and lock the Auth row first.
  perform public.begin_billing_account_deletion(p_actor,p_target);
  select * into op from public.billing_account_deletions where user_id=p_target for update;
  if p_result->>'user_id' is distinct from p_target::text
    or p_result->'cancellation_confirmed' is distinct from 'true'::jsonb
    or jsonb_typeof(p_result->'subscription_ids') is distinct from 'array'
    or jsonb_typeof(p_result->'customer_ids') is distinct from 'array'
    or jsonb_typeof(p_result->'session_ids') is distinct from 'array'
    or jsonb_typeof(p_result->'outstanding_invoice_ids') is distinct from 'array' then
    raise exception 'Invalid cancellation confirmation';
  end if;
  if op.checkout_snapshot is not null and (
    not coalesce(p_result->'customer_ids' ? (op.checkout_snapshot->>'customer_id'),false)
    or not coalesce(p_result->'session_ids' ? (op.checkout_snapshot->>'session_id'),false)) then
    raise exception 'Checkout not reconciled';
  end if;
  for sub_id in select jsonb_array_elements_text(p_result->'subscription_ids') loop
    if sub_id !~ '^sub_[A-Za-z0-9]+$' then raise exception 'Invalid subscription identifier'; end if;
    insert into public.deleted_billing_subscriptions as a(subscription_id,user_id,latest_record)
      values(sub_id,p_target,(select to_jsonb(s) from public.user_subscriptions s where payment_id='SUB_'||sub_id and user_id=p_target))
      on conflict(subscription_id) do update set latest_record=coalesce(excluded.latest_record,a.latest_record),updated_at=now()
      where a.user_id=excluded.user_id;
    if not found then raise exception 'Archived subscription owner mismatch'; end if;
  end loop;
  update public.billing_account_deletions set cancellation_result=p_result,cancellation_recorded_at=clock_timestamp()
    where user_id=p_target;
  insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
    values(p_actor,'billing_account_cancellation_confirmed','auth.users',p_target::text,p_result);
  return public.billing_deletion_ready(p_target);
end $$;
revoke all on function public.record_billing_account_cancellation(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_billing_account_cancellation(uuid,uuid,jsonb) to service_role;

create or replace function public.guard_billing_account_deletion() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if (exists(select 1 from public.billing_checkout_state where user_id=old.id)
    or exists(select 1 from public.user_subscriptions where user_id=old.id and payment_id like 'SUB\_%' escape '\'))
    and not public.billing_deletion_ready(old.id) then
    raise exception 'Billing reconciliation required before account deletion' using errcode='23503';
  end if;
  return old;
end $$;

-- Preserve late-event identity without recreating access after Auth deletion.
create function public.billing_subscription_owner(p_subscription_id text) returns uuid
language sql security definer set search_path='' as $$
  select user_id from public.user_subscriptions where payment_id='SUB_'||p_subscription_id
  union select user_id from public.deleted_billing_subscriptions where subscription_id=p_subscription_id;
$$;
revoke all on function public.billing_subscription_owner(text) from public,anon,authenticated;
grant execute on function public.billing_subscription_owner(text) to service_role;

alter function public.finish_stripe_webhook(text,text,text,uuid,jsonb) rename to finish_stripe_webhook_live_user;
revoke all on function public.finish_stripe_webhook_live_user(text,text,text,uuid,jsonb) from public,anon,authenticated,service_role;
create function public.finish_stripe_webhook(p_event_id text,p_subscription_id text,p_event_type text,p_token uuid,p_record jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare owner_id uuid; live_user uuid; lease public.stripe_subscription_locks;
begin
  if p_record is not null then
    owner_id:=(p_record->>'user_id')::uuid;
    -- Serialize with account deletion before taking the webhook lease row lock.
    select id into live_user from auth.users where id=owner_id for share;
  end if;
  if p_record is null or live_user is not null then
    perform public.finish_stripe_webhook_live_user(p_event_id,p_subscription_id,p_event_type,p_token,p_record);
    return;
  end if;
  select * into lease from public.stripe_subscription_locks where subscription_id=p_subscription_id for update;
  if not found or p_token is null or lease.lease_token is distinct from p_token
    or lease.lease_until is null or lease.lease_until<=clock_timestamp() then raise exception 'Stripe lease lost'; end if;
  if p_record->>'payment_id' is distinct from 'SUB_'||p_subscription_id
    or p_record->>'status' not in ('canceled','incomplete_expired') or p_record->>'status' is null then
    raise exception 'Deleted account billing requires reconciliation';
  end if;
  update public.deleted_billing_subscriptions set latest_record=p_record,updated_at=now()
    where subscription_id=p_subscription_id and user_id=owner_id;
  if not found then raise exception 'Archived subscription owner mismatch'; end if;
  insert into public.stripe_webhook_receipts(event_id,subscription_id,event_type)
    values(p_event_id,p_subscription_id,p_event_type) on conflict(event_id) do nothing;
  update public.stripe_subscription_locks set lease_token=null,lease_until=null where subscription_id=p_subscription_id;
end $$;
revoke all on function public.finish_stripe_webhook(text,text,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.finish_stripe_webhook(text,text,text,uuid,jsonb) to service_role;
create or replace function public.prepare_admin_user_deletion(p_actor uuid,p_target uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor_role text; actor_tabs text[]; target_role text;
begin
  if p_actor is null or p_target is null or p_actor=p_target then
    raise exception 'Invalid deletion target' using errcode='42501';
  end if;
  select role,allowed_tabs into actor_role,actor_tabs from public.admin_profiles where user_id=p_actor;
  if actor_role is distinct from 'super_admin' and
    (actor_role is distinct from 'admin' or not ('users.delete'=any(coalesce(actor_tabs,'{}')))) then
    raise exception 'Deletion permission required' using errcode='42501';
  end if;
  -- Same row-lock order as Auth deletion: user first, then receipt.
  perform id from auth.users where id=p_target for update;
  if not found then
    if exists(select 1 from public.admin_user_deletions where target_user_id=p_target and completed_at is not null) then
      return true;
    end if;
    raise exception 'Target user not found' using errcode='P0002';
  end if;
  select role into target_role from public.admin_profiles where user_id=p_target;
  if target_role is not null and target_role not in ('user','admin','super_admin') then
    raise exception 'Invalid target permissions' using errcode='42501';
  end if;
  if target_role in ('admin','super_admin') and actor_role<>'super_admin' then
    raise exception 'Only super admin may manage administrators' using errcode='42501';
  end if;
  if (exists(select 1 from public.billing_checkout_state where user_id=p_target)
    or exists(select 1 from public.user_subscriptions where user_id=p_target and payment_id like 'SUB\_%' escape '\')) and not public.billing_deletion_ready(p_target) then
    raise exception 'Billing reconciliation required before account deletion' using errcode='23503';
  end if;
  insert into public.admin_user_deletions(target_user_id,requested_by) values(p_target,p_actor)
    on conflict(target_user_id) do update set requested_by=excluded.requested_by,requested_at=now(),completed_at=null;
  insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
    values(p_actor,'delete_user_requested','auth.users',p_target::text,'{"status":"requested"}');
  return false;
end $$;
revoke all on function public.prepare_admin_user_deletion(uuid,uuid) from public,anon,authenticated;
grant execute on function public.prepare_admin_user_deletion(uuid,uuid) to service_role;


