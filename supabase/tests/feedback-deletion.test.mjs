import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { build } from 'esbuild';

const db = new PGlite();
const actor = '11111111-1111-4111-8111-111111111111';
const id = '22222222-2222-4222-8222-222222222222';
before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create table admin_profiles(user_id uuid, role text, allowed_tabs text[]);
    insert into admin_profiles values('${actor}','admin',array['feedback.delete']);
    create table contacts_messages(id uuid primary key,screenshot_url text);
    create table audit_logs(admin_id uuid,action text,target_table text,record_id text,new_data jsonb);`);
  const sql = await readFile(new URL('../migrations/20261017130414_durable_feedback_deletion.sql', import.meta.url), 'utf8');
  await db.exec(sql); await db.exec(sql);
});
after(() => db.close());
const removeMessage = () => db.query('select delete_feedback_message($1,$2) job', [actor,id]);
const finish = () => db.query('select finish_feedback_deletion($1,$2)', [actor,id]);

test('audit failure preserves both message and attachment reference', async () => {
  await db.query('insert into contacts_messages values($1,$2)', [id,'feedback_123.jpg']);
  await db.exec("alter table audit_logs add constraint reject_log check(false) not valid");
  try { await assert.rejects(removeMessage(), /check constraint/); }
  finally { await db.exec('alter table audit_logs drop constraint reject_log'); }
  assert.equal((await db.query('select * from contacts_messages')).rows.length,1);
  assert.equal((await db.query('select * from feedback_deletion_jobs')).rows.length,0);
});
test('deletion commits durable cleanup and repeated deletion recovers the same job', async () => {
  const first = (await removeMessage()).rows[0].job;
  assert.equal(first.screenshot_url,'feedback_123.jpg');
  assert.equal((await db.query('select * from contacts_messages')).rows.length,0);
  assert.deepEqual((await removeMessage()).rows[0].job,first);
  assert.equal((await db.query('select * from audit_logs')).rows.length,1);
});
test('lost cleanup audit preserves retry job; acknowledgement is idempotent', async () => {
  await db.exec("alter table audit_logs add constraint reject_log check(action <> 'delete_feedback_attachment') not valid");
  try { await assert.rejects(finish(),/check constraint/); }
  finally { await db.exec('alter table audit_logs drop constraint reject_log'); }
  assert.equal((await db.query('select * from feedback_deletion_jobs')).rows.length,1);
  await finish(); await finish();
  assert.equal((await db.query('select * from feedback_deletion_jobs')).rows.length,0);
  assert.equal((await db.query('select * from audit_logs')).rows.length,2);
});
test('message without attachment needs no cleanup job', async () => {
  await db.query('insert into contacts_messages values($1,null)',[id]);
  assert.equal((await removeMessage()).rows[0].job,null);
});
test('revoked permission and browser roles cannot delete or inspect jobs', async () => {
  await db.exec("update admin_profiles set allowed_tabs='{}'");
  await assert.rejects(removeMessage(),/permission required/);
  await assert.rejects(finish(),/permission required/);
  for (const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    try {
      await assert.rejects(removeMessage(),/permission denied/);
      await assert.rejects(db.query('select * from feedback_deletion_jobs'),/permission denied/);
    } finally { await db.exec('reset role'); }
  }
});

let handler, events, failure, tabs;
const job = {message_id:id,screenshot_url:'feedback_123.jpg'};
const client = {
  rpc: async (name) => {
    events.push(name);
    return {data:name === 'delete_feedback_message' ? job : null,error:failure === name ? new Error('fixture failure') : null};
  },
  from: (table) => {
    events.push(table);
    const q = {
      update:()=>q, eq:async()=>({error:null}), select:()=>q, order:()=>q,
      limit:async(n)=>{ assert.equal(n,10); return {data:[job],error:null}; },
      then:(resolve)=>Promise.resolve({data:[],error:null}).then(resolve),
    }; return q;
  },
  storage:{from:(bucket)=>{ assert.equal(bucket,'feedback_images'); return {
    remove:async(paths)=>{events.push('remove'); assert.deepEqual(paths,['feedback_123.jpg']); return {error:failure === 'remove' ? new Error('storage failure') : null};},
  }; }},
};
globalThis.feedbackFixture = {verifyAdminUser:async()=>({role:'admin',allowedTabs:tabs,supabaseAdmin:client,user:{id:actor}})};
globalThis.Deno = {env:{get:()=> 'https://fixture.supabase.co'},serve:fn=>{handler=fn;}};
const bundle = await build({entryPoints:['supabase/functions/admin-feedback-manage/index.ts'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{
  name:'auth-fixture',setup(b){
    b.onResolve({filter:/\/auth\.ts$/},()=>({path:'auth',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const verifyAdminUser=globalThis.feedbackFixture.verifyAdminUser; export const corsHeaders={};'}));
  },
}]});
await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const request = (action='delete_message')=>handler(new Request('https://fixture.invalid',{method:'POST',body:JSON.stringify({action,id,screenshot_url:'untrusted.jpg'})}));
test('handler never touches Storage before successful database deletion',async()=>{
  events=[];tabs=['feedback.delete'];failure='delete_feedback_message';
  assert.notEqual((await request()).status,200);
  assert.deepEqual(events,['delete_feedback_message']);
});
test('Storage or acknowledgement failure leaves cleanup pending and retry succeeds',async()=>{
  tabs=['feedback.delete'];
  for (const fail of ['remove','finish_feedback_deletion',null]) {
    events=[];failure=fail;
    const response=await request();
    assert.equal(response.status,200);
    assert.equal((await response.json()).cleanup_pending,fail!==null);
    assert.deepEqual(events,fail==='remove' ? ['delete_feedback_message','feedback_deletion_jobs','remove'] : ['delete_feedback_message','feedback_deletion_jobs','remove','finish_feedback_deletion']);
  }
});
test('view-only admins do not process cleanup; delete-enabled visits retry bounded jobs',async()=>{
  failure=null;events=[];tabs=['feedback'];
  assert.equal((await request('get_messages')).status,200);
  assert.deepEqual(events,['contacts_messages']);
  assert.equal((await request()).status,403);
  events=[];tabs=['feedback','feedback.delete'];
  assert.equal((await request('get_messages')).status,200);
  assert.deepEqual(events,['feedback_deletion_jobs','feedback_deletion_jobs','remove','finish_feedback_deletion','contacts_messages']);
});
test('untrusted legacy attachment location stays pending without Storage access',async()=>{
  events=[];failure=null;tabs=['feedback.delete'];
  job.screenshot_url='https://other.supabase.co/storage/v1/object/public/feedback_images/feedback_123.jpg';
  try {
    const response=await request();
    assert.equal((await response.json()).cleanup_pending,true);
    assert.deepEqual(events,['delete_feedback_message','feedback_deletion_jobs']);
  } finally { job.screenshot_url='feedback_123.jpg'; }
});
