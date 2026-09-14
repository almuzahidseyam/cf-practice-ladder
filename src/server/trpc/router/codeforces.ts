import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import axios from "axios";
import { OutProblem, Result, Root } from "../../../utils/types";

export const codeforcesRouter = router({
  getProbs: publicProcedure
    .input(z.object({ user: z.string(), expert: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = input.user.trim();
      const expert = input.expert.trim();
      if (user == "") return undefined;
      if (expert == "") return undefined;
      try {
        const userRes = await axios.get("https://codeforces.com/api/user.status?handle=" + user)
        const expertRes = await axios.get("https://codeforces.com/api/user.status?handle=" + expert)
        const userJson: Root = await userRes.data;
        const userProbs: Result[] = userJson.result;

        const userSolved = new Map<string, boolean>();
        const heatmapData: Record<string, number> = {};

        userProbs.forEach((userprob: Result) => {
          if (userprob.verdict !== "OK") return;
          
          // Track unique problems solved for ladder
          userSolved.set(`${userprob.problem.contestId}-${userprob.problem.index}`, true);
          
          // Track heatmap data (problems solved per day)
          if (userprob.creationTimeSeconds) {
            // creationTimeSeconds is in seconds, convert to MS
            const date = new Date(userprob.creationTimeSeconds * 1000);
            const dateStr = date.toISOString().split('T')[0] as string;
            heatmapData[dateStr] = (heatmapData[dateStr] || 0) + 1;
          }
        });

        // Upsert user stats in DB for leaderboard
        try {
          await ctx.prisma.userStats.upsert({
            where: { handle: user },
            update: { solvedCount: userSolved.size, lastUpdated: new Date() },
            create: { handle: user, solvedCount: userSolved.size },
          });
        } catch (dbErr) {
          console.error("Failed to update user stats", dbErr);
        }

        const expertJson: Root = await expertRes.data;
        const expertProbs: Result[] = expertJson.result;

        const probNames: Set<string> = new Set();
        const probsInfo: Array<OutProblem> = [];

        expertProbs.forEach((expertprob: Result) => {
          if (expertprob.verdict !== "OK") return;
          if (expertprob.problem.rating == undefined) return;
          const name: string = expertprob.problem.name;
          const problemKey = `${expertprob.problem.contestId}-${expertprob.problem.index}`;
          if (probNames.has(problemKey)) return;
          probNames.add(problemKey);
          const obj: OutProblem = {
            id: expertprob.id,
            cid: expertprob.problem.contestId,
            status: userSolved.get(problemKey) === true ? "solved" : "unsolved",
            rating: expertprob.problem.rating,
            name: name,
            letter: expertprob.problem.index,
            tags: expertprob.problem.tags ?? [],
          };
          probsInfo.push(obj);
        });
        probsInfo.sort((a, b) => a.rating - b.rating);
        
        return {
          probs: probsInfo,
          heatmap: heatmapData,
        };
      }
      catch (e) {
        return "wrong";
      }
    }),

  getLeaderboard: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.userStats.findMany({
      orderBy: { solvedCount: 'desc' },
      take: 50,
    });
  }),
});
