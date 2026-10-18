-- Public configuration is readable, but changes go through permission-checked
-- Edge Functions using service_role. Browser roles must not write directly.
alter table public.field_groups enable row level security;
alter table public.fields_config enable row level security;
alter table public.scraper_rules enable row level security;

revoke all on table public.field_groups, public.fields_config, public.scraper_rules
  from public, anon, authenticated;
grant select on table public.field_groups, public.fields_config to anon, authenticated;
grant all on table public.field_groups, public.fields_config, public.scraper_rules to service_role;

drop policy if exists "Public read access for fields_config" on public.fields_config;
create policy configuration_fields_read on public.fields_config
  for select to anon, authenticated using (true);
create policy configuration_groups_read on public.field_groups
  for select to anon, authenticated using (true);
drop policy if exists "Admins read access for scraper_rules" on public.scraper_rules;

-- No application caller needs runtime DDL. Keep the old signature as an inert
-- tombstone so cached clients cannot execute it, even after accidental regrant.
create or replace function public.add_dynamic_column(col_name text, col_type text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Runtime schema changes are disabled; use a migration'
    using errcode = '0A000';
end;
$$;
revoke all on function public.add_dynamic_column(text, text)
  from public, anon, authenticated, service_role;

-- Only the permission-checked admin endpoint may terminate another session.
-- SECURITY DEFINER is necessary for auth tables; browser roles have no EXECUTE.
create or replace function public.force_logout_user(target_user_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  target_id uuid := target_user_id::uuid;
begin
  if target_id is null then
    raise exception 'target_user_id is required' using errcode = '22023';
  end if;
  delete from auth.sessions where user_id = target_id;
  delete from auth.refresh_tokens where user_id::text = target_id::text;
end;
$$;
revoke all on function public.force_logout_user(text) from public, anon, authenticated;
grant execute on function public.force_logout_user(text) to service_role;

-- Preserve the existing API while enforcing ownership and underlying RLS.
create or replace function public.get_weekly_activity_stats(uid uuid)
returns table(date text, searches integer, comparisons integer)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if auth.uid() is null or uid is distinct from auth.uid() then
    raise exception 'Cannot read another user''s activity' using errcode = '42501';
  end if;
  return query
  select to_char(d.day, 'YYYY-MM-DD'),
         coalesce(l.searches_count, 0)::integer,
         coalesce(l.comparisons_count, 0)::integer
  from generate_series(current_date - interval '6 days', current_date, '1 day') as d(day)
  left join public.user_activity_logs l
    on l.activity_date = d.day::date and l.user_id = uid
  order by d.day;
end;
$$;
revoke all on function public.get_weekly_activity_stats(uuid) from public, anon;
grant execute on function public.get_weekly_activity_stats(uuid) to authenticated;
