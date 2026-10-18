import { test } from 'node:test';
import assert from 'node:assert/strict';
import { visibleFields, visiblePois } from '../functions/_shared/fieldAccess.ts';
const free={isFree:true,isPremium:false,isRealtor:false};
const paid={isFree:false,isPremium:true,isRealtor:true};
const fields=[{field_code:'schools_count',ui_group:'education',is_active:true,is_premium:true,is_realtor_only:false}];
test('tuple POIs preserve the parser contract but still enforce paid access',()=>{
  const points=[[52,21,'schools','parser']];
  assert.deepEqual(visiblePois(points,fields,free),[]);
  assert.deepEqual(visiblePois(points,fields,paid),points);
  assert.deepEqual(visiblePois([[100,21,'schools']],fields,paid),[]);
});
test('derived rating requires all configured input fields to be readable',()=>{
  const data={education_rating:8.5,unknown_rating:10};
  assert.deepEqual(visibleFields(data,fields,free),{});
  assert.deepEqual(visibleFields(data,fields,paid),{education_rating:8.5});
  assert.deepEqual(visibleFields(data,[{...fields[0],is_active:false}],paid),{});
  assert.deepEqual(visibleFields(data,[],paid),{});
});
