-- Public object delivery bypasses storage.objects RLS. Close that route first.
update storage.buckets set public = false where id = 'district-photos';
drop policy if exists district_photos_public_read on storage.objects;
-- Restrictive guard also neutralizes any older permissive SELECT policies.
-- Only the service client in the visibility-checked photo endpoint may read.
drop policy if exists release_private_district_photos on storage.objects;
create policy release_private_district_photos on storage.objects
  as restrictive for select to anon, authenticated
  using (bucket_id <> 'district-photos');
