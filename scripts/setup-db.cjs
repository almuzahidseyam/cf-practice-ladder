const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
// Prisma's Windows schema engine requires the SQLite file to exist first.
// Exclusive creation preserves an existing database and never resets its data.
try{fs.closeSync(fs.openSync(path.join(root,'prisma/dev.db'),'wx'));}catch(error){if(error.code!=='EEXIST')throw error;}
const result=spawnSync(process.execPath,[path.join(root,'node_modules/prisma/build/index.js'),'db','push','--schema',path.join(root,'prisma/schema.prisma')],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
