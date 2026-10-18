create table if not exists public.admin_promo_operations (
  operation_key text primary key,
  actor_id uuid not null,
  action text not null check(action in ('create_promo','delete_promo')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  result jsonb,
  completed_at timestamptz
);
alter table public.admin_promo_operations enable row level security;
revoke all on public.admin_promo_operations from public,anon,authenticated,service_role;

create or replace function public.prepare_promo_operation(p_actor uuid,p_key text,p_action text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare op public.admin_promo_operations;
begin
  if not exists(select 1 from public.admin_profiles where user_id=p_actor and
    (role='super_admin' or (role='admin' and 'users.promo_codes'=any(coalesce(allowed_tabs,'{}'))))) then
    raise exception 'Forbidden' using errcode='42501';
  end if;
  if p_key is null or length(p_key)>150 or p_action is null or p_action not in ('create_promo','delete_promo')
    or p_payload is null or jsonb_typeof(p_payload)<>'object' then
    raise exception 'Invalid operation' using errcode='22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('promo-operation:'||p_key,0));
  select * into op from public.admin_promo_operations where operation_key=p_key for update;
  if found then
    if op.actor_id<>p_actor or op.action<>p_action or op.payload<>p_payload then
      raise exception 'Operation identity conflict' using errcode='CM409';
    end if;
    if op.result is not null then return op.result; end if;
    -- Stripe may forget idempotency keys after 24h. Leave a margin and require
    -- reconciliation instead of risking a second coupon/promotion creation.
    if op.action='create_promo' and op.created_at<now()-interval '23 hours' then
      raise exception 'Operation needs reconciliation' using errcode='CM409';
    end if;
    return null;
  end if;
  insert into public.admin_promo_operations(operation_key,actor_id,action,payload) values(p_key,p_actor,p_action,p_payload);
  insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
    values(p_actor,'stripe_promo_requested','stripe',p_key,jsonb_build_object('action',p_action,'status','requested'));
  return null;
end $$;

create or replace function public.complete_promo_operation(p_actor uuid,p_key text,p_result jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare op public.admin_promo_operations;
begin
  select * into op from public.admin_promo_operations where operation_key=p_key for update;
  if not found or op.actor_id is distinct from p_actor then
    raise exception 'Unknown operation' using errcode='42501';
  end if;
  if p_result is null or jsonb_typeof(p_result)<>'object' or p_result->>'success' is distinct from 'true' then
    raise exception 'Invalid result' using errcode='22023';
  end if;
  if op.result is not null then
    if op.result<>p_result then raise exception 'Result conflict' using errcode='CM409'; end if;
    return;
  end if;
  -- Recording the already executed result remains possible after permission
  -- revocation. This RPC cannot authorize or execute a Stripe operation.
  update public.admin_promo_operations set result=p_result,completed_at=now() where operation_key=p_key;
  insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
    values(p_actor,case when op.action='create_promo' then 'CREATE_PROMO_CODE' else 'DISABLE_PROMO_CODE' end,
      'stripe',p_key,p_result);
end $$;
revoke all on function public.prepare_promo_operation(uuid,text,text,jsonb),public.complete_promo_operation(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.prepare_promo_operation(uuid,text,text,jsonb),public.complete_promo_operation(uuid,text,jsonb) to service_role;
