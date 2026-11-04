import axios from 'axios';
import { z } from 'zod';
import type { OutProblem } from '../utils/types';

export const handleSchema = z.string().trim().regex(/^[A-Za-z0-9_.-]{1,24}$/, 'Use a valid Codeforces handle (up to 24 characters).');
const submission = z.object({
  id: z.number().int().positive(), creationTimeSeconds: z.number().int().nonnegative().max(4102444800), verdict: z.string().optional(),
  problem: z.object({contestId:z.number().int().positive().optional(),index:z.string().regex(/^[A-Za-z0-9]{1,12}$/),name:z.string().max(500),rating:z.number().int().min(0).max(10000).optional(),tags:z.array(z.string().max(100)).max(100).optional()}),
});
export const submissionsSchema = z.object({status:z.literal('OK'),result:z.array(submission).max(50000)});
export type Submission = z.infer<typeof submission>;
export async function fetchSubmissions(handle: string): Promise<Submission[]> {
  const valid = handleSchema.parse(handle);
  const response = await axios.get('https://codeforces.com/api/user.status', {
    params:{handle:valid,from:1,count:50001},timeout:20000,signal:AbortSignal.timeout(20000),maxRedirects:0,maxContentLength:32*1024*1024,
  });
  const parsed=submissionsSchema.safeParse(response.data);
  if (!parsed.success) throw new Error('Codeforces returned invalid data or more than 50,000 submissions. No partial totals were saved.');
  return parsed.data.result;
}
export function buildLadder(user: Submission[], expert: Submission[]) {
  const solved=new Map<string,number>();
  for(const s of user){
    if(s.verdict!=='OK'||!s.problem.contestId)continue;
    const key=`${s.problem.contestId}-${s.problem.index}`;
    solved.set(key,Math.min(solved.get(key)??Infinity,s.creationTimeSeconds));
  }
  const heatmap:Record<string,number>={};
  for(const timestamp of solved.values()){
    const day=new Date(timestamp*1000).toISOString().slice(0,10);heatmap[day]=(heatmap[day]??0)+1;
  }
  const seen=new Set<string>();const probs:OutProblem[]=[];
  for(const s of expert){
    const p=s.problem;if(s.verdict!=='OK'||!p.contestId||p.rating===undefined)continue;
    const key=`${p.contestId}-${p.index}`;if(seen.has(key))continue;seen.add(key);
    probs.push({id:s.id,cid:p.contestId,letter:p.index,name:p.name,rating:p.rating,tags:p.tags??[],status:solved.has(key)?'solved':'unsolved'});
  }
  probs.sort((a,b)=>a.rating-b.rating||a.cid-b.cid||a.letter.localeCompare(b.letter));
  return {probs,heatmap,solvedCount:solved.size};
}

// Per-process budget, including failures; deployments need an ingress rate limit too.
let active=0;let attempts:number[]=[];
export function reserveRequest(now=Date.now()) {
  attempts=attempts.filter(t=>now-t<60000);
  if(active>=2||attempts.length>=20)throw new Error('The server is busy. Try again in a minute.');
  active++;attempts.push(now);let released=false;
  return ()=>{if(!released){released=true;active--;}};
}
