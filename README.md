# Chore Tracker

A household chore tracker with points, leaderboards, and Google sign-in. Built with Next.js 14 (App Router), Supabase (PostgreSQL + Auth), and Tailwind CSS. Deploy on Vercel.

## Features

- **Google OAuth** sign-in (Gmail)
- **Username** setup after first login
- **Friends**: add by username, accept/decline requests
- **Households**: create rooms, invite friends, accept/decline invites
- **Chores**: define templates (name, type, points); log completions with one or more participants (points split)
- **Leaderboard** per household and **history** of completed chores

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migration: copy the contents of `supabase/migrations/00001_initial_schema.sql` and execute it.
3. In **Authentication → Providers**, enable **Google** and add your Google OAuth Client ID and Client Secret (from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID → Web application). Set the authorized redirect URI to:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
4. In **Settings → API**, copy the **Project URL** and **anon public** key.

### 3. Environment variables

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with Google (after configuring the provider in Supabase), set your username, then add friends and create households.

### 5. Deploy on Vercel

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. Add the same environment variables in the Vercel project settings.
3. Deploy. After OAuth, ensure your Vercel URL is added to the Google OAuth client’s authorized JavaScript origins and redirect URIs if you use redirects to the app (Supabase handles the callback; no extra Google config needed for the callback URL).

## Project structure

- `app/(auth)/` — login page
- `app/(app)/` — dashboard, friends, households (authenticated)
- `app/setup-username/` — username onboarding
- `app/auth/callback/` — OAuth callback handler
- `actions/` — server actions (friends, households, chores)
- `lib/supabase/` — Supabase client (browser, server, middleware)
- `supabase/migrations/` — SQL schema and RLS
- `types/database.ts` — shared DB types
