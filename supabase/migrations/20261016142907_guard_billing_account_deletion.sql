-- F02: never cascade away the only reconciliation link to a Stripe customer,
-- subscription, or an uncertain Checkout creation. A local terminal status is
-- insufficient proof that no remote collection can occur.
create or replace function public.guard_billing_account_deletion() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.billing_checkout_state where user_id=old.id)
    or exists(select 1 from public.user_subscriptions where user_id=old.id and payment_id like 'SUB\_%' escape '\')
  then raise exception 'Billing reconciliation required before account deletion' using errcode='23503'; end if;
  return old;
end $$;
revoke all on function public.guard_billing_account_deletion() from public,anon,authenticated;
drop trigger if exists release_billing_account_delete on auth.users;
create trigger release_billing_account_delete before delete on auth.users
  for each row execute function public.guard_billing_account_deletion();
