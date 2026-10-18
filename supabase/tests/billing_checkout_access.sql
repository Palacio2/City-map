-- Run in BEGIN/ROLLBACK after migration. No real billing objects.
do $$
declare role_name text; fn text;
begin
 foreach role_name in array array['anon','authenticated'] loop
  if has_table_privilege(role_name,'public.billing_checkout_state','SELECT,INSERT,UPDATE,DELETE') then raise exception 'Browser table access'; end if;
  foreach fn in array array['claim_billing_checkout(uuid,text,text,text)','save_billing_checkout(uuid,uuid,text,text,text,text,text)','release_billing_checkout(uuid,uuid)'] loop
   if has_function_privilege(role_name,'public.'||fn,'EXECUTE') then raise exception 'Browser RPC access'; end if;
  end loop;
 end loop;
 if not(select relrowsecurity from pg_class where oid='public.billing_checkout_state'::regclass) then raise exception 'Missing RLS'; end if;
end $$;
insert into auth.users(id) values('faab1411-822d-4100-9f34-7a31a2511e13');
set local role service_role;
do $$
declare uid uuid:='faab1411-822d-4100-9f34-7a31a2511e13'; a jsonb; b jsonb; saved jsonb;
begin
 a:=public.claim_billing_checkout(uid,'weekly','price_week','promo_city');
 if a->>'promotion_id'<>'promo_city' then raise exception 'Promotion not saved'; end if;
 if a->>'lease_token' is null then raise exception 'Missing lease'; end if;
 b:=public.claim_billing_checkout(uid,'realtor','price_agent');
 if b->>'busy'<>'true' then raise exception 'Parallel claim accepted'; end if;
 saved:=public.save_billing_checkout(uid,(a->>'lease_token')::uuid,'cus_Test',null,null,null);
 if saved->>'customer_id'<>'cus_Test' then raise exception 'Customer not saved'; end if;
 begin
  perform public.save_billing_checkout(uid,(a->>'lease_token')::uuid,'cus_Other',null,null,null);
  raise exception 'Customer reassigned';
 exception when raise_exception then if sqlerrm<>'Customer mismatch' then raise; end if; end;
 perform public.release_billing_checkout(uid,(a->>'lease_token')::uuid);
 b:=public.claim_billing_checkout(uid,'weekly','price_week');
 if b->>'promotion_id'<>'promo_city' then raise exception 'Retry changed promotion'; end if;
 if b->>'attempt_id'<>a->>'attempt_id' then raise exception 'Retry changed idempotency key'; end if;
 begin
  perform public.save_billing_checkout(uid,(a->>'lease_token')::uuid,null,'cs_test_stale',null,null);
  raise exception 'Old worker accepted';
 exception when raise_exception then if sqlerrm<>'Checkout lease lost' then raise; end if; end;
 perform public.release_billing_checkout(uid,(a->>'lease_token')::uuid);
 if public.claim_billing_checkout(uid,'weekly','price_week')->>'busy'<>'true' then raise exception 'Old worker released new lease'; end if;
 saved:=public.save_billing_checkout(uid,(b->>'lease_token')::uuid,null,'cs_test_saved',null,null);
 if saved->>'session_id'<>'cs_test_saved' then raise exception 'Session not saved'; end if;
 saved:=public.save_billing_checkout(uid,(b->>'lease_token')::uuid,null,null,'realtor','price_agent');
 if saved->>'promotion_id' is not null then raise exception 'Reset retained old promotion'; end if;
 if saved->>'attempt_id'=b->>'attempt_id' or saved->>'customer_id'<>'cus_Test' or saved->>'session_id' is not null then raise exception 'Invalid replacement'; end if;
 update public.billing_checkout_state set lease_until=clock_timestamp()-interval '1 second' where user_id=uid;
 begin
  perform public.save_billing_checkout(uid,(b->>'lease_token')::uuid,null,'cs_test_expired',null,null);
  raise exception 'Expired lease accepted';
 exception when raise_exception then if sqlerrm<>'Checkout lease lost' then raise; end if; end;
end $$;
reset role;
select 'billing checkout SQL regression passed' as result;
