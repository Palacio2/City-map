import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { PGlite } from '@electric-sql/pglite';
import { districtPhotoPath } from '../functions/_shared/districtPhoto.ts';

const id='11111111-1111-4111-8111-111111111111';
const filename=`${id}-123.webp`;
const base='https://fixture.supabase.co';
let handler, visible=true, failed=false, storageError=false, signs=0;
globalThis.Deno={env:{get:()=>base},serve:value=>{handler=value;}};
const source=`${base}/storage/v1/object/public/district-photos/${filename}`;
globalThis.photoDb={
  from(table){
    assert.equal(table,'districts'); const conditions={};
    const q={select:()=>q,eq:(key,value)=>{conditions[key]=value;return q;},maybeSingle:async()=>{
      assert.deepEqual(conditions,{id,is_available:true,'cities.is_available':true});
      return {data:visible?{district_photos:[{photo_url:source,is_main:true}]}:null,error:failed?new Error('private detail'):null};
    }};return q;
  },
  storage:{from:bucket=>{assert.equal(bucket,'district-photos');return {createSignedUrl:async(path,ttl)=>{
    signs++;assert.equal(path,filename);assert.equal(ttl,60);
    return {data:{signedUrl:`${base}/signed/fixture`},error:storageError?new Error('secret'):null};
  }}}}
};
const bundle=await build({entryPoints:['supabase/functions/get-district-photo/index.ts'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{
  name:'fixture',setup(b){b.onResolve({filter:/\/security\.ts$/},()=>({path:'security',namespace:'fixture'}));
    b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export const getDistrictDataClient=()=>globalThis.photoDb; export const corsHeaders={'Cache-Control':'private, no-store'};`}));}
}]});
await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const request=(query=id,method='GET')=>handler(new Request(`https://fixture.invalid?id=${query}`,{method}));

test('photo locators reject foreign projects, buckets, districts and signed URLs',()=>{
  assert.equal(districtPhotoPath(source,id),filename);
  assert.equal(districtPhotoPath(filename,id),filename);
  assert.equal(districtPhotoPath(source.replace('.webp','.jpg'),id),filename.replace('.webp','.jpg'));
  for(const value of [source.replace('fixture.supabase.co','evil.invalid'),source.replace('district-photos','avatars'),source+'?token=old',`../${filename}`,source.replace(id,'22222222-2222-4222-8222-222222222222')]) assert.equal(districtPhotoPath(value,id),null);
});
test('visible photo gets a short-lived redirect; hidden districts/cities and failures never sign',async()=>{
  const response=await request();assert.equal(response.status,302);assert.equal(signs,1);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  visible=false;assert.equal((await request()).status,404);assert.equal(signs,1);
  visible=true;failed=true;assert.equal((await request()).status,503);assert.equal(signs,1);
  failed=false;storageError=true;assert.equal((await request()).status,503);storageError=false;
});
test('malformed IDs and unsupported methods never access storage',async()=>{
  const before=signs;
  assert.equal((await request('bad')).status,400);assert.equal((await request(id,'POST')).status,405);
  assert.equal(signs,before);
});

const db=new PGlite();after(()=>db.close());
test('private bucket and restrictive RLS defeat old permissive storage reads',async()=>{
  await db.exec(`create role anon; create role authenticated; create schema storage;
    create table storage.buckets(id text primary key,public boolean);
    create table storage.objects(bucket_id text,name text);
    insert into storage.buckets values('district-photos',true),('other',true);
    insert into storage.objects values('district-photos','hidden.webp'),('other','public.webp');
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;
    grant select on storage.objects to anon,authenticated;
    create policy old_public on storage.objects for select using(true);`);
  const sql=await readFile(new URL('../migrations/20261017051611_protect_district_photo_storage.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql);
  assert.equal((await db.query("select public from storage.buckets where id='district-photos'")).rows[0].public,false);
  for(const role of ['anon','authenticated']){
    await db.exec(`set role ${role}`);
    assert.deepEqual((await db.query('select bucket_id from storage.objects')).rows,[{bucket_id:'other'}]);
    await db.exec('reset role');
  }
});
