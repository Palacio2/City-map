-- Initial product decision. Deploy only with protected Edge reads and the REST access cutover.
-- Weekly/Premium includes financial indicators and extended lifestyle/business infrastructure.
-- Basic population, transport, schools, healthcare and daily services remain free.
update public.fields_config set is_premium = true
where field_code in (
  'average_rent_price', 'average_sale_price_sqm', 'average_salary', 'unemployment_rate',
  'utilities_cost_per_sqm', 'coworking_spaces_count', 'gyms_count', 'swimming_pools_count',
  'cinemas_count', 'theaters_count', 'museums_count', 'beauty_salons_count', 'ev_charging_stations_count'
);
-- Do not clear existing Realtor restrictions; its initial differentiation is professional tools.
