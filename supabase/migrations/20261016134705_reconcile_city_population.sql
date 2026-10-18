-- F05: ratings consume the final district population; allocation is separate.
CREATE OR REPLACE FUNCTION public.calculate_district_ratings()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
DECLARE
    max_rating numeric := 10.0;
    min_rating numeric := 1.0;
    

    edu_points numeric := 0;
    med_points numeric := 0;
    trans_points numeric := 0;
    safety_points numeric := 0;
    sports_points numeric := 0;
    culture_points numeric := 0;
    commerce_points numeric := 0;
    util_points numeric := 0;

BEGIN
    IF COALESCE(NEW.population, 0) = 0 THEN
        NEW.education_rating := 0;
        NEW.medicine_rating := 0;
        NEW.transport_rating := 0;
        NEW.safety_rating := 0;
        NEW.sports_rating := 0;
        NEW.culture_leisure_rating := 0;
        NEW.commerce_rating := 0;
        NEW.economics_rating := 0;
        NEW.utilities_quality_rating := 0;
        RETURN NEW;
    END IF;

    -------------------------------------------------------
    -- РОЗРАХУНОК РЕЙТИНГІВ (Множник 1000 на душу населення)
    -------------------------------------------------------
    
    -- 1. ОСВІТА
    edu_points := ((COALESCE(NEW.schools_count, 0) * 2.0 + 
                    COALESCE(NEW.kindergartens_count, 0) * 2.0 + 
                    COALESCE(NEW.universities_count, 0) * 4.0) / NEW.population) * 1000.0;
    NEW.education_rating := ROUND(LEAST(max_rating, GREATEST(min_rating, edu_points * 2.0)), 1);

    -- 2. МЕДИЦИНА
    med_points := ((COALESCE(NEW.hospitals_count, 0) * 5.0 + 
                    COALESCE(NEW.clinics_count, 0) * 2.0 + 
                    COALESCE(NEW.pharmacies_count, 0) * 1.0 +
                    COALESCE(NEW.vet_clinics_count, 0) * 0.5) / NEW.population) * 1000.0;
    NEW.medicine_rating := ROUND(LEAST(max_rating, GREATEST(min_rating, med_points * 2.0)), 1);

    -- 3. ТРАНСПОРТ
    trans_points := ((COALESCE(NEW.bus_stops_count, 0) * 1.0 + 
                      COALESCE(NEW.tram_stops_count, 0) * 2.5 + 
                      COALESCE(NEW.metro_stations_count, 0) * 10.0 +
                      COALESCE(NEW.bike_rental_stations_count, 0) * 1.0) / NEW.population) * 1000.0;
    NEW.transport_rating := ROUND(LEAST(max_rating, GREATEST(min_rating, trans_points * 1.5)), 1);

    -- 4. БЕЗПЕКА
    safety_points := ((COALESCE(NEW.police_stations_count, 0) * 5.0 + 
                       COALESCE(NEW.cctv_count, 0) * 0.5) / NEW.population) * 1000.0;
    NEW.safety_rating := ROUND(LEAST(max_rating, GREATEST(min_rating, (safety_points * 3.0) - COALESCE(NEW.crime_level, 0))), 1);

    -- 5. СПОРТ
    sports_points := ((COALESCE(NEW.gyms_count, 0) * 2.0 + 
                       COALESCE(NEW.outdoor_gyms_count, 0) * 1.0 + 
                       COALESCE(NEW.swimming_pools_count, 0) * 3.0 +
                       COALESCE(NEW.sports_facilities_count, 0) * 2.0) / NEW.population) * 1000.0;
    NEW.sports_rating := ROUND(LEAST(max_rating, GREATEST(min_rating, sports_points * 2.0)), 1);

    -- 6. КУЛЬТУРА ТА ВІДПОЧИНОК
    culture_points := ((COALESCE(NEW.parks_count, 0) * 2.0 + 
                        COALESCE(NEW.playgrounds_count, 0) * 1.0 + 
                        COALESCE(NEW.cafes_restaurants_count, 0) * 0.5 +
                        COALESCE(NEW.cinemas_count, 0) * 3.0 +
                        COALESCE(NEW.theaters_count, 0) * 4.0 +
                        COALESCE(NEW.museums_count, 0) * 3.0 +
                        COALESCE(NEW.libraries_count, 0) * 1.0 +
                        COALESCE(NEW.churches_count, 0) * 1.0) / NEW.population) * 1000.0;
    NEW.culture_leisure_rating := ROUND(LEAST(max_rating, GREATEST(min_rating, culture_points * 1.5)), 1);

    -- 7. КОМЕРЦІЯ ТА ПОСЛУГИ
    commerce_points := ((COALESCE(NEW.grocery_stores_count, 0) * 1.0 + 
                         COALESCE(NEW.shopping_malls_count, 0) * 5.0 + 
                         COALESCE(NEW.parcel_lockers_count, 0) * 0.5 +
                         COALESCE(NEW.beauty_salons_count, 0) * 0.5 +
                         COALESCE(NEW.banks_atms_count, 0) * 0.5) / NEW.population) * 1000.0;
    NEW.commerce_rating := ROUND(LEAST(max_rating, GREATEST(min_rating, commerce_points * 1.0)), 1);

    -- 8. ЕКОНОМІКА
    IF COALESCE(NEW.average_salary, 0) > 0 THEN
        NEW.economics_rating := ROUND(LEAST(max_rating, GREATEST(min_rating, NEW.average_salary / 1400.0)), 1);
    ELSE
        NEW.economics_rating := 0;
    END IF;

    -- 9. КОМУНАЛКА
    util_points := (
        (CASE WHEN NEW.has_water_supply THEN 2 ELSE 0 END) +
        (CASE WHEN NEW.has_heating THEN 2 ELSE 0 END) +
        (CASE WHEN NEW.has_electricity THEN 2 ELSE 0 END) +
        (CASE WHEN NEW.has_gas_supply THEN 2 ELSE 0 END) +
        (CASE WHEN NEW.has_waste_removal THEN 2 ELSE 0 END)
    );
    NEW.utilities_quality_rating := ROUND(LEAST(max_rating, GREATEST(min_rating, util_points)), 1);

    RETURN NEW;
END;
$function$
;
drop trigger if exists update_district_ratings_trigger on public.district_filter_data;
create trigger update_district_ratings_trigger before insert or update on public.district_filter_data
  for each row execute function public.calculate_district_ratings();

-- Preserve the former MAX(city_population) interpretation only for the initial
-- import. Later explicit changes replace the canonical value, including decreases.
create table if not exists public.city_population_totals (
  city_id uuid primary key references public.cities(id) on delete cascade,
  population bigint not null check(population>=0),
  updated_at timestamptz not null default now()
);
alter table public.city_population_totals enable row level security;
revoke all on public.city_population_totals from public,anon,authenticated,service_role;
grant select on public.city_population_totals to service_role;
insert into public.city_population_totals(city_id,population)
  select d.city_id,round(max(f.city_population))::bigint
  from public.district_filter_data f join public.districts d on d.id=f.district_id
  -- Legacy GUS failures wrote zero; do not turn those into a canonical total.
  where d.city_id is not null and f.city_population>0
  group by d.city_id on conflict(city_id) do nothing;

create or replace function public.reconcile_city_population(p_city uuid) returns void
language plpgsql security definer set search_path='' as $$
declare total bigint;
begin
  if p_city is null then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('city-population:'||p_city::text,0));
  select population into total from public.city_population_totals where city_id=p_city;
  if not found then return; end if;
  -- Largest remainders keep the sum exact, with a stable district-id tie break.
  -- With no residential area we cannot allocate a city population: use zero,
  -- rather than retain stale district estimates from a previous denominator.
  with areas as (
    select f.district_id,greatest(coalesce(f.residential_area_sqm,0),0)::numeric area
    from public.district_filter_data f join public.districts d on d.id=f.district_id
    where d.city_id=p_city
  ), shares as (
    select district_id,coalesce(total*area/nullif(sum(area) over(),0),0) quota from areas
  ), ranked as (
    select district_id,floor(quota) base,
      row_number() over(order by quota-floor(quota) desc,district_id) priority,
      sum(floor(quota)) over() allocated, sum(quota) over() total_quota
    from shares
  ), allocation as (
    select district_id,base+case when total_quota>0 and priority<=total-allocated then 1 else 0 end population
    from ranked
  )
  update public.district_filter_data f set population=a.population,city_population=total
    from allocation a where f.district_id=a.district_id
      and (f.population is distinct from a.population or f.city_population is distinct from total);
end $$;

create or replace function public.capture_city_population() returns trigger
language plpgsql security definer set search_path='' as $$
declare city uuid;
begin
  if pg_trigger_depth()>1 then return new; end if;
  if new.residential_area_sqm<0 or new.residential_area_sqm::text in ('NaN','Infinity','-Infinity') then
    raise exception 'Invalid residential area';
  end if;
  select city_id into city from public.districts where id=new.district_id;
  if city is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('city-population:'||city::text,0));
  if new.city_population is not null and (tg_op='INSERT' or new.city_population is distinct from old.city_population) then
    if new.city_population<0 or new.city_population<>trunc(new.city_population) then raise exception 'Invalid city population'; end if;
    insert into public.city_population_totals(city_id,population) values(city,new.city_population)
      on conflict(city_id) do update set population=excluded.population,updated_at=now();
  end if;
  return new;
end $$;

create or replace function public.refresh_city_population_after_metrics() returns trigger
language plpgsql security definer set search_path='' as $$
declare city uuid;
begin
  if pg_trigger_depth()>1 then return null; end if;
  for city in select distinct d.city_id from public.districts d
    where d.id in (case when tg_op<>'DELETE' then new.district_id end,case when tg_op<>'INSERT' then old.district_id end)
    order by d.city_id
  loop perform public.reconcile_city_population(city); end loop;
  return null;
end $$;

create or replace function public.refresh_city_population_after_district() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='UPDATE' and new.city_id is not distinct from old.city_id then return null; end if;
  perform public.reconcile_city_population(old.city_id);
  if tg_op='UPDATE' then
    -- A moved district must not copy the former city's total into its new city.
    update public.district_filter_data set city_population=null,population=0 where district_id=new.id;
    perform public.reconcile_city_population(new.city_id);
  end if;
  return null;
end $$;

revoke all on function public.reconcile_city_population(uuid),public.capture_city_population(),
  public.refresh_city_population_after_metrics(),public.refresh_city_population_after_district(),
  public.calculate_district_ratings() from public,anon,authenticated;
drop trigger if exists release_capture_population on public.district_filter_data;
create trigger release_capture_population before insert or update on public.district_filter_data
  for each row execute function public.capture_city_population();
drop trigger if exists release_refresh_population on public.district_filter_data;
create trigger release_refresh_population after insert or update or delete on public.district_filter_data
  for each row execute function public.refresh_city_population_after_metrics();
drop trigger if exists release_refresh_district_population on public.districts;
create trigger release_refresh_district_population after delete or update of city_id on public.districts
  for each row execute function public.refresh_city_population_after_district();

-- Refresh existing estimates and their ratings using the completed data set.
do $$ declare city uuid; begin
  for city in select city_id from public.city_population_totals order by city_id
  loop perform public.reconcile_city_population(city); end loop;
end $$;
