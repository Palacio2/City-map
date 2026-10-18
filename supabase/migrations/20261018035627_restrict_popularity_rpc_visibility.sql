-- Internal ordering RPC is used only by the protected get-districts backend.
create or replace function public.get_popular_district_ids(city_name text,country_name text)
returns table(id uuid) language sql stable security invoker set search_path='' as $$
  select d.id from public.districts d
  join public.cities c on c.id=d.city_id
  join public.countries co on co.id=c.country_id
  left join public.user_district_visits v on v.district_id=d.id
  where c.name=city_name and co.name=country_name
    and c.is_available is true and d.is_available is true
  group by d.id,d.name
  order by coalesce(sum(v.visit_count),0) desc,d.name asc,d.id asc
  limit 100;
$$;
revoke all on function public.get_popular_district_ids(text,text) from public,anon,authenticated;
grant execute on function public.get_popular_district_ids(text,text) to service_role;

-- Deliberately aggregate-only: no user identifiers or protected district data.
-- Definer is needed to count tracked districts across owners; callers cannot
-- read the underlying tracking rows. Explicit availability is mandatory.
create or replace function public.get_popular_districts_stats()
returns table(name text,city text,country text,count bigint)
language sql stable security definer set search_path='' as $$
  select d.name,c.name,co.name,count(v.id)
  from public.districts d
  join public.cities c on c.id=d.city_id
  join public.countries co on co.id=c.country_id
  join public.user_tracked_districts v on v.district_id=d.id
  where d.is_available is true and c.is_available is true
  group by d.id,d.name,c.id,c.name,co.id,co.name
  order by count(v.id) desc,d.name,c.name,co.name,d.id
  limit 10;
$$;
revoke all on function public.get_popular_districts_stats() from public,anon;
grant execute on function public.get_popular_districts_stats() to authenticated,service_role;

-- Comments already use the Edge endpoint for avatar validation/signing.
-- Close its old direct RPC bypass and remove stale JWT-admin visibility.
create or replace function public.get_district_comments_with_users(p_district_id uuid)
returns table(id uuid,district_id uuid,user_id uuid,content text,rating integer,
  is_hidden boolean,created_at timestamptz,full_name text,avatar_url text)
language sql stable security definer set search_path='' as $$
  select c.id,c.district_id,c.user_id,c.content,c.rating,c.is_hidden,c.created_at,
    u.raw_user_meta_data->>'full_name',u.raw_user_meta_data->>'avatar_url'
  from public.district_comments c
  join auth.users u on u.id=c.user_id
  join public.districts d on d.id=c.district_id
  join public.cities city on city.id=d.city_id
  where c.district_id=p_district_id and c.is_hidden is false
    and d.is_available is true and city.is_available is true
  order by c.created_at desc,c.id;
$$;
revoke all on function public.get_district_comments_with_users(uuid) from public,anon,authenticated;
grant execute on function public.get_district_comments_with_users(uuid) to service_role;

-- Trigger routines are not browser RPCs. Revoking EXECUTE does not detach
-- existing triggers or suppress their normal execution on table mutations.
do $$ declare routine record; begin
  for routine in select p.oid::regprocedure as signature from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prorettype='pg_catalog.trigger'::regtype
  loop execute format('revoke all on function %s from public,anon,authenticated',routine.signature); end loop;
  -- Unused legacy entry point references the absent user_stats.search_count.
  if to_regprocedure('public.track_user_activity(text)') is not null then
    revoke all on function public.track_user_activity(text) from public,anon,authenticated,service_role;
  end if;
end $$;
