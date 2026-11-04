const {spawn}=require('node:child_process');const path=require('node:path');
const server=spawn(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','4186'],{stdio:'inherit'});
(async()=>{
  try{
    let ready=false;for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4186')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
    if(!ready)throw Error('Application did not start');
    await new Promise((resolve,reject)=>{const tests=spawn(process.execPath,['tests/http.cjs'],{stdio:'inherit'});tests.on('error',reject);tests.on('exit',code=>code===0?resolve():reject(Error('HTTP tests failed')));});
  }finally{server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
