import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const deno = require.resolve('deno/bin.cjs');
const updateLock = process.argv.includes('--update-lock');
const entries = readdirSync(new URL('../supabase/functions/', import.meta.url), { withFileTypes: true })
  .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
  .map(entry => `supabase/functions/${entry.name}/index.ts`).sort();
const tests = readdirSync(new URL('../supabase/tests/', import.meta.url))
  .filter(name => name.endsWith('.deno.ts')).map(name => `supabase/tests/${name}`).sort();

function run(args) {
  const result = spawnSync(process.execPath, [deno, ...args], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Type checking resolves imports but never starts handlers or contacts application services.
const config = ['--config', 'supabase/deno.json', `--frozen-lockfile=${!updateLock}`];
run(['check', ...config, ...entries, ...tests]);
run(['test', ...config, ...tests]); // No network/env permissions: fixtures only.
run(['audit', '--lock', 'supabase/deno.lock', '--frozen-lockfile']);
