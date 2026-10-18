-- Transaction-only fixtures: no Storage API uploads or persistent objects.
begin;
set local statement_timeout = '15s';
select set_config('test.user_id', gen_random_uuid()::text, true);
select set_config('test.country_id', gen_random_uuid()::text, true);
select set_config('test.city_id', gen_random_uuid()::text, true);
select set_config('test.other_city_id', gen_random_uuid()::text, true);
select set_config('test.district_id', gen_random_uuid()::text, true);
select set_config('test.other_district_id', gen_random_uuid()::text, true);
insert into auth.users(id) values (current_setting('test.user_id')::uuid);
insert into public.countries(id, name) values (current_setting('test.country_id')::uuid, 'storage-test-' || current_setting('test.country_id'));
insert into public.cities(id, country_id, name) values
  (current_setting('test.city_id')::uuid, current_setting('test.country_id')::uuid, 'A'),
  (current_setting('test.other_city_id')::uuid, current_setting('test.country_id')::uuid, 'B');
insert into public.districts(id, city_id, name) values
  (current_setting('test.district_id')::uuid, current_setting('test.city_id')::uuid, 'A'),
  (current_setting('test.other_district_id')::uuid, current_setting('test.other_city_id')::uuid, 'B');
insert into public.admin_profiles(user_id, role, assigned_cities, allowed_tabs) values
  (current_setting('test.user_id')::uuid, 'admin', array[current_setting('test.city_id')::uuid], array['manual.edit']);

do $$
begin
  if (select public from storage.buckets where id = 'feedback_images') then
    raise exception 'Feedback bucket is public';
  end if;
  if exists (select 1 from storage.buckets where id in ('feedback_images','district-photos','avatars')
             and (file_size_limit is null or allowed_mime_types is null or 'image/svg+xml' = any(allowed_mime_types))) then
    raise exception 'Missing safe image upload limits';
  end if;
end;
$$;

set local role anon;
select set_config('request.jwt.claims', '{}', true);
do $$
begin
  begin
    insert into storage.objects(bucket_id, name) values ('district-photos', current_setting('test.district_id') || '-1.webp');
    raise exception 'Anonymous district upload allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects(bucket_id, name) values ('feedback_images', 'security-test.jpg');
    raise exception 'Anonymous feedback upload allowed';
  exception when insufficient_privilege then null;
  end;
  if exists (select 1 from storage.objects where bucket_id = 'feedback_images') then
    raise exception 'Anonymous feedback read allowed';
  end if;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('test.user_id'),'role','authenticated')::text, true);
do $$
declare affected integer;
begin
  if not public.can_upload_district_photo(current_setting('test.district_id') || '-1.webp') then
    raise exception 'Authorized city editor denied';
  end if;
  if public.can_upload_district_photo(current_setting('test.other_district_id') || '-1.webp')
     or public.can_upload_district_photo('../' || current_setting('test.district_id') || '-1.webp')
     or public.can_upload_district_photo(current_setting('test.district_id') || '-1.svg') then
    raise exception 'City or path restriction bypassed';
  end if;
  insert into storage.objects(bucket_id, name, owner_id) values
    ('district-photos', current_setting('test.district_id') || '-1.webp', current_setting('test.user_id'));
  begin
    insert into storage.objects(bucket_id, name, owner_id) values
      ('district-photos', current_setting('test.other_district_id') || '-1.webp', current_setting('test.user_id'));
    raise exception 'Foreign city upload allowed';
  exception when insufficient_privilege then null;
  end;
  update storage.objects set name = current_setting('test.district_id') || '-2.webp'
    where bucket_id = 'district-photos' and name = current_setting('test.district_id') || '-1.webp';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'District photo overwrite allowed'; end if;
  insert into storage.objects(bucket_id, name, owner_id) values
    ('feedback_images', 'security-' || current_setting('test.user_id') || '.jpg', current_setting('test.user_id'));
  begin
    insert into storage.objects(bucket_id, name, owner_id) values
      ('feedback_images', 'security-foreign.jpg', gen_random_uuid()::text);
    raise exception 'Foreign owner accepted';
  exception when insufficient_privilege then null;
  end;
  if exists (select 1 from storage.objects where bucket_id = 'feedback_images') then
    raise exception 'Feedback files exposed outside admin API';
  end if;
end;
$$;
reset role;

update public.admin_profiles set allowed_tabs = '{}' where user_id = current_setting('test.user_id')::uuid;
set local role authenticated;
do $$
begin
  if public.can_upload_district_photo(current_setting('test.district_id') || '-1.webp') then
    raise exception 'Editor without action permission allowed';
  end if;
end;
$$;
reset role;
update public.admin_profiles set role = 'user', allowed_tabs = array['manual.edit'] where user_id = current_setting('test.user_id')::uuid;
set local role authenticated;
do $$
begin
  if public.can_upload_district_photo(current_setting('test.district_id') || '-1.webp') then
    raise exception 'Non-admin with injected action permission allowed';
  end if;
end;
$$;
reset role;
update public.admin_profiles set role = 'super_admin' where user_id = current_setting('test.user_id')::uuid;
set local role authenticated;
do $$
begin
  if not public.can_upload_district_photo(current_setting('test.other_district_id') || '-1.webp') then
    raise exception 'Super admin denied valid district';
  end if;
end;
$$;
reset role;
select 'storage_access: passed; all fixtures rolled back' as result;
rollback;
