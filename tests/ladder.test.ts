import {test} from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PrismaClient} from '@prisma/client';
import {buildLadder,handleSchema,submissionsSchema,fetchSubmissions,reserveRequest,type Submission} from '../src/server/ladder';
import {appRouter} from '../src/server/trpc/router/_app';
const item=(id:number,time:number,contest=1,index='A',rating=800):Submission=>({id,creationTimeSeconds:time,verdict:'OK',problem:{contestId:contest,index,name:'Fixture',rating,tags:[]}});

test('duplicate accepts count once on the earliest UTC day regardless of input order',()=>{
  const result=buildLadder([item(2,172800),item(1,86400),item(3,86401,2)],[item(4,200000),item(5,200001),item(6,200002,3)]);
  assert.equal(result.solvedCount,2);assert.deepEqual(result.heatmap,{'1970-01-02':2});
  assert.equal(result.probs.length,2);assert.deepEqual(result.probs.map(p=>p.status),['solved','unsolved']);
});
test('wrong answers, unrated reference problems and missing contest IDs are excluded appropriately',()=>{
  const wrong={...item(1,1),verdict:'WRONG_ANSWER'};const unrated=item(2,2);delete unrated.problem.rating;
  const noContest=item(3,3);delete noContest.problem.contestId;
  const r=buildLadder([wrong,noContest],[wrong,unrated,noContest]);assert.equal(r.solvedCount,0);assert.deepEqual(r.probs,[]);
});
test('empty complete API response is a genuine empty ladder',()=>assert.deepEqual(buildLadder([],[]),{probs:[],heatmap:{},solvedCount:0}));
test('handles reject URL/query injection and excessive length',()=>{
  for(const bad of ['', 'a&count=1','../name','x'.repeat(25)])assert.equal(handleSchema.safeParse(bad).success,false);
  assert.equal(handleSchema.parse(' Tourist '),'Tourist');
});
test('failed/malformed/oversized upstream data cannot become partial totals',()=>{
  for(const data of [{status:'FAILED',result:[]},{status:'OK',result:[{}]},{status:'OK',result:Array(50001).fill(item(1,1))},{status:'OK',result:[{...item(1,1),creationTimeSeconds:Infinity}]}])assert.equal(submissionsSchema.safeParse(data).success,false);
});
test('transport has fixed origin, escaped params, no redirects and finite time/byte limits',async()=>{
  const get=axios.get;axios.get=async(url,options)=>{assert.equal(url,'https://codeforces.com/api/user.status');assert.deepEqual(options?.params,{handle:'Tourist',from:1,count:50001});assert.equal(options?.maxRedirects,0);assert.equal(options?.timeout,20000);assert.equal(options?.maxContentLength,33554432);return {data:{status:'OK',result:[]}} as never;};
  try{assert.deepEqual(await fetchSubmissions('Tourist'),[]);}finally{axios.get=get;}
});
test('request reservation bounds concurrency and release is idempotent',()=>{
  const a=reserveRequest(),b=reserveRequest();assert.throws(()=>reserveRequest(),/busy/);a();a();const c=reserveRequest();b();c();
});
test('real SQLite stores unique totals, canonical handle and persists across reconnect; upstream failure is typed',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'cf-ladder-test-'));const url='file:'+join(dir,'test.db').replaceAll('\\','/');
  const db=new PrismaClient({datasources:{db:{url}}});const original=axios.get;
  try{
    await db.$executeRawUnsafe('CREATE TABLE UserStats (handle TEXT PRIMARY KEY, solvedCount INTEGER NOT NULL, lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)');
    const caller=appRouter.createCaller({prisma:db});axios.get=async()=>({data:{status:'OK',result:[item(1,1),item(2,2)]}} as never);
    const r=await caller.codeforces.getProbs({user:'Tourist',expert:'reference'});assert.equal(r.leaderboardSaved,true);assert.equal(r.solvedCount,1);
    await caller.codeforces.getProbs({user:'tourist',expert:'reference'});assert.equal(await db.userStats.count(),1);
    await db.$disconnect();assert.equal((await db.userStats.findUniqueOrThrow({where:{handle:'tourist'}})).solvedCount,1);
    axios.get=async()=>{throw Error('network down');};await assert.rejects(caller.codeforces.getProbs({user:'new',expert:'reference'}),/complete Codeforces data/);assert.equal(await db.userStats.count(),1);
    await db.$executeRawUnsafe('DROP TABLE UserStats');axios.get=async()=>({data:{status:'OK',result:[]}} as never);
    assert.equal((await caller.codeforces.getProbs({user:'new',expert:'reference'})).leaderboardSaved,false);
    await assert.rejects(caller.codeforces.getLeaderboard(),/storage is unavailable/);
  }finally{axios.get=original;await db.$disconnect();await rm(dir,{recursive:true,force:true});}
});
