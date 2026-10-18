import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
function run(command,args,options={}) {
  const result=spawnSync(command,args,{cwd:root,stdio:'inherit',shell:false,...options});
  if(result.error || result.status!==0) throw new Error(`${command} failed (${result.status ?? result.error?.code})`);
}

// No connection URL, linked project, env files or production credentials are
// copied. A new local project prevents resetting an existing developer DB.
async function main() {
  run('docker',['info','--format','{{.ServerVersion}}']);
  run('supabase',['--version']);
  const project=`city-maps-reset-${randomUUID()}`;
  const workspace=join(root,'scratch',project);
  const directory=join(workspace,'supabase');
  await mkdir(directory,{recursive:true});
  const config=await readFile(join(root,'supabase','config.toml'),'utf8');
  if(!/^project_id\s*=\s*"[^"]+"/m.test(config)) throw new Error('Missing local project_id');
  await writeFile(join(directory,'config.toml'),config.replace(/^project_id\s*=\s*"[^"]+"/m,`project_id = "${project}"`));
  await cp(join(root,'supabase','migrations'),join(directory,'migrations'),{recursive:true});
  console.log(`Clean migration verification: ${project}`);
  let succeeded=false;
  try {
    run('supabase',['start','--workdir',workspace,'--exclude','studio,edge-runtime,logflare,vector,imgproxy']);
    run('supabase',['db','reset','--local','--no-seed','--workdir',workspace]);
    succeeded=true;
    console.log('PASS: complete migration chain restored into a fresh local Supabase database.');
  } finally {
    // Only the disposable project generated above; never --all or --linked.
    try {run('supabase',['stop','--project-id',project,'--no-backup','--workdir',workspace]);}
    catch(error) {if(succeeded) throw error;console.error('Disposable project cleanup failed; inspect Docker.');}
  }
}
main().catch(error=>{console.error(`Clean database check failed: ${error.message}`);process.exitCode=1;});
