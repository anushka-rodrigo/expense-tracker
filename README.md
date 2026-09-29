# Ultrix Expense Tracker

A multi-user expense and income tracker modelled on a handwritten expense notebook — built as a hands-on project to get real (not just tutorial-watched) experience with Next.js, Supabase (database, auth, Edge Functions), the Gemini API, and PWA conversion.

**Live app:** https://expense-tracker-eight-xi-37.vercel.app

Anyone is free to use the live app through the link above — just sign up with an email and password. Each account's data is private to that account.

## What it does

- Record expenses (name, optional description, amount) and income (name, amount) separately
- Log a single date, or a date range for days you record in one go — ranges are restricted to a single calendar month, so every entry belongs to exactly one month
- Edit or delete any entry
- Monthly view: total income, total expenses, net balance, and a percentage breakdown of where money went by category
- On-demand AI insights (via the Gemini API): a short summary of the month, highlights, and 3 concrete suggestions, generated only when you ask for them and cached until your numbers change
- Downloadable monthly PDF report, styled like the notebook it's based on, including the AI insights if generated
- Email/password authentication with per-user data isolation (Postgres Row Level Security)
- Account deletion, with a password re-check, that permanently removes the account and all its data
- Installable as a PWA on desktop and mobile, with offline fallback for cached pages

## Tech stack

- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- **Backend / database:** Supabase (Postgres), with Row Level Security on every table
- **Auth:** Supabase Auth (email/password), session handling via `@supabase/ssr` and a Next.js `proxy.ts` route guard
- **AI:** Google Gemini API, called from a Supabase Edge Function (Deno runtime) — the API key never reaches the browser
- **PDF generation:** `pdf-lib`, built server-side in a Next.js route handler
- **PWA:** `@ducanh2912/next-pwa` (manifest, service worker, custom runtime caching, offline fallback page)
- **Hosting:** Vercel

## How it's built

### Database

Two main tables, `expenses` and `income`, each with:

| column | type | notes |
|---|---|---|
| `id` | uuid | primary key |
| `user_id` | uuid | owner; defaults to the logged-in user, cascades on delete |
| `start_date` | date | the date, or the first day of a range |
| `end_date` | date, nullable | empty for a single day; must be in the same month as `start_date` |
| `name` | text | required |
| `description` | text | expenses only |
| `amount` | numeric(12,2) | for a range, the total across all days |
| `created_at` / `updated_at` | timestamptz | `updated_at` refreshes via trigger |

A `CHECK` constraint enforces that `end_date` never crosses into a different month from `start_date` — enforced at the database level, not just in the UI, so it can't be bypassed.

Two supporting tables:
- `monthly_insights` — one row per user per month, storing the last generated AI summary plus the totals it was generated from (used to detect when it's gone stale)
- `ai_usage` — per-user, per-day counters used to cap AI generations (see below); writable only by the Edge Function's service-role key, not by users directly

Row Level Security is enabled on every table, with policies restricting all reads and writes to `auth.uid() = user_id`. The old single-user `transactions` table from the early prototype has been dropped.

### App logic

- All reads and writes go through Next.js **Server Actions** (`src/app/actions.ts`) and run under the logged-in user's own session, so Postgres RLS — not application code — is what actually enforces per-user isolation.
- Validation (name length, amount range, date range rules) lives in one shared module (`src/lib/validate.ts`) used by both the add and edit paths, so the rules can't drift apart.
- `src/app/page.tsx` is a server component that loads the selected month's entries, computes totals, and renders the ledger, month summary, and AI insights card.
- The add/edit form appears as a sidebar on desktop and a bottom-sheet triggered by a floating button on mobile.

### Edge Function: `monthly-insights`

A Deno-based Supabase Edge Function (`supabase/functions/monthly-insights/index.ts`) that:
- Verifies the caller's login token itself (returns 401 if not authenticated)
- Reads that user's income/expense data for the requested month **through their own session**, so it can only ever see the caller's own rows
- Enforces a daily cap (8 generations per user per day) using a separate service-role client, so a user cannot reset their own counter
- Sends only aggregated data to Gemini (totals, category names and amounts, previous month for comparison) — never raw entries, emails, or descriptions
- Saves the result to `monthly_insights` so reloading the page doesn't cost quota; only pressing "Generate" or "Regenerate" calls the AI
- Includes CORS headers, since Edge Functions don't allow cross-origin browser requests by default

The Gemini API key and model name are stored as Supabase secrets (`GEMINI_API_KEY`, `GEMINI_MODEL`) and are never exposed to the browser or committed to the repo.

### PDF reports

`src/app/report/route.ts` is a server route that checks the caller's login, loads their month through the normal RLS-protected queries, and builds a PDF (`src/lib/report.ts`) with `pdf-lib` — summary boxes, a category breakdown, a notebook-style transaction table, and the AI insights if available. The PDF uses standard PDF fonts, which cover basic Latin characters only.

### PWA

- `public/manifest.json` defines the name, icons, and theme colors
- Service worker generated at build time via `@ducanh2912/next-pwa`, with custom runtime caching rules: Supabase API calls always go to the network, pages are network-first (so edits show up immediately, without a manual hard refresh), and static assets/images are cached
- An offline fallback page (`/offline`) shows when there's no connection and no cached copy of the requested page
- Next.js 16 defaults to Turbopack, which the PWA plugin's webpack-based service worker generation doesn't support, so the production build explicitly forces webpack: `next build --webpack` (see `package.json`)

## Local development

```bash
npm install
npm run dev
```

Requires a `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The service-role key is required locally only for the account-deletion server action. It is never sent to the browser — keep it out of version control.

The PWA service worker is disabled in development mode by design. To test install/offline behavior, run a production build:
```bash
npm run build
npm run start
```

## Setting up your own copy

If you fork or clone this repo to run your own instance:

1. Create a new Supabase project, then apply the migrations in `supabase/migrations/` in order (`supabase db push`, or paste each file into the SQL Editor).
2. Enable Email auth in Supabase, and set **Site URL** / **Redirect URLs** to your own domain.
3. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey), and set it along with a current model name as Supabase secrets:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-key GEMINI_MODEL=your-model-id
   ```
4. Deploy the Edge Function:
   ```bash
   supabase functions deploy monthly-insights --no-verify-jwt
   ```
5. Set the three environment variables above in your hosting provider (e.g. Vercel), and deploy.

## Notes / known limitations

- Built for personal use first; anyone can sign up through the live link, but there's no admin panel, invite system, or usage dashboard beyond the per-user AI daily cap
- Supabase's built-in email sender has a low rate limit, which is fine for light use but would need a custom SMTP provider (e.g. Resend, Brevo) for wider adoption
- PDF reports render basic Latin characters only; non-Latin entry names appear as `?` in the downloaded PDF (the app itself displays them fine)
- No CSV export — the app's fields are simple enough that the PDF report was judged sufficient
- No carry-over balance between months; each month's totals stand alone, matching the original notebook this app is based on

## What this project was for

Built as a hands-on way to get practical experience with Next.js, Supabase (database, auth, RLS, Edge Functions), the Gemini API, and PWA conversion — evolving from a single-user weekend prototype into a small but complete multi-user product, stage by stage.