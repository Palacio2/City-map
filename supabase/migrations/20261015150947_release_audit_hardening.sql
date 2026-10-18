-- F01: administrative writes go through current-profile/MFA-checked backends.
-- Deploy this migration before the parser backend using the lease RPCs.
revoke insert, update, delete, truncate, references, trigger on public.admin_profiles,
  public.global_notifications, public.contacts_messages from public, anon, authenticated;
revoke select on public.contacts_messages from public, anon, authenticated;
grant all on public.admin_profiles, public.global_notifications, public.contacts_messages to service_role;
revoke all on public.audit_logs, public.ai_system_logs from public,anon,authenticated;
grant all on public.audit_logs, public.ai_system_logs to service_role;
alter table public.audit_logs enable row level security;
alter table public.ai_system_logs enable row level security;
do $$ declare p record; begin
  for p in select tablename, policyname from pg_policies where schemaname='public'
    and (tablename in ('admin_profiles','audit_logs','ai_system_logs') or (tablename in ('district_comments','global_notifications','contacts_messages')
      and (coalesce(qual,'') || coalesce(with_check,'')) ~ '(app_metadata|is_admin|is_super_admin)'))
  loop execute format('drop policy %I on public.%I',p.policyname,p.tablename); end loop;
end $$;

-- F09-F11: atomic acquisition, expiring leases, fenced writes and bounded logs.
alter table public.parser_jobs add column if not exists lease_token uuid;
alter table public.parser_jobs add column if not exists lease_until timestamptz;
create or replace function public.claim_parser_job(p_config jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare job public.parser_jobs;
begin
  perform pg_advisory_xact_lock(hashtextextended('city-map:parser',0));
  update public.parser_jobs set status='failed',error_message='Worker lease expired',completed_at=now()
    where status in ('pending','running') and coalesce(lease_until,started_at+interval '5 minutes',created_at+interval '5 minutes')<=now();
  if exists(select 1 from public.parser_jobs where status in ('pending','running')) then return null; end if;
  insert into public.parser_jobs(city_name,status,config,started_at,lease_token,lease_until)
    values(coalesce(p_config->>'cityName','Unknown'),'running',p_config,now(),gen_random_uuid(),now()+interval '5 minutes') returning * into job;
  return jsonb_build_object('id',job.id,'lease_token',job.lease_token);
end $$;
create or replace function public.update_parser_job(p_id uuid,p_token uuid,p_config jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
  update public.parser_jobs set
    lease_until=now()+interval '5 minutes',
    status=coalesce(p_config->>'status',status),
    config=coalesce(p_config-'leaseToken',config),
    results=case when p_config ? 'results' then p_config->'results' else results end,
    progress=coalesce((p_config->>'progress')::integer,progress),
    error_message=case when p_config is null then error_message else p_config->>'error' end,
    completed_at=case when p_config->>'status' in ('completed','failed') then now() else completed_at end
    where id=p_id and lease_token=p_token and lease_until>now() and status='running';
  if not found then raise exception 'Parser lease lost'; end if;
end $$;
create or replace function public.append_parser_logs(p_id uuid,p_token uuid,p_entries jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
  if jsonb_typeof(p_entries)<>'array' or jsonb_array_length(p_entries)>50 then raise exception 'Invalid log batch'; end if;
  perform 1 from public.parser_jobs where id=p_id and lease_token=p_token for update;
  if not found then raise exception 'Parser log lease mismatch'; end if;
  update public.parser_jobs set logs=(select coalesce(jsonb_agg(value order by ordinal),'[]') from
    (select value,ordinal from jsonb_array_elements(coalesce(logs,'[]')||p_entries) with ordinality t(value,ordinal)
      order by ordinal desc limit 2000) recent) where id=p_id;
end $$;
revoke all on function public.claim_parser_job(jsonb),public.update_parser_job(uuid,uuid,jsonb),public.append_parser_logs(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.claim_parser_job(jsonb),public.update_parser_job(uuid,uuid,jsonb),public.append_parser_logs(uuid,uuid,jsonb) to service_role;
alter table public.admin_profiles enable row level security;
create policy own_admin_profile_read on public.admin_profiles for select to authenticated
  using (user_id = (select auth.uid()));

-- F20: constrain older permissive SELECT policies too.
drop policy if exists release_visible_districts on public.districts;
create policy release_visible_districts on public.districts as restrictive for select to anon, authenticated
  using (is_available = true);
drop policy if exists release_visible_photos on public.district_photos;
create policy release_visible_photos on public.district_photos as restrictive for select to anon, authenticated
  using (exists(select 1 from public.districts d where d.id=district_id and d.is_available));

-- F41: validate configuration at the write boundary.
-- F16: aggregate independent one-to-many relations before combining them.
create or replace view public.popular_cities_view as
select c.id as city_id,c.name as city_name,c.is_available,co.name as country_name,
  (select count(*) from public.districts d where d.city_id=c.id and d.is_available) as districts_count,
  coalesce((select sum(v.visit_count) from public.user_district_visits v
    join public.districts d on d.id=v.district_id where d.city_id=c.id and d.is_available),0) as total_visits
from public.cities c join public.countries co on co.id=c.country_id where c.is_available;

alter table public.fields_config drop constraint if exists release_field_code_valid;
alter table public.fields_config add constraint release_field_code_valid
  check (field_code ~ '^[a-z][a-z0-9_]*$' and is_active is not null and is_premium is not null and is_realtor_only is not null);
create or replace function public.validate_district_field_column() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.field_code ~ '^[a-z][a-z0-9_]*$' and (
    new.field_code in ('id','district_id','created_at','updated_at','last_updated','data_updated_at')
    or not exists(select 1 from pg_catalog.pg_attribute where attrelid='public.district_filter_data'::regclass
      and attname=new.field_code and attnum>0 and not attisdropped and attgenerated='')
  ) then raise exception 'Field requires an existing district metric column' using errcode='23514'; end if;
  return new;
end $$;
revoke all on function public.validate_district_field_column() from public,anon,authenticated;
drop trigger if exists release_field_column on public.fields_config;
create trigger release_field_column before insert or update of field_code,is_active on public.fields_config
  for each row execute function public.validate_district_field_column();

-- F19: also covers direct REST writes.
-- F18: shared durable contact quota, including a global abuse circuit breaker.
create table if not exists public.contact_request_limits (
  id bigint generated always as identity primary key,
  email_hash text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists contact_request_limits_created_idx on public.contact_request_limits(created_at);
alter table public.contact_request_limits enable row level security;
revoke all on public.contact_request_limits from public,anon,authenticated;
create or replace function public.claim_contact_request(p_email text,p_user uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare email_key text;
begin
  if p_email is null or char_length(btrim(p_email)) not between 3 and 254 then return false; end if;
  email_key=encode(sha256(convert_to(lower(btrim(p_email)),'UTF8')),'hex');
  perform pg_advisory_xact_lock(hashtextextended('city-map:contact-quota',0));
  delete from public.contact_request_limits where created_at<now()-interval '1 day';
  if (select count(*) from public.contact_request_limits where created_at>now()-interval '1 hour')>=200
    or (select count(*) from public.contact_request_limits where email_hash=email_key and created_at>now()-interval '1 hour')>=3
    or (p_user is not null and (select count(*) from public.contact_request_limits where user_id=p_user and created_at>now()-interval '1 hour')>=10)
  then return false; end if;
  insert into public.contact_request_limits(email_hash,user_id) values(email_key,p_user);
  return true;
end $$;
revoke all on function public.claim_contact_request(text,uuid) from public,anon,authenticated;
grant execute on function public.claim_contact_request(text,uuid) to service_role;

alter table public.district_comments drop constraint if exists release_comment_length;
alter table public.district_comments add constraint release_comment_length
  check (char_length(btrim(content)) between 1 and 5000) not valid;
create or replace function public.limit_district_comment_writes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or new.user_id is distinct from auth.uid() then
    raise exception 'Comment owner required' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('comment:' || new.user_id::text,0));
  if (select count(*) from public.district_comments where user_id=new.user_id and created_at>now()-interval '1 hour') >= 20 then
    raise exception 'Comment rate limit exceeded' using errcode='P0001';
  end if;
  return new;
end $$;
revoke all on function public.limit_district_comment_writes() from public,anon,authenticated;
drop trigger if exists release_comment_quota on public.district_comments;
create trigger release_comment_quota before insert on public.district_comments
  for each row execute function public.limit_district_comment_writes();

-- F31: retire unused broken RPCs without deleting their definitions.
-- F29: current profile, Auth metadata and audit commit together.
create or replace function public.set_admin_role(p_actor uuid,p_target uuid,p_role text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if p_actor=p_target or p_role not in ('user','admin','super_admin') or p_role is null then raise exception 'Invalid role change'; end if;
  if not exists(select 1 from public.admin_profiles where user_id=p_actor and role='super_admin') then raise exception 'Super admin required'; end if;
  perform 1 from auth.users where id=p_target for update;
  if not found then raise exception 'User not found'; end if;
  insert into public.admin_profiles(user_id,role,allowed_tabs) values(p_target,p_role,array['dashboard'])
    on conflict(user_id) do update set role=excluded.role;
  update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}')||jsonb_build_object('role',p_role),updated_at=now() where id=p_target;
  insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
    values(p_actor,'update_role','admin_profiles',p_target::text,jsonb_build_object('role',p_role));
end $$;
revoke all on function public.set_admin_role(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.set_admin_role(uuid,uuid,text) to service_role;

-- F14/F27: sparse typed upserts and a mandatory audit entry in one transaction.
create or replace function public.write_district_record(p_table text,p_data jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare cols text; updates text; key text;
begin
  if p_table not in ('district_filter_data','district_geo_data','district_photos') or jsonb_typeof(p_data)<>'object' then raise exception 'Invalid district record'; end if;
  for key in select jsonb_object_keys(p_data) loop
    if key='id' or not exists(select 1 from pg_attribute where attrelid=to_regclass('public.'||p_table) and attname=key and attnum>0 and not attisdropped and attgenerated='') then
      raise exception 'Invalid district column: %',key;
    end if;
  end loop;
  select string_agg(format('%I',k),',' order by k),string_agg(format('%I=excluded.%I',k,k),',' order by k) filter(where k<>'district_id')
    into cols,updates from jsonb_object_keys(p_data) k;
  if updates is null then return; end if;
  execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) on conflict(district_id) do update set %s',p_table,cols,cols,p_table,updates) using p_data;
end $$;
create or replace function public.save_district_bundle(p_actor uuid,p_rows jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare item jsonb; district uuid; city uuid; profile public.admin_profiles;
begin
  if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 1000 then raise exception 'Invalid district batch'; end if;
  select * into profile from public.admin_profiles where user_id=p_actor;
  if profile.role not in ('admin','super_admin') or profile.role is null then raise exception 'Admin required'; end if;
  if profile.role<>'super_admin' and not (coalesce(profile.allowed_tabs,'{}') && array['manual.save','parser.run_offline']) then raise exception 'Save permission required'; end if;
  if exists (
    select d.city_id from jsonb_array_elements(p_rows) r
    join public.districts d on d.id=(r->>'district_id')::uuid
    where r->'metrics'->>'city_population' is not null
    group by d.city_id having count(distinct (r->'metrics'->>'city_population')::numeric)>1
  ) then raise exception 'Conflicting city population in batch'; end if;
  -- Acquire city locks before any district/metric row lock. Population refresh
  -- touches sibling rows, so concurrent saves in a city must share this order.
  for city in select distinct d.city_id from jsonb_array_elements(p_rows) r
    join public.districts d on d.id=(r->>'district_id')::uuid
    where d.city_id is not null order by d.city_id
  loop perform pg_advisory_xact_lock(hashtextextended('city-population:'||city::text,0)); end loop;
  for item in select value from jsonb_array_elements(p_rows) order by value->>'district_id' loop
    district=(item->>'district_id')::uuid;
    select city_id into city from public.districts where id=district for update;
    if not found or (profile.role<>'super_admin' and not(city::text=any(coalesce(profile.assigned_cities::text[],'{}')))) then raise exception 'District outside assigned scope'; end if;
    if item ? 'geo' and profile.role<>'super_admin' and not(coalesce(profile.allowed_tabs,'{}') && array['manual.gis','parser.run_offline']) then raise exception 'GIS permission required'; end if;
    if item ? 'base' then
      update public.districts set name=case when item->'base' ? 'name' then item->'base'->>'name' else name end,
        is_available=case when item->'base' ? 'is_available' then (item->'base'->>'is_available')::boolean else is_available end,updated_at=now() where id=district;
    end if;
    if item ? 'geo' then perform public.write_district_record('district_geo_data',(item->'geo')||jsonb_build_object('district_id',district)); end if;
    if item ? 'photo' then perform public.write_district_record('district_photos',(item->'photo')||jsonb_build_object('district_id',district,'is_main',true,'updated_at',now())); end if;
    if item ? 'metrics' then perform public.write_district_record('district_filter_data',(item->'metrics')||jsonb_build_object('district_id',district,'last_updated',now())); end if;
    insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
      values(p_actor,'save_district','districts',district::text,jsonb_build_object('sections',array(select jsonb_object_keys(item))));
  end loop;
end $$;
revoke all on function public.write_district_record(text,jsonb),public.save_district_bundle(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.save_district_bundle(uuid,jsonb) to service_role;

-- F24: replacing the active notification is a single transaction.
create or replace function public.save_global_notification(p_actor uuid,p_action text,p_payload jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('city-map:notifications',0));
  if p_actor is null or jsonb_typeof(p_payload)<>'object' or jsonb_typeof(p_payload->'is_active')<>'boolean' then
    raise exception 'Invalid notification payload';
  end if;
  if p_action='create' then
    if char_length(btrim(coalesce(p_payload->>'message',''))) not between 1 and 500 then raise exception 'Invalid notification message'; end if;
    if exists(select 1 from public.global_notifications where created_by=p_actor and created_at>now()-interval '1 minute') then raise exception 'Notification rate limit exceeded'; end if;
    if (p_payload->>'is_active')::boolean then update public.global_notifications set is_active=false where is_active; end if;
    insert into public.global_notifications(message,type,is_active,created_by)
      values(p_payload->>'message',p_payload->>'type',(p_payload->>'is_active')::boolean,p_actor) returning id into target;
  elsif p_action='update_status' then
    target=(p_payload->>'id')::uuid;
    if not exists(select 1 from public.global_notifications where id=target) then raise exception 'Notification not found'; end if;
    if (p_payload->>'is_active')::boolean then update public.global_notifications set is_active=false where is_active; end if;
    update public.global_notifications set is_active=(p_payload->>'is_active')::boolean where id=target;
  else raise exception 'Invalid notification action'; end if;
  return target;
end $$;
revoke all on function public.save_global_notification(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_global_notification(uuid,text,jsonb) to service_role;

do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('activate_license','check_license_date','get_top_city_districts')
  loop execute format('revoke all on function %s from public, anon, authenticated',f.signature); end loop;
end $$;
