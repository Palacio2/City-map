create table public.ai_request_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  window_start timestamptz not null,
  window_seconds integer not null check (window_seconds in (3600,86400)),
  request_count integer not null default 0 check (request_count >= 0),
  primary key (user_id, window_seconds, window_start)
);
alter table public.ai_request_usage enable row level security;
revoke all on public.ai_request_usage from public, anon, authenticated;
grant select, insert, update, delete on public.ai_request_usage to service_role;

create function public.claim_ai_request(p_user_id uuid, p_hourly_limit integer, p_daily_limit integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  hour_start timestamptz := date_trunc('hour', now() at time zone 'UTC') at time zone 'UTC';
  day_start timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
begin
  if p_user_id is null or p_hourly_limit is null or p_daily_limit is null
    or p_hourly_limit < 1 or p_daily_limit < p_hourly_limit or p_daily_limit > 10000
  then raise exception 'Invalid quota parameters'; end if;
  perform pg_advisory_xact_lock(hashtextextended('city-map:ai:' || p_user_id::text, 0));
  delete from public.ai_request_usage where user_id = p_user_id and window_start < day_start - interval '2 days';
  if exists (select 1 from public.ai_request_usage where user_id = p_user_id and
    ((window_seconds=3600 and window_start=hour_start and request_count >= p_hourly_limit)
     or (window_seconds=86400 and window_start=day_start and request_count >= p_daily_limit)))
  then return false; end if;
  insert into public.ai_request_usage(user_id,window_start,window_seconds,request_count)
  values (p_user_id,hour_start,3600,1),(p_user_id,day_start,86400,1)
  on conflict(user_id,window_seconds,window_start) do update
    set request_count = public.ai_request_usage.request_count + 1;
  return true;
end;
$$;
revoke all on function public.claim_ai_request(uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.claim_ai_request(uuid,integer,integer) to service_role;
