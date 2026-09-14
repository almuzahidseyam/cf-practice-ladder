import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import ThemeChange from "../utils/ThemeChange";
import { trpc } from "../utils/trpc";

const Leaderboard: NextPage = () => {
  const { data, isLoading } = trpc.codeforces.getLeaderboard.useQuery();

  return (
    <>
      <Head>
        <title>Leaderboard | CF Practice Ladder</title>
      </Head>
      <main className="max-w-4xl mx-auto p-4 min-h-screen">
        <div className="flex flex-row justify-between items-center w-full mb-6 mt-4">
          <div>
            <h1 className="text-3xl font-black text-primary">Leaderboard</h1>
            <p className="text-base-content/50 text-sm mt-1">Top solvers on this ladder</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="btn btn-ghost btn-sm">← Back to Practice</Link>
            <ThemeChange className="" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center mt-20">
            <div className="cf-spinner cf-spinner-lg text-primary"></div>
          </div>
        ) : (
          <div className="bg-base-200 rounded-xl overflow-hidden">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="w-16 text-center bg-base-300">Rank</th>
                  <th className="bg-base-300">Handle</th>
                  <th className="text-right bg-base-300">Total Solved</th>
                  <th className="text-right hidden sm:table-cell bg-base-300">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((user: { handle: string; solvedCount: number; lastUpdated: Date | string }, idx: number) => (
                  <tr key={user.handle} className="hover">
                    <td className="text-center font-bold text-base-content/50">{idx + 1}</td>
                    <td className="font-bold">
                      <a 
                        href={`https://codeforces.com/profile/${user.handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        {user.handle}
                      </a>
                    </td>
                    <td className="text-right text-lg font-black text-success">{user.solvedCount}</td>
                    <td className="text-right hidden sm:table-cell text-xs text-base-content/40 font-mono">
                      {new Date(user.lastUpdated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-base-content/40">
                      No users on the leaderboard yet. Start practicing!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
};

export default Leaderboard;
