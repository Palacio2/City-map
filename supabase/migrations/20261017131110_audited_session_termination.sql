create or replace function public.admin_terminate_user_sessions(p_actor uuid,p_target uuid)
returns void language plpgsql security definer set search_path='' as $$
declare actor_role text; actor_tabs text[]; target_role text;
  session_count integer; token_count integer;
begin
  if p_actor is null or p_target is null then
    raise exception 'Actor and target required' using errcode='22023';
  end if;
  -- Serialize permission changes with this operation, in deterministic order.
  perform user_id from public.admin_profiles where user_id in (p_actor,p_target) order by user_id for share;
  select role,allowed_tabs into actor_role,actor_tabs from public.admin_profiles where user_id=p_actor;
  if actor_role is distinct from 'super_admin' and
    (actor_role is distinct from 'admin' or not ('users.terminate'=any(coalesce(actor_tabs,'{}')))) then
    raise exception 'Session termination permission required' using errcode='42501';
  end if;
  select role into target_role from public.admin_profiles where user_id=p_target;
  if target_role is not null and target_role not in ('user','admin','super_admin') then
    raise exception 'Invalid target permissions' using errcode='42501';
  end if;
  if target_role in ('admin','super_admin') and actor_role<>'super_admin' then
    raise exception 'Only super admin may manage administrators' using errcode='42501';
  end if;
  if not exists(select 1 from auth.users where id=p_target) then
    raise exception 'Target user not found' using errcode='P0002';
  end if;
  delete from auth.refresh_tokens where user_id=p_target::text;
  get diagnostics token_count = row_count;
  delete from auth.sessions where user_id=p_target;
  get diagnostics session_count = row_count;
  insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
    values(p_actor,'terminate_sessions','auth.users',p_target::text,
      jsonb_build_object('sessions_deleted',session_count,'refresh_tokens_deleted',token_count));
end $$;
revoke all on function public.admin_terminate_user_sessions(uuid,uuid) from public,anon,authenticated;
grant execute on function public.admin_terminate_user_sessions(uuid,uuid) to service_role;

-- Retire the actor-less path so it cannot bypass the mandatory audit.
create or replace function public.force_logout_user(target_user_id text)
returns void language plpgsql security invoker set search_path='' as $$
begin
  raise exception 'Use audited session termination' using errcode='0A000';
end $$;
revoke all on function public.force_logout_user(text) from public,anon,authenticated,service_role;
