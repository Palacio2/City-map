-- Run against a migrated database. No fixtures or persistent writes are made.
-- Failure raises an exception; the transaction always ends with ROLLBACK.
begin;
set local statement_timeout = '10s';

do $$
declare
  table_name text;
  caller text;
  privilege_name text;
begin
  foreach table_name in array array['field_groups', 'fields_config', 'scraper_rules'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || table_name)::regclass) then
      raise exception 'RLS disabled on %', table_name;
    end if;
    foreach caller in array array['anon', 'authenticated'] loop
      if has_table_privilege(caller, 'public.' || table_name, 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then
        raise exception '% can modify % directly', caller, table_name;
      end if;
    end loop;
    foreach privilege_name in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE'] loop
      if not has_table_privilege('service_role', 'public.' || table_name, privilege_name) then
        raise exception 'Admin backend lost % on %', privilege_name, table_name;
      end if;
    end loop;
  end loop;
  foreach caller in array array['anon', 'authenticated', 'service_role'] loop
    if has_function_privilege(caller, 'public.add_dynamic_column(text,text)', 'EXECUTE') then
      raise exception '% can call runtime DDL', caller;
    end if;
    if has_function_privilege(caller, 'public.force_logout_user(text)', 'EXECUTE') then
      raise exception '% can call retired actor-less session termination', caller;
    end if;
  end loop;
  if not has_function_privilege('service_role', 'public.admin_terminate_user_sessions(uuid,uuid)', 'EXECUTE') then
    raise exception 'Admin backend cannot call audited session termination';
  end if;
  foreach caller in array array['anon', 'authenticated'] loop
    if has_function_privilege(caller, 'public.admin_terminate_user_sessions(uuid,uuid)', 'EXECUTE') then
      raise exception '% can bypass the Edge gate for session termination', caller;
    end if;
  end loop;
  if exists (select 1 from pg_proc where oid in (
    'public.add_dynamic_column(text,text)'::regprocedure,
    'public.get_weekly_activity_stats(uuid)'::regprocedure
  ) and prosecdef) then
    raise exception 'Unnecessary SECURITY DEFINER remains';
  end if;
end;
$$;

select set_config('test.field_groups_count', (select count(*)::text from public.field_groups), true);
select set_config('test.fields_config_count', (select count(*)::text from public.fields_config), true);

set local role anon;
do $$
begin
  if (select count(*) from public.field_groups) <> current_setting('test.field_groups_count')::bigint
     or (select count(*) from public.fields_config) <> current_setting('test.fields_config_count')::bigint then
    raise exception 'Public configuration reads lost rows through RLS';
  end if;
  begin
    perform 1 from public.scraper_rules limit 1;
    raise exception 'Anonymous scraper configuration read was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.fields_config set is_active = is_active where false;
    raise exception 'Anonymous configuration write was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.add_dynamic_column('security_test_never_created', 'text');
    raise exception 'Anonymous DDL call was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.force_logout_user('00000000-0000-0000-0000-000000000001');
    raise exception 'Anonymous logout call was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.get_weekly_activity_stats('00000000-0000-0000-0000-000000000001');
    raise exception 'Anonymous activity read was allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.get_weekly_activity_stats('00000000-0000-0000-0000-000000000001')) <> 7 then
    raise exception 'Own weekly activity must return seven days';
  end if;
  begin
    perform public.get_weekly_activity_stats('00000000-0000-0000-0000-000000000002');
    raise exception 'Foreign activity was readable';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.get_weekly_activity_stats(null);
    raise exception 'NULL owner was accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.force_logout_user('00000000-0000-0000-0000-000000000002');
    raise exception 'User can terminate another session';
  exception when insufficient_privilege then null;
  end;
end;
$$;
-- An administrator must also use the permission-checked Edge API for writes.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated","app_metadata":{"role":"super_admin"}}', true);
do $$
begin
  begin
    update public.fields_config set is_active = is_active where false;
    raise exception 'Admin browser bypassed the write API';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
select 'security_access: passed' as result;
rollback;
