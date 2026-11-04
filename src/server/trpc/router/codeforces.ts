import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { buildLadder, fetchSubmissions, handleSchema, reserveRequest } from '../../ladder';
export const codeforcesRouter=router({
  getProbs:publicProcedure.input(z.object({user:handleSchema,expert:handleSchema})).mutation(async({input,ctx})=>{
    let release:()=>void;
    try{release=reserveRequest();}catch{throw new TRPCError({code:'TOO_MANY_REQUESTS',message:'The server is busy. Try again in a minute.'});}
    try{
      const [user,expert]=await Promise.allSettled([fetchSubmissions(input.user),fetchSubmissions(input.expert)]);
      if(user.status!=='fulfilled'||expert.status!=='fulfilled')throw new Error('Upstream unavailable');
      const result=buildLadder(user.value,expert.value);let leaderboardSaved=true;
      try{await ctx.prisma.userStats.upsert({where:{handle:input.user.toLowerCase()},update:{solvedCount:result.solvedCount,lastUpdated:new Date()},create:{handle:input.user.toLowerCase(),solvedCount:result.solvedCount}});}
      catch{leaderboardSaved=false;}
      return {...result,leaderboardSaved};
    }catch{throw new TRPCError({code:'INTERNAL_SERVER_ERROR',message:'Could not load complete Codeforces data. Check both handles and try later. The demo supports up to 50,000 submissions per handle.'});}
    finally{release();}
  }),
  getLeaderboard:publicProcedure.query(async({ctx})=>{
    try{return await ctx.prisma.userStats.findMany({orderBy:[{solvedCount:'desc'},{handle:'asc'}],take:50});}
    catch{throw new TRPCError({code:'INTERNAL_SERVER_ERROR',message:'Leaderboard storage is unavailable. The operator must initialize the database.'});}
  }),
});
