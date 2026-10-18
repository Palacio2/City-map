-- Deploy protected district/geo/favorites/tracked/AI handlers before this cutover.
-- Tariff rules are enforced by Edge; raw REST/GraphQL reads cannot enforce column rules.
revoke all on public.district_filter_data, public.district_geo_data from public, anon, authenticated;

-- Table REVOKE does not remove independent column grants.
do $$
declare t text; columns text;
begin
  foreach t in array array['district_filter_data', 'district_geo_data'] loop
    select string_agg(quote_ident(attname), ', ') into columns
    from pg_attribute where attrelid = format('public.%I', t)::regclass
      and attnum > 0 and not attisdropped;
    execute format('revoke select (%1$s), insert (%1$s), update (%1$s), references (%1$s) on public.%2$I from public, anon, authenticated', columns, t);
  end loop;
end $$;

alter table public.district_filter_data enable row level security;
alter table public.district_geo_data enable row level security;
drop policy if exists "Allow public read access for filter data" on public.district_filter_data;
drop policy if exists "Allow public read access for geo data" on public.district_geo_data;
drop policy if exists "Allow public read access for geography" on public.district_geo_data;

-- Fail safely even if a later tool accidentally grants SELECT again.
create policy raw_filter_data_server_only on public.district_filter_data
  as restrictive for all to anon, authenticated using (false) with check (false);
create policy raw_geo_data_server_only on public.district_geo_data
  as restrictive for all to anon, authenticated using (false) with check (false);
