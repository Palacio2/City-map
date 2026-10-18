-- Ordinary browser headers cannot forge server audit: the request must have
-- been authenticated by PostgREST as service_role as well as carry an actor
-- attached by verifyAdminUser after verified Auth + MFA + profile checks.
create or replace function public.audit_admin_row_mutation() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  headers jsonb := coalesce(nullif(current_setting('request.headers',true),'')::jsonb,'{}');
  claims jsonb := coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb,'{}');
  actor uuid; old_row jsonb; new_row jsonb; row_id text; changed_keys jsonb;
begin
  if claims->>'role' is distinct from 'service_role' or headers->>'x-citymaps-admin-actor' is null then
    if tg_op='DELETE' then return old; else return new; end if;
  end if;
  actor := (headers->>'x-citymaps-admin-actor')::uuid;
  if not exists(select 1 from public.admin_profiles where user_id=actor and role in ('admin','super_admin')) then
    raise exception 'Active admin required for audit' using errcode='42501';
  end if;
  if tg_op <> 'INSERT' then old_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then new_row := to_jsonb(new); end if;
  if tg_op='UPDATE' and old_row=new_row then return new; end if;
  row_id := coalesce(new_row->>'id',old_row->>'id',new_row->>'user_id',old_row->>'user_id',new_row->>'translation_key',old_row->>'translation_key');
  if row_id is null then raise exception 'Audit record identifier missing'; end if;
  select coalesce(jsonb_agg(key order by key),'[]') into changed_keys
    from jsonb_object_keys(coalesce(new_row,'{}') || coalesce(old_row,'{}')) key
    where (old_row->key) is distinct from (new_row->key);
  -- Record which fields changed without copying contact messages, tokens,
  -- configuration secrets or user content into a second retention store.
  insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
    values(actor,'admin_'||lower(tg_op),tg_table_name,row_id,
      jsonb_build_object('source','server_row_trigger','changed_fields',changed_keys));
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
revoke all on function public.audit_admin_row_mutation() from public,anon,authenticated;

do $$ declare relation text;
begin
  foreach relation in array array['admin_profiles','fields_config','field_groups','translations','scraper_rules','contacts_messages','global_notifications','district_comments'] loop
    execute format('drop trigger if exists release_admin_audit on public.%I',relation);
    execute format('create trigger release_admin_audit after insert or update or delete on public.%I for each row execute function public.audit_admin_row_mutation()',relation);
  end loop;
end $$;
