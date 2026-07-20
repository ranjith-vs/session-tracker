# ProgressLift — Progressive Overload Tracker

A full-stack gym workout tracker built with Next.js 15, Supabase, and Tailwind CSS. Deploy to Vercel in minutes.

---

## Features

- **Username/password auth** — no email confirmation required
- **Exercise library** — add, edit, delete exercises
- **Workout sessions** — log by date with start/end time and auto-calculated duration
- **Set logging** — reps, weight (kg), time elapsed, rest time before set, remarks
- **Exercise ordering** — move exercises up/down within a session
- **Rest time** — log rest between exercises and between sets
- **Progress comparison** — see ▲/▼ arrows vs previous session for every set
- **Progress charts** — line/bar charts for total reps, volume, or max weight over time
- **Full history** — browse every workout session grouped by month

---

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Authentication → Settings → Email Auth**, disable **"Confirm email"** (important — otherwise registration will silently fail).
3. Go to **SQL Editor** and run the contents of `supabase/schema.sql`.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your Supabase project's URL and anon key (found in **Settings → API**):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in [vercel.com/new](https://vercel.com/new).
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy.

---

## Database Schema

| Table | Description |
|---|---|
| `profiles` | Username per user (auto-created on signup via trigger) |
| `exercises` | User's exercise library |
| `workout_sessions` | A workout session (date, start/end time, duration) |
| `session_exercises` | Exercises added to a session, ordered |
| `exercise_sets` | Sets logged per exercise (reps, weight, time, rest, remarks) |

Row Level Security is enabled on all tables — users can only access their own data.

---

## How It Works

### Workout flow
1. **New Workout** → click "Start Workout" → session is created with `start_time = now`
2. **Add exercises** from your library (in any order, reorder with ▲▼ buttons)
3. **Add sets** for each exercise — fill in reps, weight, time elapsed, rest time, remarks inline
4. **End Workout** → records `end_time` and calculates total duration

### Progress comparison
When viewing a **completed** session, each set shows a green ▲ or red ▼ badge next to reps and weight, comparing against the most recent previous session where the same exercise was performed.

### Progress charts
Go to **Progress**, pick an exercise, and choose a metric:
- **Total Reps** — sum of all reps across sets for that exercise in each session
- **Volume (kg)** — sum of (reps × weight) per session
- **Max Weight** — heaviest weight used in any set per session

Switch between line and bar chart views.
