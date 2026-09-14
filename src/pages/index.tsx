import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ThemeChange from "../utils/ThemeChange";
import { trpc } from "../utils/trpc";
import type { OutProblem } from "../utils/types";
import { Heatmap } from "../components/Heatmap";

type SavedMatchup = {
  user: string;
  expert: string;
};

const LAST_SESSION_KEY = "cf-ladder:last-session";
const SAVED_MATCHUPS_KEY = "cf-ladder:saved-matchups";

const Home: NextPage = () => {
  const [user, setUser] = useState("");
  const [expert, setExpert] = useState("");
  const [page, setPage] = useState<number | null>(null);
  const [savedMatchups, setSavedMatchups] = useState<SavedMatchup[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const probs = trpc.codeforces.getProbs.useMutation();

  useEffect(() => {
    try {
      const lastSession = localStorage.getItem(LAST_SESSION_KEY);
      const saved = localStorage.getItem(SAVED_MATCHUPS_KEY);

      if (lastSession) {
        const parsed = JSON.parse(lastSession) as SavedMatchup & { rating?: number | null };
        setUser(parsed.user ?? "");
        setExpert(parsed.expert ?? "");
        if (typeof parsed.rating === "number") setPage(parsed.rating);
      }

      if (saved) setSavedMatchups(JSON.parse(saved) as SavedMatchup[]);
    } catch {
      // Ignore malformed browser storage and start with a clean state.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      LAST_SESSION_KEY,
      JSON.stringify({ user, expert, rating: page })
    );
  }, [user, expert, page, hydrated]);

  const allProblems: OutProblem[] = probs.data && typeof probs.data === 'object' && 'probs' in probs.data ? probs.data.probs : [];
  const heatmapData = probs.data && typeof probs.data === 'object' && 'heatmap' in probs.data ? (probs.data.heatmap as Record<string, number>) : null;

  const ratings = useMemo(() => {
    return [...new Set(allProblems.map((problem) => problem.rating))].sort(
      (a, b) => a - b
    );
  }, [allProblems]);

  useEffect(() => {
    if (!ratings.length) return;
    if (page === null || !ratings.includes(page)) setPage(ratings[0] ?? null);
  }, [ratings, page]);

  const visibleProblems = useMemo(() => {
    if (page === null) return [];
    return allProblems.filter((problem) => problem.rating === page);
  }, [allProblems, page]);

  const solvedCount = visibleProblems.filter(
    (problem) => problem.status === "solved"
  ).length;
  const progress = visibleProblems.length
    ? Math.round((solvedCount / visibleProblems.length) * 100)
    : 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanUser = user.trim();
    const cleanExpert = expert.trim();
    if (!cleanUser || !cleanExpert) return;
    setUser(cleanUser);
    setExpert(cleanExpert);
    probs.mutate({ user: cleanUser, expert: cleanExpert });
  };

  const saveMatchup = () => {
    const cleanUser = user.trim();
    const cleanExpert = expert.trim();
    if (!cleanUser || !cleanExpert) return;

    const next = [
      { user: cleanUser, expert: cleanExpert },
      ...savedMatchups.filter(
        (item) => item.user !== cleanUser || item.expert !== cleanExpert
      ),
    ].slice(0, 8);

    setSavedMatchups(next);
    localStorage.setItem(SAVED_MATCHUPS_KEY, JSON.stringify(next));
  };

  const removeMatchup = (target: SavedMatchup) => {
    const next = savedMatchups.filter(
      (item) => item.user !== target.user || item.expert !== target.expert
    );
    setSavedMatchups(next);
    localStorage.setItem(SAVED_MATCHUPS_KEY, JSON.stringify(next));
  };

  const loadMatchup = (matchup: SavedMatchup) => {
    setUser(matchup.user);
    setExpert(matchup.expert);
    probs.mutate(matchup);
  };

  const hasResults = probs.data && typeof probs.data === 'object' && 'probs' in probs.data;
  const error = probs.data === "wrong";

  return (
    <>
      <Head>
        <title>CF Ladder — Practice by Rating</title>
        <meta
          name="description"
          content="Find Codeforces problems solved by another handle and practice them rating by rating."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-base-200/60">
        <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-5 lg:grid-cols-[340px_1fr] lg:px-6 lg:py-6">
          <aside className="h-fit rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm lg:sticky lg:top-6">
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Codeforces practice tool
                </div>
                <h1 className="text-3xl font-black tracking-tight">CF Ladder</h1>
                <p className="mt-1 text-sm leading-6 text-base-content/60">
                  See what a stronger handle solved, then climb one rating at a time.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <ThemeChange className="" />
                <Link href="/leaderboard" className="btn btn-sm btn-outline btn-primary mt-2">
                  🏆 Leaderboard
                </Link>
              </div>
            </header>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="form-control w-full">
                <div className="label pb-1">
                  <span className="label-text font-semibold">Your Codeforces handle</span>
                </div>
                <input
                  required
                  autoFocus
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  type="text"
                  placeholder="e.g. anirudtate"
                  className="input input-bordered w-full focus:input-primary"
                />
              </label>

              <label className="form-control w-full">
                <div className="label pb-1">
                  <span className="label-text font-semibold">Reference handle</span>
                </div>
                <input
                  required
                  value={expert}
                  onChange={(e) => setExpert(e.target.value)}
                  type="text"
                  placeholder="e.g. tourist"
                  className="input input-bordered w-full focus:input-primary"
                />
                <div className="label pb-0">
                  <span className="label-text-alt text-base-content/50">
                    Problems are taken from this handle&apos;s accepted submissions.
                  </span>
                </div>
              </label>

              {error && (
                <div className="alert alert-error py-3 text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Could not load these handles. Check the spelling and try again.</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={probs.isLoading}
              >
                {probs.isLoading && <span className="cf-spinner" />}
                {probs.isLoading ? "Fetching ladder" : "Build my ladder"}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm w-full"
                onClick={saveMatchup}
                disabled={!user.trim() || !expert.trim()}
              >
                ☆ Save this matchup
              </button>
            </form>

            {savedMatchups.length > 0 && (
              <section className="mt-6 border-t border-base-300 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-base-content/45">
                    Saved matchups
                  </h2>
                  <span className="text-xs text-base-content/40">
                    {savedMatchups.length}/8
                  </span>
                </div>
                <div className="space-y-2">
                  {savedMatchups.map((matchup) => (
                    <div
                      key={`${matchup.user}-${matchup.expert}`}
                      className="group flex items-center gap-2 rounded-2xl border border-base-300 p-2"
                    >
                      <button
                        type="button"
                        onClick={() => loadMatchup(matchup)}
                        className="min-w-0 flex-1 rounded-xl px-2 py-1 text-left hover:bg-base-200"
                      >
                        <div className="truncate text-sm font-bold">{matchup.user}</div>
                        <div className="truncate text-xs text-base-content/45">
                          vs {matchup.expert}
                        </div>
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs opacity-60 group-hover:opacity-100"
                        onClick={() => removeMatchup(matchup)}
                        aria-label={`Remove ${matchup.user} versus ${matchup.expert}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {heatmapData && (
              <div className="mt-6 border-t border-base-300 pt-5">
                <Heatmap data={heatmapData} />
              </div>
            )}

            <footer className="mt-8 text-center text-[11px] text-base-content/40">
              Original project credit:{" "}
              <a
                className="link link-hover font-semibold"
                href="https://codeforces.com/profile/anirudtate"
                target="_blank"
                rel="noopener noreferrer"
              >
                anirudtate
              </a>
            </footer>
          </aside>

          <section className="min-w-0">
            {!hasResults && !probs.isLoading && !error && (
              <div className="flex min-h-[72vh] items-center justify-center rounded-3xl border border-dashed border-base-300 bg-base-100/70 p-8 text-center">
                <div className="max-w-md">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                    ↗
                  </div>
                  <h2 className="text-2xl font-black">Build a focused practice ladder</h2>
                  <p className="mt-3 leading-7 text-base-content/55">
                    Enter your handle and a reference handle. CF Ladder will group their unique accepted problems by rating and mark the ones you already solved.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-2 text-left text-xs">
                    <div className="rounded-2xl bg-base-200 p-3">
                      <div className="mb-1 font-black text-primary">01</div>
                      Pick two handles
                    </div>
                    <div className="rounded-2xl bg-base-200 p-3">
                      <div className="mb-1 font-black text-primary">02</div>
                      Choose a rating
                    </div>
                    <div className="rounded-2xl bg-base-200 p-3">
                      <div className="mb-1 font-black text-primary">03</div>
                      Solve & climb
                    </div>
                  </div>
                </div>
              </div>
            )}

            {probs.isLoading && (
              <div className="flex min-h-[72vh] items-center justify-center rounded-3xl bg-base-100">
                <div className="text-center">
                  <span className="cf-spinner cf-spinner-lg text-primary" />
                  <p className="mt-4 text-sm font-semibold text-base-content/55">
                    Reading Codeforces submissions…
                  </p>
                </div>
              </div>
            )}

            {hasResults && !probs.isLoading && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-base-content/40">
                        Active ladder
                      </p>
                      <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                        {user} <span className="text-base-content/25">→</span> {expert}
                      </h2>
                      <p className="mt-2 text-sm text-base-content/50">
                        Rating {page ?? "—"} · {visibleProblems.length} problems in this step
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:min-w-[390px]">
                      <Stat label="Solved" value={solvedCount} />
                      <Stat label="Remaining" value={visibleProblems.length - solvedCount} />
                      <Stat label="Progress" value={`${progress}%`} />
                    </div>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-base-200">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h3 className="font-black">Choose rating</h3>
                    <span className="text-xs text-base-content/45">
                      {ratings.length} levels available
                    </span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {ratings.map((rating) => {
                      const ratingProblems = allProblems.filter(
                        (problem) => problem.rating === rating
                      );
                      const ratingSolved = ratingProblems.filter(
                        (problem) => problem.status === "solved"
                      ).length;
                      return (
                        <button
                          type="button"
                          className={`btn btn-sm min-w-[78px] rounded-xl ${
                            page === rating ? "btn-primary" : "btn-ghost bg-base-200"
                          }`}
                          key={rating}
                          onClick={() => setPage(rating)}
                        >
                          <span>{rating}</span>
                          <span className="text-[10px] opacity-60">
                            {ratingSolved}/{ratingProblems.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
                  <div className="flex items-center justify-between border-b border-base-300 px-5 py-4 sm:px-6">
                    <div>
                      <h3 className="font-black">Problem queue</h3>
                      <p className="text-xs text-base-content/45">
                        Start with an unsolved problem and keep moving down the list.
                      </p>
                    </div>
                    <div className="badge badge-primary badge-outline">Rating {page}</div>
                  </div>

                  {visibleProblems.length ? (
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th className="w-16 text-center">#</th>
                            <th>Problem</th>
                            <th className="hidden md:table-cell">Contest</th>
                            <th className="text-center">Status</th>
                            <th className="text-right">Links</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleProblems.map((prob: OutProblem, index: number) => (
                            <ProblemRow key={`${prob.cid}-${prob.letter}`} prob={prob} index={index} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-10 text-center text-sm text-base-content/45">
                      No problems found at this rating.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-2xl bg-base-200 p-3 sm:p-4">
    <div className="text-xl font-black sm:text-2xl">{value}</div>
    <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-base-content/40">
      {label}
    </div>
  </div>
);

const ProblemRow = ({ prob, index }: { prob: OutProblem; index: number }) => {
  const solved = prob.status === "solved";
  const problemUrl = `https://codeforces.com/contest/${prob.cid}/problem/${prob.letter}`;
  const submissionUrl = `https://codeforces.com/contest/${prob.cid}/submission/${prob.id}`;

  const timerKey = `cf-ladder-timer-${prob.cid}-${prob.letter}`;
  
  // State for stopwatch
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    try {
      const savedTimer = localStorage.getItem(timerKey);
      if (savedTimer) {
        setTime(parseInt(savedTimer, 10));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [timerKey]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !solved) {
      interval = setInterval(() => {
        setTime((prev) => {
          const newTime = prev + 1;
          localStorage.setItem(timerKey, newTime.toString());
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, solved, timerKey]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <tr className="hover">
      <th className="text-center text-base-content/35">{index + 1}</th>
      <td className="max-w-lg whitespace-normal">
        <a
          className="font-bold hover:text-primary hover:underline"
          target="_blank"
          href={problemUrl}
          rel="noopener noreferrer"
        >
          {prob.name}
        </a>
        {prob.tags?.length ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {prob.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge badge-ghost badge-sm text-[10px]">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </td>
      <td className="hidden font-mono text-xs text-base-content/50 md:table-cell">
        {prob.cid}{prob.letter}
      </td>
      <td className="text-center">
        <div className="flex flex-col items-center gap-1">
          <span className={`badge ${solved ? "badge-success" : "badge-error"} badge-outline whitespace-nowrap`}>
            {solved ? "✓ solved" : "unsolved"}
          </span>
          {!solved && (
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs w-12 text-right">{formatTime(time)}</span>
              <button 
                onClick={() => setIsRunning(!isRunning)} 
                className={`btn btn-xs btn-circle ${isRunning ? "btn-warning" : "btn-primary"}`}
                title={isRunning ? "Pause" : "Start"}
              >
                {isRunning ? "⏸" : "▶"}
              </button>
              {time > 0 && !isRunning && (
                <button 
                  onClick={() => { setTime(0); localStorage.removeItem(timerKey); }} 
                  className="btn btn-xs btn-circle btn-ghost"
                  title="Reset"
                >
                  🔄
                </button>
              )}
            </div>
          )}
          {solved && time > 0 && (
            <span className="font-mono text-xs text-success mt-1">
              Solved in {formatTime(time)}
            </span>
          )}
        </div>
      </td>
      <td className="text-right">
        <div className="inline-flex gap-1">
          <a className="btn btn-ghost btn-xs" target="_blank" href={problemUrl} rel="noopener noreferrer">
            open
          </a>
          <a className="btn btn-ghost btn-xs" target="_blank" href={submissionUrl} rel="noopener noreferrer">
            code
          </a>
        </div>
      </td>
    </tr>
  );
};

export default Home;
