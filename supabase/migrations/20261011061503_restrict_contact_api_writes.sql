-- Deploy the validated submit-contact-form handler before applying this migration.
-- Both contact and feedback administration already write through service-role APIs.
revoke insert on public.contacts_messages from public, anon, authenticated;
do $$
declare column_name text;
begin
  for column_name in select attname from pg_attribute
    where attrelid = 'public.contacts_messages'::regclass and attnum > 0 and not attisdropped
  loop
    execute format('revoke insert (%I) on public.contacts_messages from public, anon, authenticated', column_name);
  end loop;
end;
$$;
drop policy if exists "Anyone can send a message" on public.contacts_messages;
drop policy if exists "public_send_message" on public.contacts_messages;
create policy contact_api_only_insert on public.contacts_messages as restrictive
  for insert to anon, authenticated with check (false);
