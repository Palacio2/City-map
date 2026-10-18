import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createParserScratch } from './parserScratch.js';
import { processLocalOsmData } from './osmProcessor.js';
test('disk-backed collections retain order, exact IDs and values',()=>{
    const scratch=createParserScratch();
    try {
        const array=scratch.array(),map=scratch.map();
        for(let i=0;i<1000;i++) {array.push({i});map.set(String(i),[i,0]);}
        assert.equal(array.length,1000);assert.equal(map.size,1000);
        assert.deepEqual([...array].slice(-1),[{i:999}]);
        assert.deepEqual(map.get('999'),[999,0]);
        map.add('9007199254740993');assert.ok(map.has('9007199254740993'));
    } finally {scratch.close();}
});
test('missing PBF propagates upstream failure instead of crashing or hanging',async()=>{
    await assert.rejects(processLocalOsmData('nonexistent-audit-fixture.pbf',[],[
        {field_code:'school_count',osm_key:'amenity',osm_value:'school'},
    ]),/ENOENT/);
});
