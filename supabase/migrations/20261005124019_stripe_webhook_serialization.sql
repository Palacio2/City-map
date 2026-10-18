-- Short database transactions; no database lock is held during Stripe HTTP I/O.
create table public.stripe_webhook_receipts (
  event_id text primary key,
  subscription_id text not null,
  event_type text not null,
  processed_at timestamptz not null default now()
);
create table public.stripe_subscription_locks (
  subscription_id text primary key,
  lease_token uuid,
  lease_until timestamptz
);
alter table public.stripe_webhook_receipts enable row level security;
alter table public.stripe_subscription_locks enable row level security;
revoke all on public.stripe_webhook_receipts, public.stripe_subscription_locks from public, anon, authenticated;
grant select, insert, update, delete on public.stripe_webhook_receipts, public.stripe_subscription_locks to service_role;

create function public.claim_stripe_webhook(p_event_id text, p_subscription_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_token uuid := gen_random_uuid(); v_claim uuid;
begin
  if p_event_id is null or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or p_subscription_id is null or p_subscription_id !~ '^sub_[A-Za-z0-9]+$' then
    raise exception 'Invalid Stripe identifiers';
  end if;
  if exists (select 1 from public.stripe_webhook_receipts where event_id = p_event_id) then
    return jsonb_build_object('state', 'duplicate');
  end if;
  insert into public.stripe_subscription_locks as l (subscription_id, lease_token, lease_until)
    values (p_subscription_id, v_token, clock_timestamp() + interval '90 seconds')
    on conflict (subscription_id) do update set lease_token = excluded.lease_token, lease_until = excluded.lease_until
    where l.lease_until is null or l.lease_until <= clock_timestamp()
    returning lease_token into v_claim;
  if v_claim is null then return jsonb_build_object('state', 'busy'); end if;
  return jsonb_build_object('state', 'claimed', 'token', v_claim);
end;
$$;

create function public.finish_stripe_webhook(p_event_id text, p_subscription_id text, p_event_type text, p_token uuid, p_record jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare v_lock public.stripe_subscription_locks%rowtype; v_owner uuid;
begin
  select * into v_lock from public.stripe_subscription_locks where subscription_id = p_subscription_id for update;
  if not found or v_lock.lease_token is distinct from p_token or p_token is null
      or v_lock.lease_until <= clock_timestamp() then raise exception 'Stripe lease lost'; end if;
  if not exists (select 1 from public.stripe_webhook_receipts where event_id = p_event_id) then
    if p_record is not null then
      if p_record->>'payment_id' is distinct from 'SUB_' || p_subscription_id
        or p_record->>'user_id' is null
        or p_record->>'plan_name' is null
        or p_record->>'plan_name' not in ('weekly', 'premium', 'realtor')
        or p_record->>'status' is null
        or p_record->>'starts_at' is null or p_record->>'ends_at' is null
        or (p_record->>'ends_at')::timestamptz <= (p_record->>'starts_at')::timestamptz then
        raise exception 'Invalid subscription record';
      end if;
      select user_id into v_owner from public.user_subscriptions where payment_id = 'SUB_' || p_subscription_id for update;
      if found and v_owner is distinct from (p_record->>'user_id')::uuid then raise exception 'Subscription owner mismatch'; end if;
      insert into public.user_subscriptions as s (user_id, payment_id, plan_name, status, starts_at, ends_at, cancel_at, cancelled_at)
        values ((p_record->>'user_id')::uuid, p_record->>'payment_id', p_record->>'plan_name', p_record->>'status',
          (p_record->>'starts_at')::timestamptz, (p_record->>'ends_at')::timestamptz,
          (p_record->>'cancel_at')::timestamptz, (p_record->>'cancelled_at')::timestamptz)
        on conflict (payment_id) do update set plan_name = excluded.plan_name, status = excluded.status,
          starts_at = excluded.starts_at, ends_at = excluded.ends_at,
          cancel_at = excluded.cancel_at, cancelled_at = excluded.cancelled_at
        where s.user_id = excluded.user_id;
      if not found then raise exception 'Subscription owner mismatch'; end if;
    end if;
    insert into public.stripe_webhook_receipts (event_id, subscription_id, event_type) values (p_event_id, p_subscription_id, p_event_type);
  end if;
  update public.stripe_subscription_locks set lease_token = null, lease_until = null where subscription_id = p_subscription_id;
end;
$$;

create function public.release_stripe_webhook(p_subscription_id text, p_token uuid)
returns void language sql security invoker set search_path = '' as $$
  update public.stripe_subscription_locks set lease_token = null, lease_until = null
  where subscription_id = p_subscription_id and lease_token = p_token;
$$;
revoke all on function public.claim_stripe_webhook(text,text) from public, anon, authenticated;
revoke all on function public.finish_stripe_webhook(text,text,text,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.release_stripe_webhook(text,uuid) from public, anon, authenticated;
grant execute on function public.claim_stripe_webhook(text,text) to service_role;
grant execute on function public.finish_stripe_webhook(text,text,text,uuid,jsonb) to service_role;
grant execute on function public.release_stripe_webhook(text,uuid) to service_role;
