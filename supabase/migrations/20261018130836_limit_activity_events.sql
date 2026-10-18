-- A bounded amount of quota state per account, shared by every browser tab.
create table if not exists public.activity_event_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_kind text not null check(event_kind in ('visit','comparison')),
  minute_started_at timestamptz not null,
  minute_count integer not null default 0,
  activity_day date not null,
  day_count integer not null default 0,
  last_signature text,
  last_accepted_at timestamptz,
  primary key(user_id,event_kind)
);
alter table public.activity_event_limits enable row level security;
revoke all on public.activity_event_limits from public,anon,authenticated,service_role;

-- Only the validated definer RPCs can consume this allowance. No caller-supplied
-- account, clock, or limit; a failed downstream write rolls back the allowance.
create or replace function public.claim_activity_event(event_kind text,event_signature text)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); quota public.activity_event_limits%rowtype;
  observed timestamptz; utc_day date; minute_cap integer; day_cap integer;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if event_kind is null or event_kind not in ('visit','comparison') or event_signature is null or length(event_signature)>200 then
    raise exception 'Invalid activity event' using errcode='22023';
  end if;
  minute_cap:=case event_kind when 'visit' then 60 else 12 end;
  day_cap:=case event_kind when 'visit' then 1000 else 200 end;
  insert into public.activity_event_limits(user_id,event_kind,minute_started_at,activity_day)
    values(actor,event_kind,clock_timestamp(),(clock_timestamp() at time zone 'UTC')::date)
    on conflict on constraint activity_event_limits_pkey do nothing;
  select q.* into quota from public.activity_event_limits q
    where q.user_id=actor and q.event_kind=claim_activity_event.event_kind for update;
  observed:=clock_timestamp();utc_day:=(observed at time zone 'UTC')::date;
  if quota.last_signature=event_signature and quota.last_accepted_at>observed-interval '30 seconds' then return false; end if;
  if quota.minute_started_at<=observed-interval '1 minute' then
    quota.minute_started_at:=observed;quota.minute_count:=0;
  end if;
  if quota.activity_day<>utc_day then quota.activity_day:=utc_day;quota.day_count:=0; end if;
  if quota.minute_count>=minute_cap or quota.day_count>=day_cap then return false; end if;
  update public.activity_event_limits q set minute_started_at=quota.minute_started_at,
    minute_count=quota.minute_count+1,activity_day=quota.activity_day,day_count=quota.day_count+1,
    last_signature=event_signature,last_accepted_at=observed
    where q.user_id=actor and q.event_kind=claim_activity_event.event_kind;
  return true;
end $$;
revoke all on function public.claim_activity_event(text,text) from public,anon,authenticated,service_role;
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
  if not public.claim_activity_event('visit',district::text) then return; end if;
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
  if not public.claim_activity_event('comparison',(select string_agg(x::text,',' order by x) from unnest(ids) x)) then return; end if;
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

