-- All geography mutations use the permission-checked Edge/parser APIs.
-- A browser JWT claiming admin must not bypass city/action checks via REST.
revoke insert, update, delete, truncate, references, trigger
  on table public.countries, public.cities, public.districts,
    public.district_filter_data, public.district_geo_data, public.district_photos
  from public, anon, authenticated;

drop policy if exists "Allow admin write access for countries" on public.countries;
drop policy if exists "Allow admin write access for cities" on public.cities;
drop policy if exists "Allow admin write access for districts" on public.districts;
drop policy if exists "Allow admin write access for filter data" on public.district_filter_data;
drop policy if exists "Allow admin write access for geo data" on public.district_geo_data;
drop policy if exists "Allow admin write access for photos" on public.district_photos;

grant select, insert, update, delete on table public.countries, public.cities,
  public.districts, public.district_filter_data, public.district_geo_data, public.district_photos
  to service_role;

-- Parser logs/config/results are exposed only by the owner-scoped backend API.
revoke all privileges on table public.parser_jobs from public, anon, authenticated;
drop policy if exists "Allow admins read access" on public.parser_jobs;
drop policy if exists "Only admins can view parser jobs" on public.parser_jobs;
