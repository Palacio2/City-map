-- Service-only: the Edge gate verifies the session and MFA; this transaction
-- rechecks the current profile, scope and action permissions under a row lock.
create or replace function public.admin_geography_action(p_actor uuid, p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  profile public.admin_profiles; permissions text[]; city uuid; district uuid;
  item jsonb; result jsonb; created jsonb; changed uuid[] := '{}';
  label text; target text; record text; matches integer; n integer := 0;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'Invalid geography payload'; end if;
  select * into profile from public.admin_profiles where user_id=p_actor for update;
  if not found or profile.role is null or profile.role not in ('admin','super_admin') then raise exception 'Forbidden: Admin required' using errcode='42501'; end if;
  permissions := case p_action
    when 'create_country' then array['manual.create.country']
    when 'create_city' then array['manual.create.city']
    when 'create_district' then array['manual.create.district']
    when 'create_districts' then array['manual.create.district','parser.create_districts']
    when 'delete_city' then array['manual.delete']
    when 'delete_district' then array['manual.delete','parser.delete_districts']
    when 'import_geojson' then array['manual.gis','parser.import_geojson']
    when 'delete_country' then array[]::text[]
    else null end;
  if permissions is null then raise exception 'Invalid geography action'; end if;
  if profile.role <> 'super_admin' and (p_action='delete_country' or not(coalesce(profile.allowed_tabs,'{}') && permissions)) then
    raise exception 'Forbidden: Missing geography permission' using errcode='42501';
  end if;

  if p_action in ('create_district','create_districts','import_geojson') then city := (p_payload->>'cityId')::uuid;
  elsif p_action='delete_city' then city := (p_payload->>'id')::uuid;
  elsif p_action='delete_district' then
    district := (p_payload->>'districtId')::uuid;
    select city_id into city from public.districts where id=district;
    if not found then raise exception 'District not found'; end if;
  end if;
  if p_action in ('create_district','create_districts','import_geojson','delete_city','delete_district') then
    if city is null or (profile.role <> 'super_admin' and not(city=any(coalesce(profile.assigned_cities,'{}')))) then
      raise exception 'Forbidden: City outside assigned scope' using errcode='42501';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('city-population:'||city::text,0));
    perform 1 from public.cities where id=city;
    if not found then raise exception 'City not found'; end if;
  end if;

  if p_action in ('create_country','create_city','create_district') then
    if jsonb_typeof(p_payload->'name') is distinct from 'string' then raise exception 'Invalid geography name'; end if;
    label := btrim(p_payload->>'name');
    if length(label) not between 1 and 200 then raise exception 'Invalid geography name'; end if;
  end if;

  if p_action='create_country' then
    insert into public.countries(name) values(label) returning to_jsonb(countries.*) into result;
    target := 'countries'; record := result->>'id';
  elsif p_action='create_city' then
    insert into public.cities(name,country_id) values(label,(p_payload->>'countryId')::uuid) returning to_jsonb(cities.*) into result;
    if profile.role <> 'super_admin' then
      update public.admin_profiles set assigned_cities=array_append(coalesce(assigned_cities,'{}'),(result->>'id')::uuid) where user_id=p_actor;
    end if;
    target := 'cities'; record := result->>'id';
  elsif p_action='create_district' then
    insert into public.districts(name,city_id) values(label,city) returning to_jsonb(districts.*) into result;
    target := 'districts'; record := result->>'id';
  elsif p_action='create_districts' then
    if jsonb_typeof(p_payload->'names') is distinct from 'array' or jsonb_array_length(p_payload->'names') not between 1 and 1000 then raise exception 'Invalid district names'; end if;
    for item in select value from jsonb_array_elements(p_payload->'names') loop
      label := btrim(item #>> '{}');
      if jsonb_typeof(item)<>'string' or length(label) not between 1 and 200 then raise exception 'Invalid district name'; end if;
      insert into public.districts(name,city_id) values(label,city)
        on conflict(name,city_id) do update set name=excluded.name returning to_jsonb(districts.*) into created;
      if result is null then result := created; end if;
      changed := array_append(changed,(created->>'id')::uuid);
    end loop;
    target := 'districts'; record := city::text;
  elsif p_action='delete_country' then
    -- Keep the same advisory-lock ordering as population updates.
    for city in select id from public.cities where country_id=(p_payload->>'id')::uuid order by id loop
      perform pg_advisory_xact_lock(hashtextextended('city-population:'||city::text,0));
    end loop;
    delete from public.countries where id=(p_payload->>'id')::uuid returning to_jsonb(countries.*) into created;
    if not found then raise exception 'Country not found'; end if;
    target := 'countries'; record := created->>'id'; result := '{"success":true}';
  elsif p_action='delete_city' then
    delete from public.cities where id=city returning to_jsonb(cities.*) into created;
    if not found then raise exception 'City not found'; end if;
    target := 'cities'; record := city::text; result := '{"success":true}';
  elsif p_action='delete_district' then
    delete from public.districts where id=district and city_id=city returning to_jsonb(districts.*) into created;
    if not found then raise exception 'District changed; retry'; end if;
    target := 'districts'; record := district::text; result := '{"success":true}';
  elsif p_action='import_geojson' then
    if jsonb_typeof(p_payload->'features') is distinct from 'array' or jsonb_array_length(p_payload->'features') > 1000 then raise exception 'Invalid GeoJSON batch'; end if;
    for item in select value from jsonb_array_elements(p_payload->'features') loop
      if jsonb_typeof(item->'name') is distinct from 'string' then raise exception 'Invalid GeoJSON name'; end if;
      select count(*), (array_agg(id order by id))[1] into matches,district from public.districts where city_id=city and lower(name)=lower(btrim(item->>'name'));
      if matches=0 then continue; end if;
      if matches>1 or district=any(changed) then raise exception 'Ambiguous or duplicate GeoJSON district'; end if;
      if jsonb_typeof(item->'geojson') is distinct from 'object' then raise exception 'Invalid GeoJSON'; end if;
      insert into public.district_geo_data(district_id,geojson) values(district,item->'geojson')
        on conflict(district_id) do update set geojson=excluded.geojson;
      changed := array_append(changed,district); n := n+1;
    end loop;
    target := 'district_geo_data'; record := city::text; result := jsonb_build_object('success',true,'count',n);
  end if;
  insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
    values(p_actor,p_action,target,record,jsonb_build_object('result',result,'changed_district_ids',changed,
      'deleted',case when p_action in ('delete_country','delete_city','delete_district') then created else null end));
  return result;
end $$;
revoke all on function public.admin_geography_action(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.admin_geography_action(uuid,text,jsonb) to service_role;
