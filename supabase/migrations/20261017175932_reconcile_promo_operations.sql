alter table public.admin_promo_operations add column if not exists last_checked_at timestamptz;
create or replace function public.pending_promo_operations(p_actor uuid)
returns setof public.admin_promo_operations language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.admin_profiles where user_id=p_actor and
    (role='super_admin' or (role='admin' and 'users.promo_codes'=any(coalesce(allowed_tabs,'{}'))))) then
    raise exception 'Forbidden' using errcode='42501';
  end if;
  -- Only return this administrator's requests. Rotate unresolved entries so
  -- one permanently ambiguous operation does not starve the remainder.
  return query with candidates as (
    select operation_key from public.admin_promo_operations
    where actor_id=p_actor and result is null
    order by last_checked_at nulls first,created_at,operation_key
    limit 3 for update skip locked
  ) update public.admin_promo_operations op set last_checked_at=clock_timestamp()
    from candidates c where op.operation_key=c.operation_key returning op.*;
end $$;
revoke all on function public.pending_promo_operations(uuid) from public,anon,authenticated;
grant execute on function public.pending_promo_operations(uuid) to service_role;
