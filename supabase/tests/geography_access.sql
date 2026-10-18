begin;
do $$
declare table_name text; browser_role text; privilege text;
begin
  foreach table_name in array array['countries','cities','districts','district_filter_data','district_geo_data','district_photos'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || table_name)::regclass) then
      raise exception 'RLS disabled: %', table_name;
    end if;
    foreach browser_role in array array['anon','authenticated'] loop
      foreach privilege in array array['INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
        if has_table_privilege(browser_role, 'public.' || table_name, privilege) then
          raise exception '% still has % on %', browser_role, privilege, table_name;
        end if;
      end loop;
      if not has_table_privilege(browser_role, 'public.' || table_name, 'SELECT') then
        raise exception 'Public read accidentally removed: %', table_name;
      end if;
    end loop;
    foreach privilege in array array['SELECT','INSERT','UPDATE','DELETE'] loop
      if not has_table_privilege('service_role', 'public.' || table_name, privilege) then
        raise exception 'Backend access removed: % %', table_name, privilege;
      end if;
    end loop;
  end loop;
  foreach browser_role in array array['anon','authenticated'] loop
    if has_table_privilege(browser_role, 'public.parser_jobs', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') then
      raise exception 'Parser jobs still exposed to %', browser_role;
    end if;
  end loop;
end $$;
set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","app_metadata":{"role":"super_admin"}}';
do $$
begin
  begin
    update public.cities set name = name where false;
    raise exception 'Browser super-admin unexpectedly bypassed mutation API';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
