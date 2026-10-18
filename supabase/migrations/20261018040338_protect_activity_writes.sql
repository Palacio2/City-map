-- Activity rows are server-maintained, never editable counters or JSON stores.
do $$ declare tbl text; cols text; p record; begin
  foreach tbl in array array['user_activity_logs','user_comparison_history','user_district_visits'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('revoke all on public.%I from public,anon,authenticated',tbl);
    select string_agg(format('%I',attname),',') into cols from pg_attribute
      where attrelid=format('public.%I',tbl)::regclass and attnum>0 and not attisdropped;
    execute format('revoke insert (%s),update (%s),references (%s),select (%s) on public.%I from public,anon,authenticated',cols,cols,cols,cols,tbl);
    for p in select policyname from pg_policies where schemaname='public' and tablename=tbl loop
      execute format('drop policy %I on public.%I',p.policyname,tbl);
    end loop;
    execute format('grant select on public.%I to authenticated',tbl);
    execute format('grant all on public.%I to service_role',tbl);
    execute format('create policy activity_owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',tbl);
  end loop;
end $$;

create or replace function public.track_district_visit(district_data jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); district uuid; canonical jsonb; favorite jsonb;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if district_data is null or jsonb_typeof(district_data)<>'object' or octet_length(district_data::text)>4096
    or jsonb_typeof(district_data->'id') is distinct from 'string' then
    raise exception 'Invalid district payload' using errcode='22023';
  end if;
  district:=(district_data->>'id')::uuid;
  select jsonb_build_object('id',d.id,'city',c.name,'country',co.name) into canonical
    from public.districts d join public.cities c on c.id=d.city_id join public.countries co on co.id=c.country_id
    where d.id=district and d.is_available is true and c.is_available is true;
  if canonical is null then raise exception 'District unavailable' using errcode='22023'; end if;
  insert into public.user_district_visits as v(user_id,district_id,visit_count,last_visited_at,district_data)
    values(actor,district,1,now(),canonical) on conflict(user_id,district_id) do update set
    visit_count=least(2147483647,greatest(0,coalesce(v.visit_count,0))::bigint+1)::integer,
    last_visited_at=now(),district_data=excluded.district_data;
  insert into public.user_activity_logs as l(user_id,activity_date,searches_count,comparisons_count)
    values(actor,current_date,1,0) on conflict(user_id,activity_date) do update set
    searches_count=least(2147483647,greatest(0,coalesce(l.searches_count,0))::bigint+1)::integer;
  -- Resolve historical favorites from geography too; never replay old client JSON.
  select jsonb_build_object('id',d.id,'city',c.name,'country',co.name) into favorite
    from public.user_district_visits v join public.districts d on d.id=v.district_id
    join public.cities c on c.id=d.city_id join public.countries co on co.id=c.country_id
    where v.user_id=actor and d.is_available is true and c.is_available is true
    order by v.visit_count desc,v.last_visited_at desc,d.id limit 1;
  insert into public.user_stats as s(user_id,viewed_districts_count,favorite_district,last_active)
    values(actor,1,favorite,now()) on conflict(user_id) do update set
    viewed_districts_count=least(2147483647,greatest(0,coalesce(s.viewed_districts_count,0))::bigint+1)::integer,
    favorite_district=favorite,last_active=now();
end $$;

create or replace function public.register_comparison_event(districts_payload jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); item jsonb; ids uuid[]:='{}'; district uuid; canonical jsonb; result jsonb:='[]';
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if districts_payload is null or jsonb_typeof(districts_payload)<>'array' or octet_length(districts_payload::text)>16384 then
    raise exception 'Invalid comparison payload' using errcode='22023';
  end if;
  if jsonb_array_length(districts_payload) not between 2 and 4 then
    raise exception 'Comparison requires 2 to 4 districts' using errcode='22023';
  end if;
  for item in select value from jsonb_array_elements(districts_payload) loop
    if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'id') is distinct from 'string' then
      raise exception 'Invalid district payload' using errcode='22023';
    end if;
    district:=(item->>'id')::uuid;
    if district=any(ids) then raise exception 'Duplicate district' using errcode='22023'; end if;
    ids:=array_append(ids,district);
    select jsonb_build_object('id',d.id,'city',c.name,'country',co.name) into canonical
      from public.districts d join public.cities c on c.id=d.city_id join public.countries co on co.id=c.country_id
      where d.id=district and d.is_available is true and c.is_available is true;
    if canonical is null then raise exception 'District unavailable' using errcode='22023'; end if;
    result:=result||jsonb_build_array(canonical);
  end loop;
  insert into public.user_comparison_history(user_id,districts_data) values(actor,result);
  insert into public.user_activity_logs as l(user_id,activity_date,searches_count,comparisons_count)
    values(actor,current_date,0,1) on conflict(user_id,activity_date) do update set
    comparisons_count=least(2147483647,greatest(0,coalesce(l.comparisons_count,0))::bigint+1)::integer;
  insert into public.user_stats as s(user_id,comparison_count,last_active) values(actor,1,now())
    on conflict(user_id) do update set
    comparison_count=least(2147483647,greatest(0,coalesce(s.comparison_count,0))::bigint+1)::integer,last_active=now();
end $$;
revoke all on function public.track_district_visit(jsonb),public.register_comparison_event(jsonb) from public,anon;
grant execute on function public.track_district_visit(jsonb),public.register_comparison_event(jsonb) to authenticated,service_role;
