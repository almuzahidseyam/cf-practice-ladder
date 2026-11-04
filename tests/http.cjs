const assert=require('node:assert/strict');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4186';
(async()=>{
  for(const path of ['/','/leaderboard']){const r=await fetch(origin+path);assert.equal(r.status,200);assert.match(await r.text(),/CF Practice Ladder|CF Ladder/);}
  const endpoint=origin+'/api/trpc/codeforces.getProbs';
  const invalid=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({json:{user:'bad&handle',expert:'reference'}})});
  assert.equal(invalid.status,400);assert.match(JSON.stringify(await invalid.json()),/Enter valid Codeforces handles/);
  const huge=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({json:{user:'x'.repeat(5000),expert:'reference'}})});assert.equal(huge.status,413);
  const leaderboard=await fetch(origin+'/api/trpc/codeforces.getLeaderboard');assert.equal(leaderboard.status,200);assert.ok(Array.isArray((await leaderboard.json()).result.data.json));
  console.log('Actual production HTTP routes: pages, readable invalid-handle response, body limit and SQLite leaderboard passed. No Codeforces requests sent.');
})().catch(e=>{console.error(e);process.exitCode=1});
