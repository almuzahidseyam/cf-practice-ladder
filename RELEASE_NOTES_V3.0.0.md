# Release Notes v3.0.0 (Premium Update)

We're incredibly excited to launch the **v3.0.0 Premium Update** of CF Practice Ladder! This release introduces massive features for serious competitive programmers to track their progress, analyze their consistency, and compete with others.

## 🚀 New Features

### 1. Contribution Heatmap
* **GitHub-style Contribution Graph:** See your Codeforces activity over the last 365 days visually represented on the sidebar.
* The Heatmap intelligently parses your Codeforces API submission data and maps out your daily problem-solving consistency. Stay motivated and don't break the streak!

### 2. Built-in Stopwatch & Time Tracker
* **Inline Timer:** Every unsolved problem row now features a beautifully integrated stopwatch.
* **Smart Persistence:** The timer state is saved securely in your browser's `localStorage`. You can safely pause, refresh the page, or take a break without losing your current time.
* **Success Stats:** Once a problem is solved, your final completion time is locked in and displayed on the problem row.

### 3. Global Leaderboard & Database Integration
* **Prisma + SQLite Integration:** We've introduced a database layer using Prisma to securely store user statistics.
* **Auto-Updating Stats:** Your total unique solved count is automatically updated in the database every time you fetch your problems.
* **Top 50 Leaderboard:** Compete globally! A brand new `/leaderboard` page ranks the top 50 users based on their total solved count, complete with "Last Active" timestamps and Codeforces profile links.

## 🛠 Technical Improvements
* Migrated from a purely stateless application to a database-backed application.
* Included Prisma configuration which can seamlessly scale from SQLite to PostgreSQL for cloud deployment (e.g., on Vercel or Supabase).
* Typescript and tRPC typing improvements for database models.

---
**Enjoy the ladder climb!** 🧗‍♂️
