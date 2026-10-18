import Stripe from 'npm:stripe@22.6.0';
import { cancelBillingForDeletion, BillingDeletionError } from '../_shared/billingDeletion.ts';
import { RequestError } from '../_shared/request.ts';

interface Database {
  rpc(name:string,args:Record<string,unknown>): PromiseLike<{data:unknown;error:{code?:string}|null}>;
}
export async function reconcileDeletionBilling(db:Database,actor:string,target:string) {
  const key=Deno.env.get('STRIPE_SECRET_KEY');
  if(!key) throw new RequestError('Billing configuration unavailable',503);
  const prices:Record<string,string>={};
  for(const plan of ['weekly','premium','realtor']) {
    const price=Deno.env.get('STRIPE_PRICE_'+plan.toUpperCase());
    if(!price || !/^price_[A-Za-z0-9]+$/.test(price) || Object.hasOwn(prices,price)) {
      throw new RequestError('Billing configuration unavailable',503);
    }
    prices[price]=plan;
  }
  const stripe=new Stripe(key,{apiVersion:'2026-08-26.dahlia',httpClient:Stripe.createFetchHttpClient(),timeout:20_000,maxNetworkRetries:1});
  const {data,error}=await db.rpc('begin_billing_account_deletion',{p_actor:actor,p_target:target});
  if(error || !data) throw new RequestError('Unable to freeze billing; retry account deletion',error?.code==='CM409'?409:503);
  try {
    const result=await cancelBillingForDeletion(stripe,data as Parameters<typeof cancelBillingForDeletion>[1],prices);
    const saved=await db.rpc('record_billing_account_cancellation',{p_actor:actor,p_target:target,p_result:result});
    if(saved.error) throw new RequestError('Cancellation audit not confirmed; retry account deletion',503);
    if(saved.data!==true) throw new RequestError('Subscriptions canceled; outstanding billing requires reconciliation before deletion',409);
  } catch(error) {
    if(error instanceof RequestError) throw error;
    if(error instanceof BillingDeletionError) throw new RequestError(error.message,409);
    throw new RequestError('Billing cancellation not confirmed; retry account deletion',503);
  }
}
