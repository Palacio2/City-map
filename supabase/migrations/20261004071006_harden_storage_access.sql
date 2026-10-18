-- District photos stay publicly viewable, but browser uploads require the
-- existing editor permission and the district's assigned city. No overwrites.
drop policy if exists "Allow Public Upload" on storage.objects;
drop policy if exists "Allow public uploads" on storage.objects;
drop policy if exists "Allow public updates" on storage.objects;
drop policy if exists "Allow Public Download" on storage.objects;
drop policy if exists "Allow public downloads" on storage.objects;

create or replace function public.can_upload_district_photo(object_name text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select coalesce(
    object_name ~ '^[0-9a-fA-F-]{36}-[0-9]+[.]webp$'
    and exists (
      select 1 from public.admin_profiles p
      join public.districts d on d.id::text = lower(left(object_name, 36))
      where p.user_id = (select auth.uid())
        and (
          p.role = 'super_admin'
          or (p.role = 'admin'
              and ('manual.edit' = any(p.allowed_tabs) or 'parser.run_offline' = any(p.allowed_tabs))
              and d.city_id::text = any(p.assigned_cities::text[]))
        )
    ), false
  );
$$;
revoke all on function public.can_upload_district_photo(text) from public, anon;
grant execute on function public.can_upload_district_photo(text) to authenticated;

create policy district_photos_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'district-photos');
create policy district_photos_editor_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'district-photos' and public.can_upload_district_photo(name)
  );

-- Screenshot URLs must not expose private page contents. Existing filenames
-- remain valid; Storage sets owner_id from the uploader's verified JWT.
drop policy if exists "Allow public to view screenshots" on storage.objects;
drop policy if exists "Allow authenticated users to upload screenshots" on storage.objects;
drop policy if exists "Allow admin to delete screenshots" on storage.objects;
create policy feedback_owner_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'feedback_images' and owner_id = (select auth.uid()::text)
  );
-- Admin access and deletion go through admin-feedback-manage, not public URLs.

update storage.buckets
set public = false, file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'feedback_images';
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('district-photos', 'avatars');
