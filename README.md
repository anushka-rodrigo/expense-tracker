# Expense Tracker

A minimal, installable expense tracker built as a practice project — a small full-stack app used to learn Next.js, Supabase (database + Edge Functions), and PWA conversion by building one real thing instead of four separate tutorials.

**Live app:** https://expense-tracker-eight-xi-37.vercel.app

## What it does

- Record income and expenses with an optional category and note
- See a running balance (income − expenses), plus separate totals for money in/out
- Delete any transaction
- View a spending summary for "Today" or "This week", including a per-category breakdown and your top spending category
- Installable as an app on desktop and mobile (works offline for cached pages)

## Tech stack

- **Frontend:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Backend / database:** Supabase (Postgres)
- **Server-side logic:** Supabase Edge Functions (Deno runtime)
- **PWA:** `@ducanh2912/next-pwa` (manifest, service worker, offline caching)
- **Hosting:** Vercel

## How it's built

### Database
A single `transactions` table:

| column | type | notes |
|---|---|---|
| `id` | uuid | primary key |
| `amount` | numeric | |
| `type` | text | `'income'` or `'expense'` |
| `category` | text | optional |
| `note` | text | optional |
| `created_at` | timestamptz | defaults to now |

Row Level Security is currently disabled — this is a single-user practice app with no authentication yet.

### App logic
- Transactions are added/deleted via **Next.js Server Actions** (`src/app/actions.ts`), which call Supabase directly from the server and revalidate the page afterward.
- `src/app/page.tsx` is a server component: it fetches all transactions on each load and computes the balance.

### Edge Function: `spending-summary`
A Deno-based server function (`supabase/functions/spending-summary/index.ts`) that:
- Accepts a `?period=daily` or `?period=weekly` query param
- Queries the database directly (using the service role key, server-side only)
- Returns aggregated income, expenses, net, a per-category breakdown, and the top spending category

This runs entirely on Supabase's infrastructure, not in the browser or in the Next.js server — a genuine example of logic that shouldn't (and doesn't need to) live client-side.

Called from `src/components/SpendingSummary.tsx` via a client-side `fetch`. Note: the function includes CORS headers, since Edge Functions don't allow cross-origin browser requests by default.

### PWA
- `public/manifest.json` defines the app name, icons, and theme colors
- Service worker generated automatically at build time via `@ducanh2912/next-pwa`
- Because Next.js 16 defaults to Turbopack (which doesn't support the webpack-based service worker generation this plugin relies on), the production build explicitly forces webpack: `next build --webpack`

## Local development

```bash
npm install
npm run dev
```

Requires a `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Note: the PWA service worker is disabled in development mode by design — to actually test install/offline behavior, run a production build:
```bash
npm run build
npm run start
```

## Deploying the Edge Function

```bash
supabase functions deploy spending-summary --no-verify-jwt
```

## Notes / known limitations

- Single-user only — no authentication yet
- `.env.local` values are shared between local dev and the deployed app (same Supabase project for both)
- The Edge Function currently allows requests from any origin (`Access-Control-Allow-Origin: *`) — fine for a practice project, would need locking down for anything real
- No editing of existing transactions — only add and delete

## What this project was for

Built as a hands-on way to get practical (not just tutorial-watched) experience with Next.js, Supabase, and PWA conversion ahead of a larger project starting in October.