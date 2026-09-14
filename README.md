# CF Practice Ladder (Premium v3.0.0)

A focused Codeforces practice ladder. Enter your handle and a reference handle to see the unique accepted problems solved by the reference user, grouped by rating and marked with your solved/unsolved status.

## Highlights (v3.0.0 Premium Features)

- **Contribution Heatmap:** Visualize your Codeforces problem-solving consistency over the last 365 days.
- **Time Tracker:** Built-in persistent stopwatch for every unsolved problem. Time your practice!
- **Global Leaderboard:** Compete with others! A database-backed leaderboard ranks users by their total solved problems.
- Rating-by-rating problem ladder with Solved/Remaining progress summary.
- Saved handle matchups in browser storage (localStorage).
- Responsive desktop/mobile interface with Light/dark and DaisyUI theme support.

## Run locally

```bash
npm install

# Initialize and sync the SQLite Database
npx prisma db push

# Start the dev server
npm run dev
```

Then open `http://localhost:3000`.

## Production build

```bash
npm run build
npm start
```

## Data & Database

Codeforces submission data is fetched through the public Codeforces API. Matchups and Stopwatch timers are kept in the browser using `localStorage`. 

**Database Setup:** A local SQLite database is utilized via **Prisma** to track user statistics and power the Leaderboard. For Vercel or cloud deployments, you can easily change the Prisma provider in `prisma/schema.prisma` to `postgresql` or `mysql` and provide a `DATABASE_URL`.

## Credit

Original project credit: [anirudtate](https://codeforces.com/profile/anirudtate)
