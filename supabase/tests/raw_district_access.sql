-- Run after protect_raw_district_data, in a disposable transaction.
begin;
do $$
declare t text; r text;
begin
  foreach t in array array['district_filter_data', 'district_geo_data'] loop
    foreach r in array array['anon', 'authenticated'] loop
      if has_table_privilege(r, 'public.' || t, 'SELECT')
        or has_any_column_privilege(r, 'public.' || t, 'SELECT') then
        raise exception 'Raw district data readable by % on %', r, t;
      end if;
      execute format('set local role %I', r);
      begin
        execute format('select * from public.%I limit 1', t);
        raise exception 'Unexpected direct read on %', t;
      exception when insufficient_privilege then null;
      end;
      begin
        execute format('select d.id from public.districts d join public.%I raw on raw.district_id = d.id limit 1', t);
        raise exception 'Unexpected embedded read on %', t;
      exception when insufficient_privilege then null;
      end;
      reset role;
    end loop;
    set local role service_role;
    execute format('select * from public.%I limit 0', t);
    reset role;
  end loop;
end $$;
rollback;
