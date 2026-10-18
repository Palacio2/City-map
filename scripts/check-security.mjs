import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const suites = {
  'server/services': /^(outboundPolicy|pbfFiles|parserAuthorization|parserCore|gusService)\.test\.js$/,
  'server/middleware': /^adminAuthorization\.test\.js$/,
  'server/controllers': /^authorization\.test\.js$/,
  shared: /\.test\.mjs$/,
  'supabase/tests': /\.test\.(mjs|ts)$/,
  'supabase/functions/_shared': /\.test\.ts$/,
};
// Deno suites and live security-smoke.mjs deliberately run separately.
const files = Object.entries(suites).flatMap(([directory, pattern]) =>
  readdirSync(new URL(`../${directory}/`, import.meta.url))
    .filter(name => pattern.test(name)).map(name => `${directory}/${name}`)).sort();
if (process.argv.includes('--list')) console.log(files.join('\n'));
else {
  const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
