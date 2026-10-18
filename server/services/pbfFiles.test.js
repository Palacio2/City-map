import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { isPbfFileName, resolvePbfFile, listPbfFiles } from './pbfFiles.js';
import { RunParserSchema } from '../schemas/parserSchema.js';

test('PBF contract rejects traversal, absolute paths, ADS, URLs and control characters', async () => {
    for (const name of ['../secret.pbf', '..\\secret.pbf', '/tmp/a.pbf', 'C:\\a.pbf',
        '\\\\host\\a.pbf', 'data/a.pbf', 'file:///a.pbf', 'a.pbf:secret', '%2e%2e.pbf',
        'a\0.pbf', 'a\n.pbf', 'a.pbf\n', 'CON.pbf', 'a.txt', '.hidden.pbf', 'a.PBF', 'a'.repeat(256) + '.pbf']) {
        assert.equal(isPbfFileName(name), false, name);
        assert.equal(RunParserSchema.safeParse({ cityName: 'Warsaw', pbfFileName: name }).success, false, name);
        // Invalid names must fail before any attempt to access a directory.
        await assert.rejects(resolvePbfFile('nonexistent-directory', name), /Invalid PBF file name/);
    }
    for (const name of ['poland-latest.osm.pbf', 'Київ 2026.pbf']) {
        assert.equal(RunParserSchema.safeParse({ cityName: 'Warsaw', pbfFileName: name }).success, true);
    }
    assert.equal(RunParserSchema.safeParse({ cityName: 'Warsaw', pbfFileName: '' }).success, true);
});

async function fixture(t) {
    const tempRoot = await fs.realpath(os.tmpdir());
    const root = await fs.mkdtemp(path.join(tempRoot, 'city-map-pbf-'));
    t.after(async () => {
        const resolved = await fs.realpath(root);
        if (path.dirname(resolved) !== tempRoot || !path.basename(resolved).startsWith('city-map-pbf-')) {
            throw new Error('Unexpected fixture cleanup path');
        }
        await fs.rm(resolved, { recursive: true, force: true });
    });
    const data = path.join(root, 'data');
    await fs.mkdir(data);
    return { root, data };
}

test('PBF resolver accepts regular files and rejects directories/missing files', async t => {
    const { data } = await fixture(t);
    await fs.writeFile(path.join(data, 'city.osm.pbf'), 'fixture');
    await fs.mkdir(path.join(data, 'directory.pbf'));
    await fs.writeFile(path.join(data, 'notes.txt'), 'fixture');
    assert.equal(await resolvePbfFile(data, 'city.osm.pbf'), path.join(await fs.realpath(data), 'city.osm.pbf'));
    await assert.rejects(resolvePbfFile(data, 'directory.pbf'), /regular file/);
    await assert.rejects(resolvePbfFile(data, 'missing.pbf'), { code: 'ENOENT' });
    assert.deepEqual(await listPbfFiles(data), ['city.osm.pbf']);
});

test('PBF resolver and listing reject links outside the data directory', async t => {
    const { root, data } = await fixture(t);
    const outside = path.join(root, 'outside');
    await fs.mkdir(outside);
    // Windows junctions need no developer-mode file symlink privilege.
    await fs.symlink(outside, path.join(data, 'escape.pbf'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(resolvePbfFile(data, 'escape.pbf'), /regular file/);
    assert.deepEqual(await listPbfFiles(data), []);
});
