-- Execute after the migration, inside BEGIN/ROLLBACK. Synthetic rows only.
do $$
declare role_name text; fn text;
begin
  foreach role_name in array array['anon','authenticated'] loop
    if has_table_privilege(role_name, 'public.stripe_webhook_receipts', 'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege(role_name, 'public.stripe_subscription_locks', 'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Browser table grant'; end if;
    foreach fn in array array['claim_stripe_webhook(text,text)','finish_stripe_webhook(text,text,text,uuid,jsonb)','release_stripe_webhook(text,uuid)'] loop
      if has_function_privilege(role_name, 'public.' || fn, 'EXECUTE') then raise exception 'Browser RPC grant'; end if;
    end loop;
  end loop;
  if (select count(*) from pg_class where oid in ('public.stripe_webhook_receipts'::regclass,'public.stripe_subscription_locks'::regclass) and relrowsecurity) <> 2 then raise exception 'RLS missing'; end if;
end $$;
insert into auth.users (id) values ('f7019bba-10d2-4a45-8be0-6c09bdb34b6c');
set local role service_role;
do $$
declare first_claim jsonb; next_claim jsonb; record jsonb;
begin
  record := jsonb_build_object('user_id','f7019bba-10d2-4a45-8be0-6c09bdb34b6c','payment_id','SUB_sub_Regression',
    'plan_name','weekly','status','active','starts_at','2026-10-01T00:00:00Z','ends_at','2026-10-08T00:00:00Z');
  first_claim := public.claim_stripe_webhook('evt_Regression1','sub_Regression');
  if first_claim->>'state' <> 'claimed' then raise exception 'Claim failed'; end if;
  if public.claim_stripe_webhook('evt_Regression2','sub_Regression')->>'state' <> 'busy' then raise exception 'Lease not exclusive'; end if;
  -- Expire a worker while it is reading Stripe; a replacement owns the next lease.
  update public.stripe_subscription_locks set lease_until = clock_timestamp() - interval '1 second' where subscription_id = 'sub_Regression';
  next_claim := public.claim_stripe_webhook('evt_Regression2','sub_Regression');
  begin
    perform public.finish_stripe_webhook('evt_Regression1','sub_Regression','customer.subscription.updated',(first_claim->>'token')::uuid,record);
    raise exception 'Stale worker accepted';
  exception when raise_exception then if sqlerrm <> 'Stripe lease lost' then raise; end if; end;
  perform public.release_stripe_webhook('sub_Regression',(first_claim->>'token')::uuid);
  if public.claim_stripe_webhook('evt_Regression3','sub_Regression')->>'state' <> 'busy' then raise exception 'Old worker released new lease'; end if;
  -- A DB failure must not leave a receipt or partial subscription write.
  begin
    perform public.finish_stripe_webhook('evt_Regression2','sub_Regression','customer.subscription.updated',(next_claim->>'token')::uuid,record || '{"status":"invalid"}'::jsonb);
    raise exception 'Invalid record accepted';
  exception when check_violation then null; end;
  if exists(select 1 from public.stripe_webhook_receipts where event_id='evt_Regression2')
    or exists(select 1 from public.user_subscriptions where payment_id='SUB_sub_Regression') then raise exception 'Partial commit'; end if;
  perform public.finish_stripe_webhook('evt_Regression2','sub_Regression','customer.subscription.updated',(next_claim->>'token')::uuid,record);
  if public.claim_stripe_webhook('evt_Regression2','sub_Regression')->>'state' <> 'duplicate' then raise exception 'Duplicate accepted'; end if;
  if (select count(*) from public.user_subscriptions where payment_id='SUB_sub_Regression') <> 1 then raise exception 'Subscription missing'; end if;
  -- Later processing of an older event persists current canceled state.
  next_claim := public.claim_stripe_webhook('evt_Regression1','sub_Regression');
  perform public.finish_stripe_webhook('evt_Regression1','sub_Regression','invoice.payment_succeeded',(next_claim->>'token')::uuid,record || '{"status":"canceled"}'::jsonb);
  if (select status from public.user_subscriptions where payment_id='SUB_sub_Regression') <> 'canceled' then raise exception 'State not updated'; end if;
end $$;
reset role;
select 'stripe webhook SQL regression passed' as result;
