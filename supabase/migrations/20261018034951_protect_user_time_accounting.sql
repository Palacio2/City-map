-- The only direct user_stats mutation used by the browser is consent upsert.
-- Counter writes belong to validated RPCs/triggers, not editable profile data.
alter table public.user_stats enable row level security;
revoke all on public.user_stats from public,anon,authenticated;
do $$ declare cols text; policy_row record; begin
  select string_agg(format('%I',attname),',') into cols from pg_attribute
    where attrelid='public.user_stats'::regclass and attnum>0 and not attisdropped;
  execute format('revoke insert (%1$s), update (%1$s), references (%1$s) on public.user_stats from public,anon,authenticated',cols);
  for policy_row in select policyname from pg_policies where schemaname='public' and tablename='user_stats' loop
    execute format('drop policy %I on public.user_stats',policy_row.policyname);
  end loop;
end $$;
grant select on public.user_stats to authenticated;
grant insert(user_id,is_terms_accepted,terms_accepted_at),update(user_id,is_terms_accepted,terms_accepted_at)
  on public.user_stats to authenticated;
grant all on public.user_stats to service_role;
create policy user_stats_owner_read on public.user_stats for select to authenticated using(user_id=(select auth.uid()));
create policy user_stats_owner_consent_insert on public.user_stats for insert to authenticated with check(user_id=(select auth.uid()));
create policy user_stats_owner_consent_update on public.user_stats for update to authenticated
  using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

-- One server clock per account: multiple tabs and both legacy endpoints share
-- the same serialized allowance. Browser clients cannot reset this clock.
create table if not exists public.user_time_receipts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_recorded_at timestamptz not null
);
alter table public.user_time_receipts enable row level security;
revoke all on public.user_time_receipts from public,anon,authenticated,service_role;

create or replace function public.increment_user_time(seconds_add integer)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); previous_time timestamptz; observed_time timestamptz; credit integer;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if seconds_add is null or seconds_add<1 or seconds_add>600 then
    raise exception 'Time increment must be between 1 and 600 seconds' using errcode='22023';
  end if;
  -- The first observation can report one bounded interval, never unbounded history.
  insert into public.user_time_receipts(user_id,last_recorded_at)
    values(actor,clock_timestamp()-interval '600 seconds') on conflict(user_id) do nothing;
  select last_recorded_at into previous_time from public.user_time_receipts where user_id=actor for update;
  observed_time:=clock_timestamp();
  credit:=least(seconds_add,greatest(0,least(600,floor(extract(epoch from observed_time-previous_time)))))::integer;
  if credit=0 then return; end if;
  insert into public.user_stats as s(user_id,total_time_seconds,last_active)
    values(actor,credit,observed_time)
    on conflict(user_id) do update set
      total_time_seconds=least(2147483647,greatest(0,coalesce(s.total_time_seconds,0))::bigint+credit)::integer,
      last_active=observed_time;
  update public.user_time_receipts set last_recorded_at=observed_time where user_id=actor;
end $$;
revoke all on function public.increment_user_time(integer) from public,anon;
grant execute on function public.increment_user_time(integer) to authenticated,service_role;

-- Preserve the existing frontend RPC signature; it uses the same clock/limits.
create or replace function public.update_user_time(seconds integer)
returns void language plpgsql security invoker set search_path='' as $$
begin
  perform public.increment_user_time(seconds);
end $$;
revoke all on function public.update_user_time(integer) from public,anon;
grant execute on function public.update_user_time(integer) to authenticated,service_role;
