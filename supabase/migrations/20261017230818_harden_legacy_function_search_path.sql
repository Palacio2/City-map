-- Legacy routines contain unqualified application table references. Keep their
-- public lookup semantics, but exclude caller schemas and put pg_temp LAST.
-- public must be trusted before it can be used in a privileged search_path.
revoke create on schema public from public,anon,authenticated;

do $$
declare caller text; routine record;
begin
  foreach caller in array array['anon','authenticated'] loop
    if has_schema_privilege(caller,'public','CREATE') then
      raise exception 'Inherited CREATE privilege makes public untrusted for %',caller;
    end if;
  end loop;
  for routine in
    select p.oid::regprocedure as signature from pg_proc p
      join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prokind='f'
      and p.proname=any(array[
        'update_districts_updated_at','update_saved_districts_count','sync_activity_stats',
        'check_license_date','register_comparison_event','update_user_stats_updated_at',
        'activate_license','get_popular_districts_stats','get_district_comments_with_users',
        'is_super_admin','get_top_city_districts','update_updated_at_column',
        'update_user_time','get_popular_district_ids','track_user_activity','get_total_users',
        'track_district_visit','fn_remove_city_from_admins','calculate_district_ratings',
        'increment_user_time','calculate_stats_safely'
      ])
      -- Do not weaken newer routines that already use an explicit, empty path.
      and not exists(select 1 from unnest(coalesce(p.proconfig,'{}')) setting
        where setting like 'search_path=%')
  loop
    execute format('alter function %s set search_path = public, pg_temp',routine.signature);
  end loop;
end $$;
