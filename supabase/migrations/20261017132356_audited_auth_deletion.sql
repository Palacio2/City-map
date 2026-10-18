-- Receipt survives the target account. It records a request, not permission
-- to execute a deletion later: each retry must pass current authorization.
create table if not exists public.admin_user_deletions (
  target_user_id uuid primary key,
  requested_by uuid not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.admin_user_deletions enable row level security;
revoke all on public.admin_user_deletions from public,anon,authenticated,service_role;

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
  if exists(select 1 from public.billing_checkout_state where user_id=p_target)
    or exists(select 1 from public.user_subscriptions where user_id=p_target and payment_id like 'SUB\_%' escape '\') then
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

create or replace function public.audit_auth_user_deletion() returns trigger
language plpgsql security definer set search_path='' as $$
declare requester uuid;
begin
  update public.admin_user_deletions set completed_at=now()
    where target_user_id=old.id and completed_at is null returning requested_by into requester;
  -- Auth requests do not provide the verified PostgREST actor context. Record
  -- observed deletion and its prior requester, never claim the latter executed it.
  insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
    values(null,'auth_user_deleted','auth.users',old.id::text,
      jsonb_build_object('status','deleted','source','auth_row_trigger','prior_requested_by',requester));
  return old;
end $$;
revoke all on function public.audit_auth_user_deletion() from public,anon,authenticated,service_role;
drop trigger if exists release_auth_user_delete_audit on auth.users;
create trigger release_auth_user_delete_audit after delete on auth.users
  for each row execute function public.audit_auth_user_deletion();
