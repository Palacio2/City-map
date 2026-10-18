import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
const actor='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
before(async()=>{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create table admin_profiles(user_id uuid,role text,allowed_tabs text[]);
    create table audit_logs(admin_id uuid,action text,target_table text,record_id text,new_data jsonb);`);
  const sql=await readFile(new URL('../migrations/20261017132858_durable_promo_operations.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
  const reconcile=await readFile(new URL('../migrations/20261017175932_reconcile_promo_operations.sql',import.meta.url),'utf8');
  await db.exec(reconcile);await db.exec(reconcile);
});
test('pending batches are bounded, actor-isolated, rotating and exclude completed operations',async()=>{
  for(let i=0;i<5;i++) await db.query("select prepare_promo_operation($1,$2,'create_promo','{}')",[actor,'create:'+i]);
  await db.query("select prepare_promo_operation($1,'other','create_promo','{}')",[other]);
  const first=(await db.query('select * from pending_promo_operations($1)',[actor])).rows;
  assert.equal(first.length,3);assert.ok(first.every(row=>row.actor_id===actor));
  const second=(await db.query('select * from pending_promo_operations($1)',[actor])).rows;
  assert.equal(new Set([...first,...second].map(row=>row.operation_key)).size,5);
  await db.query('select complete_promo_operation($1,$2,$3)',[actor,first[0].operation_key,{success:true}]);
  const third=(await db.query('select * from pending_promo_operations($1)',[actor])).rows;
  assert.ok(third.every(row=>row.operation_key!==first[0].operation_key));
  await db.exec("update admin_profiles set role='user'");
  await assert.rejects(db.query('select * from pending_promo_operations($1)',[actor]),/Forbidden/);
});
beforeEach(()=>db.exec(`truncate admin_promo_operations,audit_logs,admin_profiles;
  insert into admin_profiles values('${actor}','admin',array['users.promo_codes']),('${other}','super_admin','{}');`));
after(()=>db.close());
const begin=(payload={code:'CITY'},who=actor)=>db.query("select prepare_promo_operation($1,'create:fixture','create_promo',$2) result",[who,payload]);
const finish=(result={success:true,id:'promo_city'})=>db.query("select complete_promo_operation($1,'create:fixture',$2)",[actor,result]);
test('pending request and completed result are durable and retries do not duplicate audit',async()=>{
  assert.equal((await begin()).rows[0].result,null);
  await begin();
  assert.equal((await db.query('select * from audit_logs')).rows.length,1);
  await finish();await finish();
  assert.deepEqual((await begin()).rows[0].result,{success:true,id:'promo_city'});
  assert.equal((await db.query('select * from audit_logs')).rows.length,2);
});
test('different actor or changed payload cannot reuse the operation identity',async()=>{
  await begin();
  await assert.rejects(begin({code:'OTHER'}),/identity conflict/);
  await assert.rejects(begin({code:'CITY'},other),/identity conflict/);
});
test('audit failure rolls back preparation and completion independently',async()=>{
  await db.exec('alter table audit_logs add constraint reject_log check(false) not valid');
  try {await assert.rejects(begin(),/check constraint/);}
  finally {await db.exec('alter table audit_logs drop constraint reject_log');}
  assert.equal((await db.query('select * from admin_promo_operations')).rows.length,0);
  await begin();
  await db.exec("alter table audit_logs add constraint reject_log check(action<>'CREATE_PROMO_CODE') not valid");
  try {await assert.rejects(finish(),/check constraint/);}
  finally {await db.exec('alter table audit_logs drop constraint reject_log');}
  assert.equal((await begin()).rows[0].result,null);
  await finish();
});
test('expired uncertain creation cannot reuse a pruned Stripe key; completed receipt still works',async()=>{
  await begin();
  await db.exec("update admin_promo_operations set created_at=now()-interval '24 hours'");
  await assert.rejects(begin(),/reconciliation/);
  await finish();
  assert.equal((await begin()).rows[0].result.success,true);
});
test('revoked permissions block new side effects but permit recording an existing result',async()=>{
  await begin();
  await db.exec("update admin_profiles set allowed_tabs='{}',role='user'");
  await assert.rejects(begin(),/Forbidden/);
  await finish();
  await assert.rejects(finish({success:true,id:'promo_different'}),/Result conflict/);
});
test('browser cannot use RPCs or read receipts and service cannot forge table rows',async()=>{
  for(const role of ['anon','authenticated','service_role']){
    await db.exec(`set role ${role}`);
    try {
      await assert.rejects(db.query('select * from admin_promo_operations'),/permission denied/);
      if(role!=='service_role') {await assert.rejects(begin(),/permission denied/);await assert.rejects(finish(),/permission denied/);}
      else {await begin();await finish();}
    } finally {await db.exec('reset role');}
  }
});
