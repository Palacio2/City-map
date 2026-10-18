create table if not exists public.manual_gift_operations (
  request_id uuid primary key,
  actor_id uuid not null,
  target_id uuid not null,
  action text not null check (action in ('grant_subscription', 'revoke_gift')),
  plan text,
  days integer,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.manual_gift_operations enable row level security;
revoke all on public.manual_gift_operations from public, anon, authenticated, service_role;
grant select on public.manual_gift_operations to service_role;

-- Keep the atomic implementation private; all API calls must supply a request ID.
revoke execute on function public.manage_manual_gift(uuid,uuid,text,text,integer) from service_role;
create or replace function public.manage_manual_gift(
  p_request_id uuid, p_actor uuid, p_target uuid, p_action text, p_plan text, p_days integer
) returns jsonb language plpgsql security definer set search_path = public
as $$
declare
  previous public.manual_gift_operations%rowtype;
  result jsonb;
begin
  if p_request_id is null or p_actor is null or p_target is null then
    raise exception 'Missing gift request identity' using errcode = '22023';
  end if;
  -- Hold this lock until the underlying mutation, audit and receipt commit.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift-request:' || p_request_id::text, 0));
  if not exists (select 1 from public.admin_profiles where user_id = p_actor
    and (role = 'super_admin' or (role = 'admin' and 'users.gift_sub' = any(allowed_tabs)))) then
    raise exception 'Gift permission denied' using errcode = '42501';
  end if;
  select * into previous from public.manual_gift_operations where request_id = p_request_id;
  if found then
    if previous.actor_id is distinct from p_actor or previous.target_id is distinct from p_target
      or previous.action is distinct from p_action or previous.plan is distinct from p_plan
      or previous.days is distinct from p_days then
      raise exception 'Gift request identity conflict' using errcode = 'CM409';
    end if;
    return previous.result;
  end if;
  result := public.manage_manual_gift(p_actor, p_target, p_action, p_plan, p_days);
  insert into public.manual_gift_operations(request_id,actor_id,target_id,action,plan,days,result)
    values (p_request_id,p_actor,p_target,p_action,p_plan,p_days,result);
  return result;
end;
$$;
revoke all on function public.manage_manual_gift(uuid,uuid,uuid,text,text,integer) from public, anon, authenticated;
grant execute on function public.manage_manual_gift(uuid,uuid,uuid,text,text,integer) to service_role;
