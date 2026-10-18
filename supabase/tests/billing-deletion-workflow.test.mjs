import {test,before,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
const actor='11111111-1111-4111-8111-111111111111', target='22222222-2222-4222-8222-222222222222';
before(async()=>{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    create table admin_profiles(user_id uuid primary key references auth.users on delete cascade,role text,allowed_tabs text[]);
    create table audit_logs(admin_id uuid references auth.users on delete set null,action text,target_table text,record_id text,new_data jsonb);
    create table user_subscriptions(user_id uuid references auth.users on delete cascade,payment_id text unique,plan_name text,status text,starts_at timestamptz,ends_at timestamptz,cancel_at timestamptz,cancelled_at timestamptz);`);
  for(const file of ['20261005124019_stripe_webhook_serialization.sql','20261009142325_durable_checkout_attempts.sql','20261016142907_guard_billing_account_deletion.sql','20261017132356_audited_auth_deletion.sql','20261017223902_billing_deletion_workflow.sql']) {
    await db.exec(await readFile(new URL('../migrations/'+file,import.meta.url),'utf8'));
  }
});
beforeEach(async()=>{
  await db.exec(`truncate auth.users cascade;truncate audit_logs,admin_user_deletions,billing_account_deletions,deleted_billing_subscriptions,stripe_subscription_locks,stripe_webhook_receipts;
    insert into auth.users values('${actor}'),('${target}');
    insert into admin_profiles values('${actor}','admin',array['users.delete']),('${target}','user','{}');
    insert into billing_checkout_state(user_id,customer_id,session_id,plan_key,price_id) values('${target}','cus_fixture','cs_fixture','premium','price_fixture');
    insert into user_subscriptions(user_id,payment_id,status) values('${target}','SUB_sub_fixture','active');`);
});
after(()=>db.close());
const begin=()=>db.query('select begin_billing_account_deletion($1,$2)',[actor,target]);
const result=()=>({user_id:target,subscription_ids:['sub_fixture'],customer_ids:['cus_fixture'],session_ids:['cs_fixture'],outstanding_invoice_ids:[],cancellation_confirmed:true});
const save=(value=result())=>db.query('select record_billing_account_cancellation($1,$2,$3) ready',[actor,target,value]);
const remove=()=>db.query('delete from auth.users where id=$1',[target]);
test('freeze prevents Checkout and successful reconciliation preserves identity after Auth deletion',async()=>{
  await begin();
  await assert.rejects(db.query("select claim_billing_checkout($1,'premium','price_fixture')",[target]),/deletion in progress/);
  await assert.rejects(remove(),/Billing reconciliation/);
  assert.equal((await save()).rows[0].ready,true);
  await db.query('select prepare_admin_user_deletion($1,$2)',[actor,target]);
  await remove();
  assert.equal((await db.query("select billing_subscription_owner('sub_fixture') owner")).rows[0].owner,target);
  assert.equal((await db.query('select * from user_subscriptions')).rows.length,0);
  assert.equal((await db.query('select * from billing_account_deletions')).rows.length,1);
});
test('active checkout lease prevents freeze and audit failure rolls back intent',async()=>{
  await db.exec("update billing_checkout_state set lease_until=now()+interval '1 minute'");
  await assert.rejects(begin(),/Checkout still in progress/);
  await db.exec('update billing_checkout_state set lease_until=null;alter table audit_logs add constraint fail_audit check(false) not valid');
  try{await assert.rejects(begin(),/check constraint/);}finally{await db.exec('alter table audit_logs drop constraint fail_audit');}
  assert.equal((await db.query('select * from billing_account_deletions')).rows.length,0);
});
test('open invoices, stale approval and new local Stripe links prevent Auth deletion',async()=>{
  await begin();
  assert.equal((await save({...result(),outstanding_invoice_ids:['in_unpaid']})).rows[0].ready,false);
  await assert.rejects(remove(),/Billing reconciliation/);
  await save();
  await db.exec("update billing_account_deletions set cancellation_recorded_at=now()-interval '2 minutes'");
  await assert.rejects(remove(),/Billing reconciliation/);
  await save();
  await db.query("insert into user_subscriptions(user_id,payment_id) values($1,'SUB_sub_new')",[target]);
  await assert.rejects(remove(),/Billing reconciliation/);
});
test('current permissions and private journal cannot be bypassed',async()=>{
  await begin();
  await db.query("update admin_profiles set role='user' where user_id=$1",[actor]);
  await assert.rejects(save(),/permission required/);
  for(const role of ['anon','authenticated','service_role']) {
    await db.exec('set role '+role);
    try{await assert.rejects(db.query('select * from billing_account_deletions'),/permission denied/);
      await assert.rejects(db.query("select claim_billing_checkout_unfrozen($1,'premium','price_fixture')",[target]),/permission denied/);
    }finally{await db.exec('reset role');}
  }
});
test('late terminal webhook updates archive, never recreates entitlement; active result fails',async()=>{
  await begin();await save();await remove();
  const token=(await db.query("select claim_stripe_webhook('evt_late','sub_fixture') claim")).rows[0].claim.token;
  const record={user_id:target,payment_id:'SUB_sub_fixture',status:'canceled'};
  await db.query("select finish_stripe_webhook('evt_late','sub_fixture','customer.subscription.deleted',$1,$2)",[token,record]);
  assert.equal((await db.query('select * from user_subscriptions')).rows.length,0);
  assert.equal((await db.query('select latest_record from deleted_billing_subscriptions')).rows[0].latest_record.status,'canceled');
  const token2=(await db.query("select claim_stripe_webhook('evt_active','sub_fixture') claim")).rows[0].claim.token;
  await assert.rejects(db.query("select finish_stripe_webhook('evt_active','sub_fixture','customer.subscription.updated',$1,$2)",[token2,{...record,status:'active'}]),/requires reconciliation/);
});
