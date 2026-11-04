# CF Practice Ladder

Compare two Codeforces handles to build a rating-based practice list from the reference user's accepted problems. Each problem appears once; your accepted problems are marked solved.

## Run

Use Node.js 24 and npm. This version uses Next.js 16's Pages Router, tRPC 10, React 18 and Prisma 6. React 18 remains supported by this pinned Next.js version but is deprecated for the next major; upgrading that major requires a coordinated React/tRPC migration.

```sh
npm ci
npm run db:setup
npm run dev
```

Open http://localhost:3000. `db:setup` creates the local SQLite file if absent and synchronizes the declared schema. It does not reset existing rows or accept destructive schema changes automatically. Back up an existing database before any future schema migration. Stop the app before installing dependencies on Windows, where a running Prisma engine locks its DLL.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:http
npm audit --audit-level=low
npm start
```

## Data and boundaries

- Requests use the fixed Codeforces HTTPS API, validated handles, no redirects, a 20-second deadline and a 32 MiB response cap per handle.
- Up to 50,000 submissions per handle are supported. Oversized, malformed or failed responses produce an error, never a partial leaderboard total.
- Heatmap cells count **unique first-time accepted problems**, assigned to their earliest acceptance day in UTC. Repeat accepts do not increase the total. The visible window is 365 UTC days.
- Leaderboard counts are snapshots refreshed when a ladder is built, not proof of account ownership or live Codeforces rankings. New handles are stored case-insensitively. If upgrading an old database containing differently cased duplicate handles, review and consolidate those historical rows before presenting it as a clean ranking.
- Two requests may be active per process, with at most 20 attempts per minute. This includes failed attempts. Shared/public deployments also need an ingress rate limit; this is not a distributed quota.
- Database failure leaves a successfully built ladder usable but visibly reports that its leaderboard entry could not be saved. Missing storage does not appear as an empty ranking.
- Matchups and stopwatch values use optional browser storage. Storage failure does not crash the page; values may be lost on reload. Stopwatch values track active tab timer ticks, not independently verified study time.
- SQLite is suitable for a single persistent local instance. A serverless deployment needs a deliberate database migration and persistent service; changing a provider name alone is not sufficient.

Eight tests check unique/UTC counts, invalid and oversized input, transport bounds, concurrency and a real disposable SQLite round trip. Production HTTP checks exercise the built pages, readable validation errors, body-size rejection and leaderboard delivery without contacting Codeforces. Windows and Linux CI run all checks. Browser review covers the mobile form, error and leaderboard screens; it is not a certification of every theme.

`deepmerge-ts` is overridden to patched 8.0.2 for Prisma's configuration dependency; Prisma generation, schema synchronization, real queries and production startup are verified with it. Historical release reports and `live-preview.html` describe earlier snapshots, not the current verification result.

Original project credit: [anirudtate](https://codeforces.com/profile/anirudtate). See LICENSE.
