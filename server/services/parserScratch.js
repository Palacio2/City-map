import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, basename } from 'node:path';

// Bounded-memory indexes for large PBF passes. Each parser owns its temp folder.
export function createParserScratch() {
    const directory = mkdtempSync(join(tmpdir(), 'city-map-parser-'));
    const db = new DatabaseSync(join(directory, 'scratch.sqlite'));
    db.exec('PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF; PRAGMA cache_size=-8192; BEGIN;');
    let sequence = 0;
    const table = () => 'scratch_' + sequence++;
    return {
        array() {
            const name = table();
            db.exec(`CREATE TABLE ${name}(id INTEGER PRIMARY KEY, value TEXT NOT NULL)`);
            const insert = db.prepare(`INSERT INTO ${name}(value) VALUES(?)`);
            const rows = db.prepare(`SELECT value FROM ${name} ORDER BY id`);
            let length = 0;
            return { get length() { return length; }, push(value) { insert.run(JSON.stringify(value)); length++; },
                *[Symbol.iterator]() { for (const row of rows.iterate()) yield JSON.parse(row.value); } };
        },
        map() {
            const name = table();
            db.exec(`CREATE TABLE ${name}(key TEXT PRIMARY KEY, value TEXT) WITHOUT ROWID`);
            const put = db.prepare(`INSERT INTO ${name}(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`);
            const get = db.prepare(`SELECT value FROM ${name} WHERE key=?`);
            const count = db.prepare(`SELECT count(*) AS n FROM ${name}`);
            return { set(key, value) { put.run(String(key), JSON.stringify(value)); },
                add(key) { put.run(String(key), 'true'); },
                has(key) { return !!get.get(String(key)); },
                get(key) { const row = get.get(String(key)); return row ? JSON.parse(row.value) : undefined; },
                get size() { return count.get().n; } };
        },
        close() {
            db.close();
            const target = resolve(directory);
            if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('city-map-parser-')) throw new Error('Invalid scratch cleanup path');
            rmSync(target, { recursive: true, force: true });
        },
    };
}
