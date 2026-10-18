import type Stripe from 'npm:stripe@22.6.0';
import { subscriptionRecord } from './stripeSubscription.ts';

export interface BillingDeletionSnapshot {
  user_id: string;
  checkout_snapshot: { customer_id: string | null; session_id: string | null } | null;
  subscription_snapshot: Array<{payment_id: string | null}>;
}
export class BillingDeletionError extends Error {}
const reference=(value: unknown): string | null => typeof value==='string' ? value
  : value && typeof value==='object' && 'id' in value && typeof value.id==='string' ? value.id : null;
const terminal=(status:string)=>status==='canceled'||status==='incomplete_expired';
async function pages<T extends {id:string}>(read:(cursor?:string)=>Promise<{data:T[];has_more:boolean}>) {
  const result:T[]=[];
  let cursor:string|undefined;
  for(let i=0;i<10;i++) {
    const page=await read(cursor);
    result.push(...page.data);
    if(!page.has_more) return result;
    const next=page.data.at(-1)?.id;
    if(!next || next===cursor) throw new BillingDeletionError('Incomplete Stripe pagination');
    cursor=next;
  }
  throw new BillingDeletionError('Stripe result exceeds reconciliation limit');
}

// Requires a durable frozen snapshot from begin_billing_account_deletion.
// This stage never deletes an Auth user, customer, invoice or billing link.
export async function cancelBillingForDeletion(stripe:Stripe,snapshot:BillingDeletionSnapshot,prices:Record<string,string>) {
  const user=snapshot.user_id;
  const customerIds=new Set<string>();
  const subscriptions=new Map<string,Stripe.Subscription>();
  const sessions=new Map<string,Stripe.Checkout.Session>();
  const checkout=snapshot.checkout_snapshot;
  if(checkout && (!checkout.customer_id || !checkout.session_id)) {
    throw new BillingDeletionError('Uncertain Checkout creation requires reconciliation');
  }
  if(checkout?.customer_id) customerIds.add(checkout.customer_id);
  const checkSub=(sub:Stripe.Subscription)=>{
    if(sub.metadata.app!=='city-map' || sub.metadata.user_id!==user || !subscriptionRecord(sub,prices,user)) {
      throw new BillingDeletionError('Subscription ownership requires reconciliation');
    }
    const customer=reference(sub.customer);
    if(!customer || !/^cus_[A-Za-z0-9]+$/.test(customer)) throw new BillingDeletionError('Invalid customer');
    customerIds.add(customer);subscriptions.set(sub.id,sub);
  };
  for(const row of snapshot.subscription_snapshot) {
    if(!row.payment_id?.startsWith('SUB_')) continue;
    if(!/^SUB_sub_[A-Za-z0-9]+$/.test(row.payment_id)) throw new BillingDeletionError('Invalid billing link');
    checkSub(await stripe.subscriptions.retrieve(row.payment_id.slice(4)));
  }
  const checkSession=(session:Stripe.Checkout.Session,customer:string)=>{
    if(session.metadata?.app!=='city-map' || session.metadata.user_id!==user || reference(session.customer)!==customer
      || session.mode!=='subscription' || !['open','expired','complete'].includes(session.status ?? '')) {
      throw new BillingDeletionError('Checkout ownership or status requires reconciliation');
    }
    sessions.set(session.id,session);
  };
  if(customerIds.size>10) throw new BillingDeletionError('Too many billing customers');
  // Read and validate the entire scope before making the first remote change.
  for(const customerId of [...customerIds]) {
    const customer=await stripe.customers.retrieve(customerId);
    if(customer.deleted || customer.metadata.app!=='city-map' || customer.metadata.user_id!==user) {
      throw new BillingDeletionError('Customer ownership requires reconciliation');
    }
    const subs=await pages(cursor=>stripe.subscriptions.list({customer:customerId,status:'all',limit:100,...(cursor?{starting_after:cursor}:{})}));
    for(const sub of subs) {
      if(reference(sub.customer)!==customerId) throw new BillingDeletionError('Customer mismatch');
      checkSub(sub);
    }
    const schedules=await pages(cursor=>stripe.subscriptionSchedules.list({customer:customerId,limit:100,...(cursor?{starting_after:cursor}:{})}));
    if(schedules.some(s=>!['canceled','completed','released'].includes(s.status))) {
      throw new BillingDeletionError('Scheduled subscription requires reconciliation');
    }
    const history=await pages(cursor=>stripe.checkout.sessions.list({customer:customerId,limit:100,...(cursor?{starting_after:cursor}:{})}));
    for(const session of history) checkSession(session,customerId);
  }
  if(checkout?.session_id && !sessions.has(checkout.session_id)) {
    checkSession(await stripe.checkout.sessions.retrieve(checkout.session_id),checkout.customer_id!);
  }
  for(const session of sessions.values()) {
    const subId=reference(session.subscription);
    if(session.status==='complete' && (!subId || !subscriptions.has(subId))) {
      throw new BillingDeletionError('Completed Checkout subscription requires reconciliation');
    }
  }
  // A session that completes concurrently makes expire fail: retry the entire
  // read phase so its newly created subscription cannot be missed.
  for(const session of sessions.values()) {
    if(session.status==='open') {
      const expired=await stripe.checkout.sessions.expire(session.id);
      if(expired.status!=='expired') throw new BillingDeletionError('Checkout expiration not confirmed');
    }
  }
  const canceled:string[]=[];
  for(const sub of subscriptions.values()) {
    if(!terminal(sub.status)) {
      const result=await stripe.subscriptions.cancel(sub.id,{invoice_now:false,prorate:false});
      checkSub(result);
      if(result.id!==sub.id || !terminal(result.status)) throw new BillingDeletionError('Cancellation not confirmed');
    }
    canceled.push(sub.id);
  }
  const outstandingInvoices:string[]=[];
  for(const customer of customerIds) {
    const invoices=await pages(cursor=>stripe.invoices.list({customer,limit:100,...(cursor?{starting_after:cursor}:{})}));
    for(const invoice of invoices) {
      if(reference(invoice.customer)!==customer) throw new BillingDeletionError('Invoice customer mismatch');
      if(invoice.status==='draft' || invoice.status==='open' || invoice.status===null) outstandingInvoices.push(invoice.id);
    }
  }
  return {user_id:user,customer_ids:[...customerIds].sort(),subscription_ids:canceled.sort(),
    session_ids:[...sessions.keys()].sort(),outstanding_invoice_ids:outstandingInvoices.sort(),
    cancellation_confirmed:true,auth_deletion_authorized:false};
}
