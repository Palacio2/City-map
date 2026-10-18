import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
const files = [...new Set(execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {encoding:'utf8'}).split('\0').filter(Boolean))];
const rules = [
 ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
 ['stripe-secret', /\b[rs]k_(?:live|test)_[A-Za-z0-9]{20,}\b/g],
 ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/g],
 ['github-token', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
 ['supabase-secret', /\bsb_secret_[A-Za-z0-9_-]{30,}\b/g],
];
const findings=[];
let scanned=0;
for (const file of files) {
 try {
  if(statSync(file).size > 5_000_000) continue;
  const source=readFileSync(file,'utf8');
  if(source.includes('\0')) continue;
  scanned++;
  for(const [kind,pattern] of rules) for(const match of source.matchAll(pattern)) findings.push({file,kind,line:source.slice(0,match.index).split('\n').length});
  for(const match of source.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)) {
   try { if(JSON.parse(Buffer.from(match[0].split('.')[1],'base64url').toString()).role==='service_role') findings.push({file,kind:'supabase-service-role',line:source.slice(0,match.index).split('\n').length}); } catch {}
  }
 } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
console.log(JSON.stringify({scanned,findings},null,2));
process.exitCode = findings.length ? 1 : 0;
