# Scout Scheduler

A collaborative scheduling app for scout groups. Create a shared session, have each member add their team’s activities, and see **location and time conflicts** update in real time.

![Scout Scheduler](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-optional-3FCF8E?style=flat-square&logo=supabase&logoColor=white)

## Features

- **Shared sessions** — Create a session to get a 6-character code, or join with an existing code.
- **Schedule entries** — Each person adds one entry (name, team, up to 10 activities with location, date, and time range).
- **Conflict detection** — Flags when two *different* people book the **same location** on the **same date** with **overlapping times** (case-insensitive location match).
- **Live updates** — With Supabase configured, changes sync across devices via Postgres changes + Realtime.
- **Demo mode** — Runs without a backend using `localStorage` (single-browser / same-machine tabs only).

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (20+ recommended)
- npm (comes with Node)

### Install and run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Other scripts

| Command           | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Start dev server (HMR)   |
| `npm run build`   | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |

## Supabase setup (multi-device sync)

Without Supabase, the app works in **demo mode**: data is stored in the browser only and does not sync to other people’s devices.

### 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a project.
2. In **Project Settings → API**, copy the **Project URL** and **anon public** key.

### 2. Configure environment variables

Copy the example env file and add your keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart the dev server after changing env vars.

### 3. Create database tables

Run this SQL in the Supabase **SQL Editor**:

```sql
-- Sessions (one row per shared code)
create table if not exists public.sessions (
  code text primary key,
  created_at timestamptz default now()
);

-- Schedule entries per session
create table if not exists public.session_entries (
  id text primary key,
  session_code text not null references public.sessions(code) on delete cascade,
  name text not null,
  team text not null,
  activities jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists session_entries_session_code_idx
  on public.session_entries (session_code);

-- Realtime (enable replication for session_entries)
alter publication supabase_realtime add table public.session_entries;
```

### 4. Row Level Security (RLS)

For a simple scout-group tool with anonymous access, you can allow public read/write on these tables (adjust policies for production if you need auth):

```sql
alter table public.sessions enable row level security;
alter table public.session_entries enable row level security;

create policy "Allow public read sessions"
  on public.sessions for select using (true);

create policy "Allow public insert sessions"
  on public.sessions for insert with check (true);

create policy "Allow public read entries"
  on public.session_entries for select using (true);

create policy "Allow public insert entries"
  on public.session_entries for insert with check (true);

create policy "Allow public update entries"
  on public.session_entries for update using (true);

create policy "Allow public delete entries"
  on public.session_entries for delete using (true);
```

> **Note:** These policies let anyone with your anon key read and write data. For a private deployment, tighten RLS or add authentication.

## How it works

### Session flow

1. **Home** — Create a new session (random code) or join with a code.
2. **Session view** — Share the code; each participant clicks **Add My Schedule** once.
3. **Conflicts** — A banner lists clashes; conflicting activity rows are highlighted on cards.

### Conflict rules

Two activities from **different** entries conflict when:

- Same **date**
- Same **location** (trimmed, case-insensitive)
- Time ranges overlap (`startA < endB` and `startB < endA`)

Logic lives in `src/utils/conflicts.js`.

### Data shape (activities JSON)

Each entry stores `activities` as an array:

```json
{
  "location": "Main Hall",
  "date": "2026-05-23",
  "startTime": "09:00",
  "endTime": "10:30"
}
```

## Project structure

```
scout app/
├── public/              # Static assets (favicon, etc.)
├── src/
│   ├── App.jsx          # App shell + simple router (home vs session)
│   ├── context/
│   │   └── SessionContext.jsx   # Sessions, entries, Supabase/localStorage
│   ├── pages/
│   │   ├── Home.jsx     # Create / join session
│   │   └── Session.jsx  # Schedules, forms, conflict UI
│   ├── utils/
│   │   ├── conflicts.js # Conflict detection + formatting
│   │   └── supabase.js  # Supabase client (optional)
│   ├── index.css        # Global styles + theme
│   └── main.jsx         # React entry
├── .env.example         # Supabase env template
├── index.html
├── package.json
└── vite.config.js
```

## Tech stack

- **React 19** + **Vite 8**
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **Supabase** (Postgres + Realtime) — optional
- **localStorage** / **sessionStorage** — fallback demo persistence

## Deployment

Build static files:

```bash
npm run build
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, GitHub Pages, etc.). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host’s environment variables for production sync.

## License

Private project — add a license here if you plan to open-source it.
