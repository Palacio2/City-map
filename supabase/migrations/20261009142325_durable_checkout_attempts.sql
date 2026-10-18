create table public.billing_checkout_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 customer_id text unique,
 attempt_id uuid not null default gen_random_uuid(),
 attempt_created_at timestamptz not null default now(),
 plan_key text not null check (plan_key in ('weekly','premium','realtor')),
 price_id text not null,
 promotion_id text check (promotion_id ~ '^promo_[A-Za-z0-9]+$'),
 session_id text unique,
 lease_token uuid,
 lease_until timestamptz
);
alter table public.billing_checkout_state enable row level security;
revoke all on public.billing_checkout_state from public, anon, authenticated;
grant select, insert, update on public.billing_checkout_state to service_role;

create function public.claim_billing_checkout(p_user_id uuid,p_plan text,p_price text,p_promotion text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.billing_checkout_state%rowtype; token uuid:=gen_random_uuid();
begin
 if p_plan not in ('weekly','premium','realtor') or p_price !~ '^price_[A-Za-z0-9]+$' then raise exception 'Invalid plan'; end if;
 if p_promotion is not null and p_promotion !~ '^promo_[A-Za-z0-9]+$' then raise exception 'Invalid promotion'; end if;
 insert into public.billing_checkout_state(user_id,plan_key,price_id,promotion_id) values(p_user_id,p_plan,p_price,p_promotion) on conflict(user_id) do nothing;
 select * into r from public.billing_checkout_state where user_id=p_user_id for update;
 if r.lease_until > clock_timestamp() then return jsonb_build_object('busy',true); end if;
 update public.billing_checkout_state set lease_token=token,lease_until=clock_timestamp()+interval '90 seconds' where user_id=p_user_id returning * into r;
 return to_jsonb(r);
end $$;

create function public.save_billing_checkout(p_user_id uuid,p_token uuid,p_customer text default null,p_session text default null,p_reset_plan text default null,p_reset_price text default null,p_reset_promotion text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.billing_checkout_state%rowtype;
begin
 select * into r from public.billing_checkout_state where user_id=p_user_id for update;
 if not found or p_token is null or r.lease_token is distinct from p_token or r.lease_until <= clock_timestamp() then raise exception 'Checkout lease lost'; end if;
 if p_customer is not null and (p_customer !~ '^cus_[A-Za-z0-9]+$' or (r.customer_id is not null and r.customer_id<>p_customer)) then raise exception 'Customer mismatch'; end if;
 if p_session is not null and (p_session !~ '^cs_[A-Za-z0-9_]+$' or (r.session_id is not null and r.session_id<>p_session)) then raise exception 'Session mismatch'; end if;
 if p_reset_plan is not null then
   if p_reset_promotion is not null and p_reset_promotion !~ '^promo_[A-Za-z0-9]+$' then raise exception 'Invalid promotion'; end if;
   if p_reset_plan not in ('weekly','premium','realtor') or p_reset_price is null or p_reset_price !~ '^price_[A-Za-z0-9]+$' then raise exception 'Invalid reset'; end if;
   -- Backend may reset only after verifying the old session expired or its subscription terminated.
   update public.billing_checkout_state set attempt_id=gen_random_uuid(),attempt_created_at=clock_timestamp(),
     plan_key=p_reset_plan,price_id=p_reset_price,promotion_id=p_reset_promotion,session_id=null where user_id=p_user_id;
 else
   update public.billing_checkout_state set customer_id=coalesce(p_customer,customer_id),session_id=coalesce(p_session,session_id) where user_id=p_user_id;
 end if;
 select * into r from public.billing_checkout_state where user_id=p_user_id;
 return to_jsonb(r);
end $$;
create function public.release_billing_checkout(p_user_id uuid,p_token uuid)
returns void language sql security invoker set search_path='' as $$
 update public.billing_checkout_state set lease_token=null,lease_until=null where user_id=p_user_id and lease_token=p_token;
$$;
revoke all on function public.claim_billing_checkout(uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.save_billing_checkout(uuid,uuid,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.release_billing_checkout(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_billing_checkout(uuid,text,text,text) to service_role;
grant execute on function public.save_billing_checkout(uuid,uuid,text,text,text,text,text) to service_role;
grant execute on function public.release_billing_checkout(uuid,uuid) to service_role;
