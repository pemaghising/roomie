# Roomie

The household app that does the asking. Roomie plans the week's chores by effort (not count), keeps heavy chores off your busy days, turns missed chores into a pool anyone can claim, and sends the reminders itself.

Production: https://roomie-theta.vercel.app

## Stack
React 19 + TypeScript PWA (Vite) · Supabase (Auth, Postgres + RLS, Realtime, Edge Functions, pg_cron) · Web Push · Vercel.

## How it fits together
- **The app** reads one snapshot (`get_state()`) and refreshes it on realtime changes. Every write is a Postgres RPC that checks who you are.
- **Fairness logic** lives in `supabase/functions/_shared/domain/` — pure TypeScript shared by the app and the server.
- **The `tick` function** runs every 10 minutes: drafts Friday 18:00, locks Saturday 18:00 (weeks start on Sunday), sweeps missed chores at day end, expires them 24 h later, settles the household streak, sends the morning digest and delivers push in each person's tone.
- **Privacy:** your effort balance is readable only by you (row-level security). There is no leaderboard anywhere.

## Run it locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in a Supabase dev project (see comments in the file).
3. `npm run dev`

## Tests
- `npm test` — domain logic, UI, and (when `SUPABASE_TEST_*` vars are set) database RLS/RPC/tick integration tests.
- `npm run test:e2e` — two roommates end to end against the dev project.

## Deploy
`npx supabase db push` · `npx supabase functions deploy tick --no-verify-jwt --use-api` · `npx vercel deploy --prod`.
One-time setup (Vault secrets, auth providers, the 6-digit email template) is listed in the implementation plan, Task 18.

## Device checks
| Date | Device | Install | Sign-in | Push | Offline |
|---|---|---|---|---|---|
| (fill in) | iPhone … | | | | |
| (fill in) | Android … | | | | |

Lighthouse (mobile, /welcome, 2 Oct 2026): performance 91, accessibility 100.
