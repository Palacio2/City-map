import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

let handler;
let quota = true, quotaError = null;
let captchaResult={success:true,hostname:'fixture.invalid',action:'contact'}, captchaFailure=false, quotaCalls=0;
const writes = [];
const values = { SUPABASE_URL: 'https://fixture.invalid', SUPABASE_SECRET_KEY: 'sb_secret_fixture',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture', SUPABASE_ANON_KEY: 'legacy-anon-fixture',
  CONTACT_TURNSTILE_SECRET_KEY:'fixture-captcha-secret',CONTACT_TURNSTILE_HOSTNAMES:'fixture.invalid' };
globalThis.fetch=async(url,options)=>{
  assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(options.redirect,'error');
  assert.equal(JSON.parse(options.body).secret,'fixture-captcha-secret');
  if(captchaFailure) throw new Error('private service details');
  return Response.json(captchaResult);
};
globalThis.Deno = { env: { get: name => values[name] }, serve: value => { handler = value; } };
globalThis.contactClient = (_url, key) => ({
  rpc: async (name, args) => {
    quotaCalls++;
    assert.equal(name, 'claim_contact_request');
    assert.equal(args.p_email, 'test@example.invalid');
    assert.notEqual(args.p_user, 'forged-user');
    return { data: quota, error: quotaError };
  },
  auth: { getUser: async token => ({ data: { user: token === 'user-token' ? { id: 'verified-user' } : null }, error: null }) },
  from: () => ({ insert: row => {
    assert.equal(key, 'sb_secret_fixture');
    writes.push(row);
    return { select: () => ({ single: async () => ({ data: { id: 'contact' }, error: null }) }) };
  } }),
});
const bundle = await build({ entryPoints: ['supabase/functions/submit-contact-form/index.ts'], bundle: true,
  write: false, platform: 'node', format: 'esm', plugins: [{ name: 'fixture', setup(b) {
    b.onResolve({ filter: /^npm:/ }, () => ({ path: 'supabase', namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const createClient=globalThis.contactClient;' }));
  } }] });
await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
async function request(header,patch={}) {
  writes.length = 0;
  quotaCalls=0;
  return handler(new Request('https://fixture.invalid', { method: 'POST',
    headers: header ? { Authorization: header } : {},
    body: JSON.stringify({ name: 'Test', email: 'test@example.invalid', message: 'Test contact message',
      consent_accepted: true, user_id: 'forged-user',captcha_token:'fixture-token',...patch }),
  }));
}
test('contact stays anonymous with no bearer, old anon or new publishable key during rollout', async () => {
  for (const header of [null, 'Bearer legacy-anon-fixture', 'Bearer sb_publishable_fixture']) {
    assert.equal((await request(header)).status, 200);
    assert.equal(writes[0].user_id, null);
  }
});
test('missing or malformed captcha blocks anonymous contact and disguised feedback before quota',async()=>{
  for(const token of [null,'',42,'x'.repeat(2049)]) {
    for(const type of ['contact','suggestion']) {
      assert.equal((await request(null,{captcha_token:token,type})).status,400);
      assert.equal(quotaCalls,0);assert.equal(writes.length,0);
    }
  }
});
test('failed, replayed, foreign-domain and wrong-action challenges fail closed',async()=>{
  try {
    for(const value of [{success:false,'error-codes':['timeout-or-duplicate']},
      {success:true,hostname:'foreign.invalid',action:'contact'},
      {success:true,hostname:'fixture.invalid',action:'login'},null]){
      captchaResult=value;
      assert.equal((await request(null)).status,400);
      assert.equal(quotaCalls,0);assert.equal(writes.length,0);
    }
  } finally {captchaResult={success:true,hostname:'fixture.invalid',action:'contact'};}
});
test('captcha outage or missing configuration never consumes quota or exposes secrets',async()=>{
  captchaFailure=true;
  try {
    const response=await request(null);
    assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private service details|fixture-captcha-secret/);
    assert.equal(quotaCalls,0);
  } finally {captchaFailure=false;}
  const secret=values.CONTACT_TURNSTILE_SECRET_KEY;
  delete values.CONTACT_TURNSTILE_SECRET_KEY;
  try {assert.equal((await request(null)).status,503);assert.equal(quotaCalls,0);}
  finally {values.CONTACT_TURNSTILE_SECRET_KEY=secret;}
});
test('verified in-app feedback retains user quota but verified public contact still requires captcha',async()=>{
  assert.equal((await request('Bearer user-token',{type:'suggestion',captcha_token:null})).status,200);
  assert.equal(quotaCalls,1);assert.equal(writes[0].user_id,'verified-user');
  assert.equal((await request('Bearer user-token',{captcha_token:null})).status,400);
  assert.equal(quotaCalls,0);
});
test('only verified user tokens establish contact authorship', async () => {
  assert.equal((await request('Bearer user-token')).status, 200);
  assert.equal(writes[0].user_id, 'verified-user');
  for (const header of ['Bearer invalid', 'Bearer sb_secret_fixture', 'invalid']) {
    assert.equal((await request(header)).status, 401);
    assert.equal(writes.length, 0);
  }
});
test('quota exhaustion and quota service failure prevent contact writes', async () => {
  try {
    quota = false;
    assert.equal((await request(null)).status, 429);
    assert.equal(writes.length, 0);
    quotaError = new Error('private database detail');
    const response = await request(null);
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private database detail/);
    assert.equal(writes.length, 0);
  } finally { quota = true; quotaError = null; }
});
