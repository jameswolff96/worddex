# WordDex

A real-time multiplayer word-guessing game built around Pokémon terms. One player gives clues; the rest try to guess the secret Pokémon (or move, item, etc.) before the word budget runs out.

## Features

- **Three game modes**
  - **Teams** — teams alternate turns; one Clue Master per team gives clues while teammates guess
  - **Free-for-all** — each player takes a turn as Clue Master; everyone else guesses individually
  - **Classroom / Streamer** — one fixed Clue Giver for the whole game; multiple teams compete simultaneously
- **Lobby system** — public lobbies discoverable in the browser, or private lobbies joinable by code
- **Real-time play** — game state and chat sync live via Supabase Realtime
- **Pokémon sprites** — term cards show official sprites sourced from [PokéAPI](https://pokeapi.co)
- **Configurable rules** — rounds, terms per turn, word budget, team count, clue-master rotation
- **Guest play** — no account required; guests join via anonymous sign-in (hCaptcha protected)
- **OAuth sign-in** — Google and Discord

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Database / Auth / Realtime | Supabase (PostgreSQL + Row Level Security) |
| Backend logic | Next.js Server Actions + Supabase Edge Functions (Deno) |
| Styling | Tailwind CSS v4 |
| Bot protection | hCaptcha (anonymous sign-ins) |
| Deployment | Vercel (frontend) + Supabase (backend) |

## Self-hosting

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 20
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm i -g supabase`)
- A [Supabase](https://supabase.com) project (free tier is fine)
- A [hCaptcha](https://www.hcaptcha.com) account (free tier is fine)

### 1. Clone and install

```bash
git clone https://github.com/jameswolff96/worddex.git
cd worddex
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once provisioned, open **Project Settings → API** and note:
   - **Project URL** (`https://your-ref.supabase.co`)
   - **Publishable (anon) key**

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → Publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → Service role key (**keep secret**) |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | hCaptcha dashboard → Sites → Site key |

### 4. Run database migrations

Link your local Supabase CLI to the project and push all migrations:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

This applies all 24 migrations in `supabase/migrations/` in order, creating the full schema, RLS policies, and Realtime publications.

### 5. Configure Supabase Auth

In the Supabase dashboard:

**Enable anonymous sign-ins**
- Authentication → Sign In Methods → enable **Anonymous sign-ins**

**Enable OAuth providers** (optional — remove the buttons from `OAuthButtons.tsx` if you skip these)
- Authentication → Sign In Methods → **Google** → enable and paste your Google OAuth client ID and secret
- Authentication → Sign In Methods → **Discord** → enable and paste your Discord application client ID and secret

For Google OAuth, set the redirect URI in Google Cloud Console to:
```
https://your-ref.supabase.co/auth/v1/callback
```

For Discord OAuth, set the redirect URI in your Discord application to the same URL.

**Enable hCaptcha bot protection**
- Authentication → Bot and Abuse Protection → enable **hCaptcha**
- Paste your hCaptcha **secret key** (from the hCaptcha dashboard — this is different from the site key)

### 6. Deploy the Edge Function

The `scheduled-cleanup` function removes stale lobbies and expired anonymous users.

```bash
supabase functions deploy scheduled-cleanup
```

Supabase automatically injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into the function at runtime — no additional secrets are needed.

### 7. Set up the cleanup schedule (GitHub Actions)

The workflow in `.github/workflows/scheduled-cleanup.yml` calls the Edge Function every 5 minutes. Add two secrets to your GitHub repository (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|---|---|
| `SUPABASE_URL` | Same as `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | Same as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |

Alternatively, invoke the function on any schedule you prefer, or set up a cron job via [Supabase's built-in scheduler](https://supabase.com/docs/guides/functions/schedule-functions).

### 8. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jameswolff96/worddex)

Or manually:

```bash
npm i -g vercel
vercel
```

When prompted, add the three environment variables from `.env.local`. Vercel will build and deploy the Next.js app automatically on every push to `main`.

### Running locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). All three environment variables must be set in `.env.local` for auth and gameplay to work.

## Project structure

```
src/
  app/               # Next.js App Router pages and Server Actions
    auth/            # Sign-in / sign-up / OAuth callback
    lobby/           # Lobby creation, waiting room, and live game
    profile/         # User profile and avatar selection
    privacy/         # Privacy Policy
    terms/           # Terms of Service
  components/        # Shared React components
  lib/
    game/            # Game engine, clue validation, content filter
    supabase/        # Browser and server Supabase clients
    types/           # Database type definitions
supabase/
  functions/         # Deno Edge Functions
  migrations/        # Ordered SQL migrations (apply with `supabase db push`)
```

## Attribution

- Pokémon sprites and data via [PokéAPI](https://pokeapi.co) — not affiliated with Nintendo / Game Freak
- Inspired by [Zane Games](https://discord.gg/5fdHNjPTTy)
- A [Degenerate Games](https://discord.gg/fEJjGJPzCB) production

## License

MIT
