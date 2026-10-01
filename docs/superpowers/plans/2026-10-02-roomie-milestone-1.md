# Roomie Milestone 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Roomie milestone 1 — a real, installable, multi-user household app where a weekly chore plan is made for the household, chores get done or claimed, and the app (not roommates) does the reminding.

**Architecture:** A React + TypeScript PWA talks to Supabase. Every state change is a Postgres RPC guarded by Row-Level Security; the app reads one `get_state()` snapshot and refreshes it on realtime events. Scheduling/fairness logic is pure TypeScript in `supabase/functions/_shared/domain/`, shared by the app (Vite) and one hourly Edge Function `tick` (Deno) that drafts/locks plans, sweeps missed chores, settles the streak and sends Web Push.

**Tech Stack:** Node 24, React 19, TypeScript 5 (strict), Vite 7, vite-plugin-pwa (injectManifest), react-router 7, @tanstack/react-query 5 (+ IndexedDB persistence via idb-keyval), @supabase/supabase-js 2, lucide-react, Vitest + Testing Library + jsdom, Playwright; Supabase (Auth, Postgres, Realtime, Edge Functions, pg_cron, pg_net, Vault); web-push (Deno, `npm:` specifier); Vercel hosting.

**Spec:** `docs/superpowers/specs/2026-10-01-roomie-app-design.md`

## Global Constraints

- Effort points: Light = 1, Medium = 2, Heavy = 3. No minute values anywhere in the app.
- Weekday convention everywhere (TS, DB `busy_days`, plan days): `0 = Monday … 6 = Sunday`.
- Household defaults: timezone `Asia/Kathmandu`, day ends `22:00`.
- Plan lifecycle: draft generated **Saturday 18:00** local; review-mode drafts lock at **Sunday 18:00** (24 h) or when every active member has approved; auto mode locks immediately.
- Missed chores stay claimable for **24 h after the day ended**, then expire.
- Effort debt carried into a plan is clamped to **±3 points per week**.
- Max **8 active members** per household; **one active household per person**.
- Push rules: quiet hours **22:00–07:00** (deferred, not dropped); max **3 pushes per person per day**, except `covered`; morning digest window **08:00–11:59**.
- No leaderboard, rank or per-person score is ever shown to anyone else. `effort_ledger` rows are readable only by their own user.
- The client never writes tables directly; every write is a `security definer` RPC.
- Copy tone: "a flatmate who's on your side". Every nudge exists in two tones: `motivate` and `facts`.
- Domain code (`supabase/functions/_shared/domain/`) is pure, dependency-free, and imports siblings with explicit `.ts` extensions (Deno-compatible).
- Visual system from the hi-fi screens: Playfair Display (700) for headlines, Inter for UI, lavender `#B9A2FF` / `#5C3B9B`, effort chips Light mint `#D1FAE5`/`#065F46`, Medium butter `#FEF3C7`/`#92400E`, Heavy peach `#FFEDD5`/`#C2410C`, floating dark tab bar `#111827`.
- Accessibility: 44 px minimum touch targets, WCAG AA contrast, visible focus rings, `prefers-reduced-motion` respected.

## Review Focus

1. **Two roommates tap Claim on the same missed chore at the same moment** — exactly one wins; the other sees "Priya already grabbed this" and their screen rolls back. (Task 8, `claim race` test.)
2. **Completing a chore while offline, then reconnecting (or double-tapping)** — the chore ends up done exactly once; repeating `complete_assignment` on an already-done chore by the same person succeeds silently. (Task 8, `complete is idempotent` test.)
3. **A member leaves or is removed while a swap involving them is pending** — the swap is declined automatically and their future chores go to the claim pool; nobody can accept a swap with a departed member. (Task 8, `leaving cancels swaps` test.)
4. **Undo pressed too late** (after 10 minutes, or after the day was swept) — the server refuses with `undo_expired`, the UI shows a gentle message and keeps the chore done. (Task 8, `undo window` test.)
5. **Join codes typed in lowercase, with spaces, or pasted as a full invite link** — `abc 123`, `ABC-123` and `https://…/j/ABC123` all join household `ABC123`. (Task 10, `normalizeCode` test; Task 8, `join normalizes code` test.)

## File Structure

```
roomie-app/
├─ package.json · vite.config.ts · tsconfig.json · index.html · vercel.json · .env.example · README.md
├─ public/                      PWA icons (generated) + roomie-icon.svg
├─ supabase/
│  ├─ config.toml               (supabase init)
│  ├─ migrations/
│  │  ├─ 20261001000001_schema.sql      tables, enums, signup trigger
│  │  ├─ 20261001000002_rls.sql         RLS, realtime publication, get_state()
│  │  ├─ 20261001000003_rpc.sql         every client-callable write
│  │  ├─ 20261001000004_server.sql      srv_* functions used only by the tick function
│  │  └─ 20261001000005_cron.sql        hourly pg_cron → tick
│  └─ functions/
│     ├─ _shared/domain/        PURE logic, shared with the app
│     │  ├─ time.ts · types.ts · rotation.ts · ledger.ts · streak.ts · copy.ts · tick.ts
│     │  └─ *.test.ts           (Vitest)
│     └─ tick/
│        ├─ index.ts            HTTP entry: cron + app "plan now"
│        ├─ actions.ts          executes TickActions via srv_* RPCs
│        └─ push.ts             drains notifications → Web Push
├─ src/
│  ├─ main.tsx · App.tsx (routes + guards) · sw.ts (service worker)
│  ├─ styles/tokens.css · base.css
│  ├─ lib/
│  │  ├─ supabase.ts            client
│  │  ├─ types.ts               AppState (shape of get_state)
│  │  ├─ queryClient.ts         TanStack Query + IndexedDB persistence
│  │  ├─ state.ts               useAppState, useRealtime, useAction (optimistic RPC)
│  │  ├─ selectors.ts           pure derivations (today's tasks, week totals…)
│  │  ├─ push.ts                Web Push subscription
│  │  └─ platform.ts            install / iOS / standalone detection
│  ├─ ui/                       design-system components + ui.css
│  └─ features/
│     ├─ auth/                  AuthProvider, Welcome, ContactEntry, VerifyCode
│     ├─ onboarding/            ProfileStep, StartStep, JoinStep, HomeNameStep, ChoresStep, BusyStep, InviteStep, draft.ts
│     ├─ home/Home.tsx
│     ├─ chores/                Chores, TaskList, WhySheet, AddChoreSheet, Celebration
│     ├─ plan/                  PlanReview, SwapSheet
│     ├─ profile/               Profile, HouseholdSettings
│     ├─ activity/Activity.tsx
│     └─ primer/InstallPrimer.tsx
├─ tests/db/                    RLS + RPC integration tests (hosted dev project)
└─ e2e/                         Playwright two-roommate journey
```

## Execution checkpoints

- **Tasks 1–6** need no accounts.
- **Before Task 7 — ACCOUNT CHECKPOINT:** Pema creates (a) a Supabase project named `roomie-dev` and (b) provides the project ref, `anon` key, `service_role` key, the database password and a personal access token. Enable *Email* provider with **"Confirm email" off** and password sign-in **on** for the dev project only (tests sign in with passwords; real users use OTP). Write them into `.env.local` (git-ignored) — keys shown in Task 7.
- **Before Task 18 — ACCOUNT CHECKPOINT:** Google OAuth client, Vercel account; Twilio is optional (phone sign-in stays hidden until `VITE_PHONE_AUTH=on`).

---
### Task 1: Project scaffold, design tokens, PWA shell

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `.env.example`, `vercel.json`
- Create: `src/main.tsx`, `src/App.tsx`, `src/test-setup.ts`, `src/sw.ts`, `src/vite-env.d.ts`
- Create: `src/styles/tokens.css`, `src/styles/base.css`
- Create: `public/roomie-icon.svg` (+ generated PNG icons)
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `@domain/*` import alias → `supabase/functions/_shared/domain/*`; CSS custom properties listed in `tokens.css` (used by every later UI task); `npm test`, `npm run build`, `npm run dev` scripts.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "roomie-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "icons": "pwa-assets-generator --preset minimal-2023 public/roomie-icon.svg"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.58.0",
    "@tanstack/query-async-storage-persister": "^5.90.0",
    "@tanstack/react-query": "^5.90.0",
    "@tanstack/react-query-persist-client": "^5.90.0",
    "idb-keyval": "^6.2.2",
    "lucide-react": "^0.545.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router": "^7.9.0",
    "workbox-precaching": "^7.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vite-pwa/assets-generator": "^1.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "jsdom": "^27.0.0",
    "typescript": "^5.9.0",
    "vite": "^7.1.0",
    "vite-plugin-pwa": "^1.0.3",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: completes with no `ERR!` lines.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable", "WebWorker"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"],
    "baseUrl": ".",
    "paths": { "@domain/*": ["supabase/functions/_shared/domain/*"] }
  },
  "include": ["src", "supabase/functions/_shared", "tests", "vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@domain': fileURLToPath(new URL('./supabase/functions/_shared/domain', import.meta.url)) },
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'] },
      manifest: {
        name: 'Roomie',
        short_name: 'Roomie',
        description: "Fair isn't equal. The household app that does the asking.",
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'supabase/functions/_shared/**/*.test.ts', 'tests/db/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Roomie" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" href="/roomie-icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" />
    <title>Roomie</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/styles/tokens.css`**

```css
:root {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-ui: 'Inter', system-ui, -apple-system, sans-serif;

  --ink: #111827;
  --ink-2: #374151;
  --muted: #6b7280;
  --line: #e5e7eb;
  --bg: #ffffff;
  --surface: #f9fafb;
  --navy: #111827;

  --lav: #f3e8ff;
  --lav-2: #d8b4fe;
  --lav-3: #b9a2ff;
  --lav-ink: #5c3b9b;

  --light-bg: #d1fae5;  --light-ink: #065f46;
  --medium-bg: #fef3c7; --medium-ink: #92400e;
  --heavy-bg: #ffedd5;  --heavy-ink: #c2410c;
  --sky-bg: #dbeafe;    --sky-ink: #0369a1;
  --danger: #b91c1c;

  --radius-s: 12px;
  --radius-m: 18px;
  --radius-l: 26px;
  --radius-pill: 999px;
  --shadow-card: 0 1px 2px rgba(17, 24, 39, 0.04), 0 8px 24px -12px rgba(17, 24, 39, 0.12);
  --shadow-sheet: 0 -12px 40px -12px rgba(17, 24, 39, 0.25);

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --tap: 44px;
  --ease: cubic-bezier(.2, .8, .2, 1);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-top: env(safe-area-inset-top, 0px);
}
```

- [ ] **Step 7: Create `src/styles/base.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
html, body, #root { height: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font: 400 16px/1.45 var(--font-ui); -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent; overscroll-behavior-y: none;
}
h1, h2, h3 { margin: 0; font-family: var(--font-display); font-weight: 700; letter-spacing: -0.01em; }
h1 { font-size: 32px; line-height: 1.1; }
h2 { font-size: 24px; line-height: 1.15; }
h3 { font-size: 19px; }
p { margin: 0; }
button { font: inherit; color: inherit; }
:focus-visible { outline: 3px solid var(--lav-3); outline-offset: 2px; border-radius: 8px; }
.screen { min-height: 100%; padding: calc(var(--safe-top) + 20px) 20px calc(var(--safe-bottom) + 120px); max-width: 520px; margin: 0 auto; }
.eyebrow { font: 600 12px/1 var(--font-ui); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.muted { color: var(--muted); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

- [ ] **Step 8: Write the failing smoke test `src/App.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Roomie shell', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /roomie/i })).toBeInTheDocument();
});
```

And `src/test-setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 9: Run it to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `Failed to resolve import "./App"`.

- [ ] **Step 10: Create the shell files**

`src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="screen">
      <h1>Roomie</h1>
    </main>
  );
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly VITE_PHONE_AUTH?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
```

`src/sw.ts` (push handling is added in Task 17):

```ts
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };
precacheAndRoute(self.__WB_MANIFEST);
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
```

- [ ] **Step 11: Supporting files**

`.gitignore`:

```
node_modules
dist
dev-dist
.env.local
.env.*.local
supabase/.temp
supabase/.branches
test-results
playwright-report
```

`.env.example`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VITE_PHONE_AUTH=off
# test-only (tests/db, e2e): never ship these to the client
SUPABASE_TEST_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_TEST_ANON_KEY=your-anon-key
SUPABASE_TEST_SERVICE_KEY=your-service-role-key
```

`vercel.json`:

```json
{ "rewrites": [{ "source": "/((?!assets/|.*\\..*).*)", "destination": "/index.html" }] }
```

Copy the icon and generate PWA icons:

Run: `cp ../roomie-experience/assets/roomie-icon.svg public/roomie-icon.svg && npm run icons`
Expected: `public/` now contains `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`.

- [ ] **Step 12: Run tests and build**

Run: `npm test && npm run build`
Expected: 1 test passes; build prints `PWA v1… files generated` and `dist/sw.js`.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "chore: scaffold Roomie PWA with design tokens"
```

---

### Task 2: Domain — dates, weeks and household local time

**Files:**
- Create: `supabase/functions/_shared/domain/time.ts`
- Test: `supabase/functions/_shared/domain/time.test.ts`

**Interfaces:**
- Produces:
  - `type Weekday = 0|1|2|3|4|5|6` (0 = Monday)
  - `addDays(date: string, n: number): string` — `'YYYY-MM-DD'` in, out
  - `weekdayOf(date: string): Weekday`
  - `weekStartOf(date: string): string` — the Monday of that week
  - `dateOfWeekday(weekStart: string, day: Weekday): string`
  - `weeksBetween(fromMonday: string, toMonday: string): number`
  - `localParts(now: Date, timeZone: string): { date: string; weekday: Weekday; hour: number; minute: number }`
  - `minutesOf(hhmm: string): number` — `'22:00'` or `'22:00:00'` → `1320`
  - `DAY_NAMES: readonly string[]` — `['Monday', …, 'Sunday']`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test } from 'vitest';
import { addDays, dateOfWeekday, DAY_NAMES, localParts, minutesOf, weekdayOf, weeksBetween, weekStartOf } from './time.ts';

describe('calendar helpers', () => {
  test('addDays crosses months and years', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-01', -3)).toBe('2026-09-28');
  });
  test('weekdayOf uses 0 = Monday', () => {
    expect(weekdayOf('2026-09-28')).toBe(0); // Monday
    expect(weekdayOf('2026-10-01')).toBe(3); // Thursday
    expect(weekdayOf('2026-10-04')).toBe(6); // Sunday
  });
  test('weekStartOf returns the Monday', () => {
    expect(weekStartOf('2026-10-01')).toBe('2026-09-28');
    expect(weekStartOf('2026-10-04')).toBe('2026-09-28');
    expect(weekStartOf('2026-10-05')).toBe('2026-10-05');
  });
  test('dateOfWeekday and weeksBetween', () => {
    expect(dateOfWeekday('2026-09-28', 4)).toBe('2026-10-02');
    expect(weeksBetween('2026-09-28', '2026-10-12')).toBe(2);
    expect(weeksBetween('2026-10-12', '2026-09-28')).toBe(-2);
  });
  test('minutesOf accepts HH:MM and HH:MM:SS', () => {
    expect(minutesOf('22:00')).toBe(1320);
    expect(minutesOf('07:30:00')).toBe(450);
  });
  test('DAY_NAMES matches the weekday convention', () => {
    expect(DAY_NAMES[0]).toBe('Monday');
    expect(DAY_NAMES[6]).toBe('Sunday');
  });
});

describe('localParts', () => {
  test('Kathmandu is UTC+5:45', () => {
    expect(localParts(new Date('2026-10-03T12:20:00Z'), 'Asia/Kathmandu'))
      .toEqual({ date: '2026-10-03', weekday: 5, hour: 18, minute: 5 });
  });
  test('rolls over to the next local day before UTC does', () => {
    expect(localParts(new Date('2026-10-03T18:20:00Z'), 'Asia/Kathmandu'))
      .toEqual({ date: '2026-10-04', weekday: 6, hour: 0, minute: 5 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run supabase/functions/_shared/domain/time.test.ts`
Expected: FAIL — `Failed to resolve import "./time.ts"`.

- [ ] **Step 3: Implement `time.ts`**

```ts
/** 0 = Monday … 6 = Sunday — the one weekday convention used across the app and database. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const DAY_MS = 86_400_000;
const toUtc = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function addDays(date: string, n: number): string {
  return fromUtc(toUtc(date) + n * DAY_MS);
}

export function weekdayOf(date: string): Weekday {
  return ((new Date(toUtc(date)).getUTCDay() + 6) % 7) as Weekday;
}

export function weekStartOf(date: string): string {
  return addDays(date, -weekdayOf(date));
}

export function dateOfWeekday(weekStart: string, day: Weekday): string {
  return addDays(weekStart, day);
}

export function weeksBetween(fromMonday: string, toMonday: string): number {
  return Math.round((toUtc(toMonday) - toUtc(fromMonday)) / (7 * DAY_MS));
}

export interface LocalParts { date: string; weekday: Weekday; hour: number; minute: number }

export function localParts(now: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  return { date, weekday: weekdayOf(date), hour: Number(get('hour')), minute: Number(get('minute')) };
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run supabase/functions/_shared/domain/time.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/domain/time.ts supabase/functions/_shared/domain/time.test.ts
git commit -m "feat(domain): calendar and household-local time helpers"
```

---
### Task 3: Domain — types and the weekly rotation

**Files:**
- Create: `supabase/functions/_shared/domain/types.ts`
- Create: `supabase/functions/_shared/domain/rotation.ts`
- Test: `supabase/functions/_shared/domain/rotation.test.ts`

**Interfaces:**
- Consumes: `Weekday`, `addDays`, `weeksBetween` from `time.ts` (Task 2).
- Produces (`types.ts`):
  - `type Effort = 1 | 2 | 3`; `type Cadence = 'daily' | 'weekly' | 'biweekly'`
  - `type AssignmentStatus = 'todo' | 'done' | 'missed' | 'claimed' | 'expired'`; `type NudgeStyle = 'motivate' | 'facts'`
  - `interface MemberInput { userId: string; busyDays: Weekday[]; balance: number; coveredBy?: string }`
  - `interface ChoreInput { id: string; effort: Effort; cadence: Cadence; createdWeek: string }`
  - `interface HistoryItem { choreId: string; userId: string; weekStart: string }`
  - `interface PlanInput { householdId: string; weekStart: string; members: MemberInput[]; chores: ChoreInput[]; history: HistoryItem[]; fromDay?: Weekday; existingTotals?: Record<string, number> }`
  - `type Reason` — discriminated on `code`: `busy_moved{busyDay}`, `turn{previousUserId}`, `debt{coveredBy?}`, `credit`, `balance{points,target}`, `everyone_busy{day}`, `swap{withUserId}`
  - `interface PlannedAssignment { choreId: string; userId: string; day: Weekday; effort: Effort; reason: Reason }`
  - `interface PlanResult { assignments: PlannedAssignment[]; totals: Record<string, number>; flags: { choreId: string; day: Weekday }[] }`
- Produces (`rotation.ts`): `DEBT_CLAMP = 3`, `clampDebt(balance: number): number`, `seededRandom(seed: string): () => number`, `expandChores(chores, weekStart, fromDay?): ChoreInstance[]`, `generatePlan(input: PlanInput): PlanResult`.

- [ ] **Step 1: Create `types.ts`** (no behaviour, so no test of its own)

```ts
import type { Weekday } from './time.ts';

export type Effort = 1 | 2 | 3;
export type Cadence = 'daily' | 'weekly' | 'biweekly';
export type AssignmentStatus = 'todo' | 'done' | 'missed' | 'claimed' | 'expired';
export type NudgeStyle = 'motivate' | 'facts';

export interface MemberInput {
  userId: string;
  busyDays: Weekday[];
  /** + means the member owes effort, − means they are owed (private ledger). */
  balance: number;
  /** userId of whoever most recently covered for this member, for the reason text. */
  coveredBy?: string;
}

export interface ChoreInput { id: string; effort: Effort; cadence: Cadence; createdWeek: string }
export interface HistoryItem { choreId: string; userId: string; weekStart: string }

export interface PlanInput {
  householdId: string;
  weekStart: string;
  members: MemberInput[];
  chores: ChoreInput[];
  history: HistoryItem[];
  /** Plan only from this weekday on (mid-week households and newly added chores). */
  fromDay?: Weekday;
  /** Points already assigned this week, when adding to an existing plan. */
  existingTotals?: Record<string, number>;
}

export type Reason =
  | { code: 'busy_moved'; busyDay: Weekday }
  | { code: 'turn'; previousUserId: string }
  | { code: 'debt'; coveredBy?: string }
  | { code: 'credit' }
  | { code: 'balance'; points: number; target: number }
  | { code: 'everyone_busy'; day: Weekday }
  | { code: 'swap'; withUserId: string };

export interface PlannedAssignment { choreId: string; userId: string; day: Weekday; effort: Effort; reason: Reason }

export interface PlanResult {
  assignments: PlannedAssignment[];
  totals: Record<string, number>;
  /** Heavy chores that could only land on a day everyone marked busy. */
  flags: { choreId: string; day: Weekday }[];
}
```

- [ ] **Step 2: Write the failing tests `rotation.test.ts`**

```ts
import { describe, expect, test } from 'vitest';
import { clampDebt, expandChores, generatePlan, seededRandom } from './rotation.ts';
import type { ChoreInput, MemberInput, PlanInput } from './types.ts';
import type { Weekday } from './time.ts';

const WEEK = '2026-10-05';
const chore = (id: string, effort: 1 | 2 | 3, cadence: ChoreInput['cadence'] = 'weekly'): ChoreInput =>
  ({ id, effort, cadence, createdWeek: '2026-09-28' });
const member = (userId: string, busyDays: Weekday[] = [], balance = 0, coveredBy?: string): MemberInput =>
  ({ userId, busyDays, balance, coveredBy });
const plan = (p: Partial<PlanInput>) =>
  generatePlan({ householdId: 'h1', weekStart: WEEK, members: [], chores: [], history: [], ...p });

describe('expandChores', () => {
  test('daily chores become one instance per remaining day', () => {
    const inst = expandChores([chore('trash', 1, 'daily')], WEEK, 3);
    expect(inst.map((i) => i.day)).toEqual([3, 4, 5, 6]);
  });
  test('biweekly chores appear on alternate weeks from their creation week', () => {
    const bi = [chore('windows', 2, 'biweekly')];
    expect(expandChores(bi, '2026-09-28')).toHaveLength(1);
    expect(expandChores(bi, '2026-10-05')).toHaveLength(0);
    expect(expandChores(bi, '2026-10-12')).toHaveLength(1);
  });
});

describe('generatePlan', () => {
  test('no members → nothing planned', () => {
    expect(plan({ chores: [chore('a', 1)] }).assignments).toEqual([]);
  });

  test('case-study household: heavy chores never land on a busy day, effort is balanced', () => {
    const result = plan({
      members: [member('aarav', [0, 2, 4]), member('priya'), member('you', [5, 6])],
      chores: [chore('trash', 1, 'daily'), chore('sweep', 2), chore('laundry', 2), chore('bathroom', 3), chore('kitchen', 3)],
    });
    expect(result.assignments).toHaveLength(11);
    const busy: Record<string, Weekday[]> = { aarav: [0, 2, 4], priya: [], you: [5, 6] };
    for (const a of result.assignments) if (a.effort === 3) expect(busy[a.userId]).not.toContain(a.day);
    const totals = Object.values(result.totals);
    expect(totals.reduce((s, n) => s + n, 0)).toBe(17);
    expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(3);
  });

  test('light-only chores split evenly', () => {
    const chores = Array.from({ length: 9 }, (_, i) => chore(`c${i}`, 1));
    const result = plan({ members: [member('a'), member('b'), member('c')], chores });
    expect(result.totals).toEqual({ a: 3, b: 3, c: 3 });
  });

  test('is deterministic for the same household and week', () => {
    const input = { members: [member('a', [1]), member('b')], chores: [chore('x', 3), chore('y', 2), chore('z', 1, 'daily')] };
    expect(plan(input)).toEqual(plan(input));
  });

  test('positive balance (owed effort) means more work, with a debt reason', () => {
    const chores = Array.from({ length: 6 }, (_, i) => chore(`c${i}`, 1));
    const result = plan({ members: [member('a', [], 2, 'b'), member('b')], chores });
    expect(result.totals.a).toBeGreaterThan(result.totals.b);
    expect(result.assignments.some((x) => x.userId === 'a' && x.reason.code === 'debt')).toBe(true);
  });

  test('negative balance (credit) means less work', () => {
    const chores = Array.from({ length: 6 }, (_, i) => chore(`c${i}`, 1));
    const result = plan({ members: [member('a', [], -2), member('b')], chores });
    expect(result.totals.a).toBeLessThan(result.totals.b);
  });

  test('debt is clamped to ±3 per week', () => {
    expect(clampDebt(9)).toBe(3);
    expect(clampDebt(-9)).toBe(-3);
    expect(clampDebt(2)).toBe(2);
  });

  test('rotates: whoever did a chore last week does not get it again, and the reason says so', () => {
    const result = plan({
      members: [member('a'), member('b')],
      chores: [chore('bins', 1)],
      history: [{ choreId: 'bins', userId: 'a', weekStart: '2026-09-28' }],
    });
    expect(result.assignments[0]).toMatchObject({ userId: 'b', reason: { code: 'turn', previousUserId: 'a' } });
  });

  test('spreads heavy chores: nobody gets two heavy chores on one day when avoidable', () => {
    const result = plan({ members: [member('a'), member('b')], chores: [chore('h1', 3), chore('h2', 3), chore('h3', 3), chore('h4', 3)] });
    const seen = new Set<string>();
    for (const a of result.assignments) {
      const key = `${a.userId}:${a.day}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  test('adds to an existing week using existing totals', () => {
    const result = plan({ members: [member('a'), member('b')], chores: [chore('new', 1)], existingTotals: { a: 5, b: 1 }, fromDay: 3 });
    expect(result.assignments[0].userId).toBe('b');
    expect(result.assignments[0].day).toBeGreaterThanOrEqual(3);
  });

  test('a heavy daily chore on a day everyone is busy is flagged, not dropped', () => {
    const result = plan({ members: [member('a', [2]), member('b', [2])], chores: [chore('deep', 3, 'daily')] });
    const wed = result.assignments.find((a) => a.day === 2)!;
    expect(wed.reason).toEqual({ code: 'everyone_busy', day: 2 });
    expect(result.flags).toEqual([{ choreId: 'deep', day: 2 }]);
  });

  test('balance reasons quote the final weekly totals', () => {
    const result = plan({ members: [member('a'), member('b')], chores: [chore('x', 2), chore('y', 1)] });
    for (const a of result.assignments) {
      if (a.reason.code === 'balance') expect(a.reason.points).toBe(result.totals[a.userId]);
    }
  });

  test('property: hard rules hold for 300 random households', () => {
    const rand = seededRandom('property');
    const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
    for (let run = 0; run < 300; run++) {
      const members = Array.from({ length: 1 + Math.floor(rand() * 6) }, (_, i) =>
        member(`m${i}`, ([0, 1, 2, 3, 4, 5, 6] as Weekday[]).filter(() => rand() < 0.3), Math.round(rand() * 10 - 5)));
      const chores = Array.from({ length: Math.floor(rand() * 16) }, (_, i) =>
        chore(`c${i}`, pick([1, 2, 3] as const), pick(['daily', 'weekly', 'biweekly'] as const)));
      const result = plan({ householdId: `h${run}`, members, chores });
      const expected = expandChores(chores, WEEK);
      expect(result.assignments).toHaveLength(expected.length);
      expect(Object.values(result.totals).reduce((s, n) => s + n, 0)).toBe(expected.reduce((s, i) => s + i.chore.effort, 0));
      for (const a of result.assignments) {
        if (a.effort !== 3) continue;
        const m = members.find((x) => x.userId === a.userId)!;
        if (a.reason.code === 'everyone_busy') {
          expect(members.every((x) => x.busyDays.includes(a.day))).toBe(true);
        } else {
          expect(m.busyDays).not.toContain(a.day);
        }
      }
    }
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run supabase/functions/_shared/domain/rotation.test.ts`
Expected: FAIL — `Failed to resolve import "./rotation.ts"`.

- [ ] **Step 4: Implement `rotation.ts`**

```ts
import type { ChoreInput, Effort, PlanInput, PlanResult, PlannedAssignment, Reason } from './types.ts';
import { addDays, type Weekday, weeksBetween } from './time.ts';

export const DEBT_CLAMP = 3;
export const clampDebt = (balance: number) => Math.max(-DEBT_CLAMP, Math.min(DEBT_CLAMP, balance));

/** Deterministic PRNG: the same household + week always produces the same plan. */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ChoreInstance { chore: ChoreInput; day: Weekday | null }

/** Daily chores get a fixed day each; weekly/biweekly chores float and are placed by the planner. */
export function expandChores(chores: ChoreInput[], weekStart: string, fromDay: Weekday = 0): ChoreInstance[] {
  const out: ChoreInstance[] = [];
  for (const chore of chores) {
    if (chore.cadence === 'daily') {
      for (let d = fromDay; d <= 6; d++) out.push({ chore, day: d as Weekday });
    } else if (chore.cadence === 'weekly' || Math.abs(weeksBetween(chore.createdWeek, weekStart)) % 2 === 0) {
      out.push({ chore, day: null });
    }
  }
  return out;
}

export function generatePlan(input: PlanInput): PlanResult {
  const { members, history, weekStart } = input;
  const fromDay: Weekday = input.fromDay ?? 0;
  const totals: Record<string, number> = Object.fromEntries(
    members.map((m) => [m.userId, input.existingTotals?.[m.userId] ?? 0]),
  );
  if (members.length === 0) return { assignments: [], totals, flags: [] };

  const rand = seededRandom(`${input.householdId}:${weekStart}:${fromDay}`);
  // Heaviest first; fixed-day instances before floating ones (floating ones fit around them); seeded tie-break.
  const instances = expandChores(input.chores, weekStart, fromDay)
    .map((inst) => ({ ...inst, tie: rand() }))
    .sort((a, b) => b.chore.effort - a.chore.effort || Number(a.day === null) - Number(b.day === null) || a.tie - b.tie);

  const sumNew = instances.reduce((s, i) => s + i.chore.effort, 0);
  const sumExisting = Object.values(totals).reduce((s, n) => s + n, 0);
  const fair = (sumNew + sumExisting) / members.length;
  const target = new Map(members.map((m) => [m.userId, fair + clampDebt(m.balance)]));
  const busy = new Map(members.map((m) => [m.userId, new Set<number>(m.busyDays)]));
  const prevWeek = addDays(weekStart, -7);
  const lastWeek = new Map(history.filter((h) => h.weekStart === prevWeek).map((h) => [h.choreId, h.userId]));
  const dayLoad = Array<number>(7).fill(0);
  const heavyOn = new Map(members.map((m) => [m.userId, Array<number>(7).fill(0)]));
  const allowedDays = Array.from({ length: 7 - fromDay }, (_, i) => (fromDay + i) as Weekday);
  const over = (userId: string) => totals[userId] - target.get(userId)!;

  const explain = (choreId: string, userId: string, day: Weekday, effort: Effort): Reason => {
    const m = members.find((x) => x.userId === userId)!;
    if (effort === 3) {
      const busyInRange = allowedDays.filter((d) => busy.get(userId)!.has(d));
      if (busyInRange.length > 0) {
        const nearest = busyInRange.reduce((a, b) => (Math.abs(b - day) < Math.abs(a - day) ? b : a));
        return { code: 'busy_moved', busyDay: nearest };
      }
    }
    const previous = lastWeek.get(choreId);
    if (previous && previous !== userId) return { code: 'turn', previousUserId: previous };
    const debt = clampDebt(m.balance);
    if (debt > 0) return m.coveredBy ? { code: 'debt', coveredBy: m.coveredBy } : { code: 'debt' };
    if (debt < 0) return { code: 'credit' };
    return { code: 'balance', points: 0, target: 0 }; // filled with final totals below
  };

  const assignments: PlannedAssignment[] = [];
  const flags: PlanResult['flags'] = [];

  for (const inst of instances) {
    const effort = inst.chore.effort;
    const days = inst.day === null ? allowedDays : [inst.day];
    let best: { userId: string; day: Weekday; cost: number } | null = null;
    for (const m of members) {
      for (const day of days) {
        const isBusy = busy.get(m.userId)!.has(day);
        if (effort === 3 && isBusy) continue; // hard rule: Heavy never on a busy day
        let cost = over(m.userId) + effort;
        if (effort === 2 && isBusy) cost += 1.5;
        if (lastWeek.get(inst.chore.id) === m.userId) cost += 1;
        if (effort === 3 && heavyOn.get(m.userId)![day] > 0) cost += 2;
        cost += dayLoad[day] * 0.05;
        if (!best || cost < best.cost - 1e-9) best = { userId: m.userId, day, cost };
      }
    }
    let reason: Reason | null = null;
    if (!best) {
      // Heavy chore and everyone is busy on every allowed day: whoever is furthest under target takes it.
      const day = days[0];
      const m = members.reduce((a, b) => (over(b.userId) < over(a.userId) ? b : a));
      best = { userId: m.userId, day, cost: 0 };
      reason = { code: 'everyone_busy', day };
      flags.push({ choreId: inst.chore.id, day });
    }
    totals[best.userId] += effort;
    dayLoad[best.day] += effort;
    if (effort === 3) heavyOn.get(best.userId)![best.day] += 1;
    assignments.push({
      choreId: inst.chore.id, userId: best.userId, day: best.day, effort,
      reason: reason ?? explain(inst.chore.id, best.userId, best.day, effort),
    });
  }

  for (const a of assignments) {
    if (a.reason.code === 'balance') a.reason = { code: 'balance', points: totals[a.userId], target: Math.round(target.get(a.userId)!) };
  }
  return { assignments, totals, flags };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run supabase/functions/_shared/domain/rotation.test.ts`
Expected: PASS (15 tests). If the "light-only" test fails with an uneven split, the tie-break is favouring one member: confirm `cost < best.cost - 1e-9` (strict) so the first member in input order wins exact ties and `over()` drives the rest.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/domain/types.ts supabase/functions/_shared/domain/rotation.ts supabase/functions/_shared/domain/rotation.test.ts
git commit -m "feat(domain): effort-balanced weekly rotation with busy-day rules"
```

---
### Task 4: Domain — private ledger and household streak

**Files:**
- Create: `supabase/functions/_shared/domain/ledger.ts`, `supabase/functions/_shared/domain/streak.ts`
- Test: `supabase/functions/_shared/domain/ledger.test.ts`, `supabase/functions/_shared/domain/streak.test.ts`

**Interfaces:**
- Consumes: `clampDebt` (Task 3), `AssignmentStatus` (Task 3).
- Produces (`ledger.ts`) — mirrors the SQL rules in Task 8 so the app can preview them:
  - `type Balances = Record<string, number>`
  - `applyClaim(b: Balances, missedUserId: string, claimerId: string, effort: number): Balances` — missed `+effort`, claimer `−effort`
  - `applyExpiry(b: Balances, missedUserId: string, effort: number): Balances` — missed `+effort`
  - `applySwap(b: Balances, fromUser: string, fromEffort: number, toUser: string, toEffort: number): Balances`
  - `swapDelta(fromEffort: number, toEffort: number): number` — points the requester gains (+) or gives up (−) by swapping
  - `consumeIntoPlan(balance: number): number` — balance left after a plan absorbed its clamped part
- Produces (`streak.ts`):
  - `type DayOutcome = 'kept' | 'broken' | 'pending' | 'empty'`
  - `dayOutcome(statuses: AssignmentStatus[]): DayOutcome`
  - `interface Streak { current: number; best: number; lastSettledDay: string | null }`
  - `settleDay(s: Streak, day: string, outcome: 'kept' | 'broken' | 'empty'): Streak`

- [ ] **Step 1: Write the failing tests**

`ledger.test.ts`:

```ts
import { expect, test } from 'vitest';
import { applyClaim, applyExpiry, applySwap, consumeIntoPlan, swapDelta } from './ledger.ts';

test('a claim moves the effort from the person who missed to the claimer', () => {
  expect(applyClaim({ a: 0, b: 0 }, 'a', 'b', 3)).toEqual({ a: 3, b: -3 });
});
test('expiry adds the effort to the person who missed it only', () => {
  expect(applyExpiry({ a: 1 }, 'a', 2)).toEqual({ a: 3 });
});
test('swapping a light task for a heavy one credits the requester', () => {
  // a gives away a Light (1) and takes b's Heavy (3): a now does 2 more → a is owed 2
  expect(applySwap({ a: 0, b: 0 }, 'a', 1, 'b', 3)).toEqual({ a: -2, b: 2 });
  expect(swapDelta(1, 3)).toBe(2);
});
test('equal swaps change nothing', () => {
  expect(applySwap({ a: 1, b: -1 }, 'a', 2, 'b', 2)).toEqual({ a: 1, b: -1 });
});
test('a plan absorbs at most 3 points of balance per week', () => {
  expect(consumeIntoPlan(5)).toBe(2);
  expect(consumeIntoPlan(-4)).toBe(-1);
  expect(consumeIntoPlan(2)).toBe(0);
});
test('inputs are not mutated', () => {
  const b = { a: 0 };
  applyExpiry(b, 'a', 1);
  expect(b).toEqual({ a: 0 });
});
```

`streak.test.ts`:

```ts
import { expect, test } from 'vitest';
import { dayOutcome, settleDay } from './streak.ts';

test('dayOutcome', () => {
  expect(dayOutcome([])).toBe('empty');
  expect(dayOutcome(['done', 'done'])).toBe('kept');
  expect(dayOutcome(['done', 'missed'])).toBe('pending');
  expect(dayOutcome(['done', 'claimed'])).toBe('pending');
  expect(dayOutcome(['done', 'expired'])).toBe('broken');
});
test('kept days grow the streak and best', () => {
  expect(settleDay({ current: 4, best: 4, lastSettledDay: '2026-10-01' }, '2026-10-02', 'kept'))
    .toEqual({ current: 5, best: 5, lastSettledDay: '2026-10-02' });
});
test('a broken day resets current but keeps best', () => {
  expect(settleDay({ current: 4, best: 9, lastSettledDay: null }, '2026-10-02', 'broken'))
    .toEqual({ current: 0, best: 9, lastSettledDay: '2026-10-02' });
});
test('empty days neither grow nor break the streak', () => {
  expect(settleDay({ current: 4, best: 9, lastSettledDay: null }, '2026-10-02', 'empty'))
    .toEqual({ current: 4, best: 9, lastSettledDay: '2026-10-02' });
});
test('a day is only ever settled once', () => {
  const s = { current: 4, best: 9, lastSettledDay: '2026-10-02' };
  expect(settleDay(s, '2026-10-02', 'kept')).toBe(s);
  expect(settleDay(s, '2026-10-01', 'broken')).toBe(s);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run supabase/functions/_shared/domain/ledger.test.ts supabase/functions/_shared/domain/streak.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `ledger.ts`**

```ts
import { clampDebt } from './rotation.ts';

/** Private effort balance per member: + owes effort, − is owed effort. */
export type Balances = Record<string, number>;

const add = (b: Balances, userId: string, n: number): Balances => ({ ...b, [userId]: (b[userId] ?? 0) + n });

export function applyClaim(b: Balances, missedUserId: string, claimerId: string, effort: number): Balances {
  return add(add(b, missedUserId, effort), claimerId, -effort);
}

export function applyExpiry(b: Balances, missedUserId: string, effort: number): Balances {
  return add(b, missedUserId, effort);
}

/** Points the requester takes on (+) or hands off (−) by swapping their task for the other one. */
export const swapDelta = (fromEffort: number, toEffort: number) => toEffort - fromEffort;

export function applySwap(b: Balances, fromUser: string, fromEffort: number, toUser: string, toEffort: number): Balances {
  const delta = swapDelta(fromEffort, toEffort);
  return add(add(b, fromUser, -delta), toUser, delta);
}

export function consumeIntoPlan(balance: number): number {
  return balance - clampDebt(balance);
}
```

- [ ] **Step 4: Implement `streak.ts`**

```ts
import type { AssignmentStatus } from './types.ts';

export type DayOutcome = 'kept' | 'broken' | 'pending' | 'empty';

export function dayOutcome(statuses: AssignmentStatus[]): DayOutcome {
  if (statuses.length === 0) return 'empty';
  if (statuses.includes('expired')) return 'broken';
  if (statuses.every((s) => s === 'done')) return 'kept';
  return 'pending';
}

/** The household's shared streak. Never per person. */
export interface Streak { current: number; best: number; lastSettledDay: string | null }

export function settleDay(s: Streak, day: string, outcome: 'kept' | 'broken' | 'empty'): Streak {
  if (s.lastSettledDay && day <= s.lastSettledDay) return s;
  if (outcome === 'empty') return { ...s, lastSettledDay: day };
  if (outcome === 'broken') return { ...s, current: 0, lastSettledDay: day };
  const current = s.current + 1;
  return { current, best: Math.max(s.best, current), lastSettledDay: day };
}
```

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run supabase/functions/_shared/domain/ledger.test.ts supabase/functions/_shared/domain/streak.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/domain/ledger.* supabase/functions/_shared/domain/streak.*
git commit -m "feat(domain): private effort ledger and household streak rules"
```

---

### Task 5: Domain — copy (reasons, nudges, errors, balance)

**Files:**
- Create: `supabase/functions/_shared/domain/copy.ts`
- Test: `supabase/functions/_shared/domain/copy.test.ts`

**Interfaces:**
- Consumes: `Reason`, `NudgeStyle`, `Effort` (Task 3); `DAY_NAMES` (Task 2).
- Produces:
  - `effortLabel(e: number): 'Light' | 'Medium' | 'Heavy'`
  - `reasonText(r: Reason, names: Record<string, string>): string`
  - `type NudgeKind = 'digest' | 'pool' | 'plan_ready' | 'plan_locked' | 'covered' | 'day_kept' | 'swap_request' | 'swap_answer' | 'joined'`
  - `interface NudgePayload { chore?: string; chores?: string[]; actor?: string; streak?: number; effort?: number; accepted?: boolean; offered?: string }`
  - `nudge(kind: NudgeKind, style: NudgeStyle, p: NudgePayload): { title: string; body: string }`
  - `errorText(code: string): string`
  - `balanceSentence(balance: number): string`
  - `ERROR_CODES` — the server's error codes (used by Task 8 SQL and Task 10 client)

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test } from 'vitest';
import { balanceSentence, effortLabel, errorText, nudge, reasonText } from './copy.ts';

const names = { a: 'Aarav', p: 'Priya' };

describe('reasonText — every assignment explains itself in one sentence', () => {
  test.each([
    [{ code: 'busy_moved', busyDay: 2 } as const, 'Heavy task moved off your busy Wednesday.'],
    [{ code: 'turn', previousUserId: 'p' } as const, 'Your turn — Priya did it last week.'],
    [{ code: 'debt', coveredBy: 'p' } as const, 'A little extra this week — Priya covered for you.'],
    [{ code: 'debt' } as const, 'A little extra this week to even things out.'],
    [{ code: 'credit' } as const, 'A lighter week — you covered for a roommate.'],
    [{ code: 'balance', points: 6, target: 7 } as const, "Evens out effort: you're at 6 of 7 points this week."],
    [{ code: 'everyone_busy', day: 4 } as const, "Everyone's busy Friday, so this went to whoever had the lightest week."],
    [{ code: 'swap', withUserId: 'a' } as const, 'Swapped with Aarav.'],
  ])('%o', (reason, text) => expect(reasonText(reason, names)).toBe(text));

  test('unknown names fall back gracefully', () => {
    expect(reasonText({ code: 'turn', previousUserId: 'zz' }, names)).toBe('Your turn — a roommate did it last week.');
  });
});

describe('nudge — two tones, never nagging', () => {
  test('digest', () => {
    expect(nudge('digest', 'motivate', { chores: ['Bathroom', 'Take out trash'] }))
      .toEqual({ title: 'Good morning 🌱', body: '2 tasks today — Bathroom and Take out trash.' });
    expect(nudge('digest', 'facts', { chores: ['Bathroom'] }))
      .toEqual({ title: 'Today', body: 'Bathroom.' });
  });
  test('pool', () => {
    expect(nudge('pool', 'motivate', { chore: 'Mop bathroom floor' }).body).toBe('Up for grabs: Mop bathroom floor. Be a hero?');
    expect(nudge('pool', 'facts', { chore: 'Mop bathroom floor' }).body).toBe('Unclaimed: Mop bathroom floor.');
  });
  test('covered is private and kind', () => {
    expect(nudge('covered', 'motivate', { actor: 'Aarav', chore: 'Bathroom', effort: 3 }).body)
      .toBe("Aarav covered the Bathroom — you'll pick up a little extra next week (+3 pts).");
    expect(nudge('covered', 'facts', { actor: 'Aarav', chore: 'Bathroom', effort: 1 }).body)
      .toBe('Aarav covered Bathroom. +1 pt next week.');
  });
  test('every kind has copy in both tones', () => {
    const kinds = ['digest', 'pool', 'plan_ready', 'plan_locked', 'covered', 'day_kept', 'swap_request', 'swap_answer', 'joined'] as const;
    for (const k of kinds) for (const s of ['motivate', 'facts'] as const) {
      const n = nudge(k, s, { chore: 'X', chores: ['X'], actor: 'A', streak: 2, effort: 1, accepted: true, offered: 'Y' });
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.body.length).toBeGreaterThan(0);
      expect(n.body).not.toMatch(/you forgot|you failed|again\?/i);
    }
  });
});

test('effortLabel', () => {
  expect([1, 2, 3].map(effortLabel)).toEqual(['Light', 'Medium', 'Heavy']);
});

test('errorText maps server codes and falls back', () => {
  expect(errorText('already_claimed')).toBe('Someone already grabbed this one.');
  expect(errorText('something_new')).toBe("Something went wrong. We'll keep trying.");
});

test('balanceSentence never ranks, only explains', () => {
  expect(balanceSentence(0)).toBe("You're all square with the house.");
  expect(balanceSentence(2)).toBe("You'll pick up 2 extra points over the next week.");
  expect(balanceSentence(-1)).toBe("You're 1 point ahead — next week will be a little lighter.");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run supabase/functions/_shared/domain/copy.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `copy.ts`**

```ts
import type { NudgeStyle, Reason } from './types.ts';
import { DAY_NAMES } from './time.ts';

export const effortLabel = (e: number) => (e >= 3 ? 'Heavy' : e === 2 ? 'Medium' : 'Light') as 'Light' | 'Medium' | 'Heavy';

const nameOf = (names: Record<string, string>, id?: string) => (id && names[id]) || 'a roommate';
const pts = (n: number) => `${n} pt${n === 1 ? '' : 's'}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export function reasonText(r: Reason, names: Record<string, string>): string {
  switch (r.code) {
    case 'busy_moved': return `Heavy task moved off your busy ${DAY_NAMES[r.busyDay]}.`;
    case 'turn': return `Your turn — ${nameOf(names, r.previousUserId)} did it last week.`;
    case 'debt': return r.coveredBy ? `A little extra this week — ${nameOf(names, r.coveredBy)} covered for you.` : 'A little extra this week to even things out.';
    case 'credit': return 'A lighter week — you covered for a roommate.';
    case 'balance': return `Evens out effort: you're at ${r.points} of ${r.target} points this week.`;
    case 'everyone_busy': return `Everyone's busy ${DAY_NAMES[r.day]}, so this went to whoever had the lightest week.`;
    case 'swap': return `Swapped with ${nameOf(names, r.withUserId)}.`;
  }
}

export type NudgeKind =
  | 'digest' | 'pool' | 'plan_ready' | 'plan_locked' | 'covered' | 'day_kept' | 'swap_request' | 'swap_answer' | 'joined';

export interface NudgePayload {
  chore?: string; chores?: string[]; actor?: string; streak?: number; effort?: number; accepted?: boolean; offered?: string;
}

type Copy = { title: string; body: string };

export function nudge(kind: NudgeKind, style: NudgeStyle, p: NudgePayload): Copy {
  const m = style === 'motivate';
  const chores = p.chores ?? [];
  switch (kind) {
    case 'digest':
      return m
        ? { title: 'Good morning 🌱', body: `${chores.length} task${chores.length === 1 ? '' : 's'} today — ${list(chores)}.` }
        : { title: 'Today', body: `${list(chores)}.` };
    case 'pool':
      return m ? { title: 'Up for grabs 🙌', body: `Up for grabs: ${p.chore}. Be a hero?` } : { title: 'Unclaimed chore', body: `Unclaimed: ${p.chore}.` };
    case 'plan_ready':
      return m ? { title: "Next week's plan 📋", body: '30 seconds to check it — swap anything that clashes.' } : { title: 'Plan ready', body: "Next week's plan is ready for review." };
    case 'plan_locked':
      return m ? { title: 'Your week is planned ✨', body: 'Fair split, busy days respected. Nothing to sort out.' } : { title: 'Plan locked', body: "Next week's plan is set." };
    case 'covered':
      return m
        ? { title: 'Covered for you', body: `${p.actor} covered the ${p.chore} — you'll pick up a little extra next week (+${pts(p.effort ?? 1)}).` }
        : { title: 'Covered', body: `${p.actor} covered ${p.chore}. +${pts(p.effort ?? 1)} next week.` };
    case 'day_kept':
      return m ? { title: 'House peace secured ✨', body: `${p.streak}-day streak. Nicely done, everyone.` } : { title: 'Streak', body: `${p.streak} days.` };
    case 'swap_request':
      return m
        ? { title: 'Swap request 🔄', body: `${p.actor} wants to trade their ${p.offered} for your ${p.chore}.` }
        : { title: 'Swap request', body: `${p.actor}: ${p.offered} ↔ your ${p.chore}.` };
    case 'swap_answer':
      return p.accepted
        ? (m ? { title: 'Swap accepted 🤝', body: `${p.actor} took the trade.` } : { title: 'Swap accepted', body: `${p.actor} accepted.` })
        : (m ? { title: 'Swap declined', body: `${p.actor} would rather keep their task. No worries.` } : { title: 'Swap declined', body: `${p.actor} declined.` });
    case 'joined':
      return m ? { title: 'New roommate 🏠', body: `${p.actor} joined the house. Their chores start with next week's plan.` } : { title: 'New member', body: `${p.actor} joined.` };
  }
}

export const ERROR_CODES = [
  'not_authenticated', 'not_member', 'already_member', 'invalid_code', 'household_full', 'rate_limited',
  'already_claimed', 'not_allowed', 'undo_expired', 'plan_locked', 'invalid_input', 'swap_unavailable',
] as const;

const ERROR_COPY: Record<string, string> = {
  not_authenticated: 'Please sign in again.',
  not_member: "You're not in this household anymore.",
  already_member: "You're already in a household. Leave it first to join another.",
  invalid_code: "That code doesn't match a household. Check it with your roommate.",
  household_full: 'This household is full (8 people max).',
  rate_limited: 'Too many tries. Give it a minute.',
  already_claimed: 'Someone already grabbed this one.',
  not_allowed: "That can't be changed anymore.",
  undo_expired: 'Too late to undo — it stays done.',
  plan_locked: 'This plan is already locked.',
  invalid_input: 'Something in that form needs another look.',
  swap_unavailable: "That swap isn't possible anymore.",
};

export const errorText = (code: string) => ERROR_COPY[code] ?? "Something went wrong. We'll keep trying.";

export function balanceSentence(balance: number): string {
  if (balance === 0) return "You're all square with the house.";
  const n = Math.abs(balance);
  return balance > 0
    ? `You'll pick up ${n} extra point${n === 1 ? '' : 's'} over the next week.`
    : `You're ${n} point${n === 1 ? '' : 's'} ahead — next week will be a little lighter.`;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run supabase/functions/_shared/domain/copy.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/domain/copy.*
git commit -m "feat(domain): reason, nudge, error and balance copy in two tones"
```

---

### Task 6: Domain — the hourly tick decision

**Files:**
- Create: `supabase/functions/_shared/domain/tick.ts`
- Test: `supabase/functions/_shared/domain/tick.test.ts`

**Interfaces:**
- Consumes: `localParts`, `minutesOf`, `addDays`, `weekStartOf`, `Weekday` (Task 2); `dayOutcome`, `Streak` (Task 4); `AssignmentStatus` (Task 3); `NudgeKind` (Task 5).
- Produces:
  - `interface HouseholdSnapshot { id: string; tz: string; planMode: 'review' | 'auto'; dayEndsAt: string; activeMembers: number; plans: { id: string; weekStart: string; status: 'draft' | 'locked'; approvals: number; lockAt: string }[]; days: { date: string; statuses: AssignmentStatus[] }[]; streak: Streak; digestSentFor: string | null }`
  - `type TickAction = { kind: 'generate'; weekStart: string; status: 'draft' | 'locked'; fromDay: Weekday } | { kind: 'lock'; planId: string } | { kind: 'sweep'; date: string } | { kind: 'expire'; date: string } | { kind: 'settle'; date: string; outcome: 'kept' | 'broken' | 'empty' } | { kind: 'digest'; date: string }`
  - `decideTick(s: HouseholdSnapshot, now: Date): TickAction[]` — actions in execution order
  - `pushDecision(localHour: number, sentToday: number, kind: NudgeKind): 'send' | 'defer' | 'skip'`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test } from 'vitest';
import { decideTick, pushDecision, type HouseholdSnapshot } from './tick.ts';

// Kathmandu is UTC+5:45. Thursday 2026-10-01; week starts Monday 2026-09-28; next week 2026-10-05.
const at = (iso: string) => new Date(iso);
const THU_0845 = at('2026-10-01T03:00:00Z');
const THU_1500 = at('2026-10-01T09:15:00Z');
const THU_2105 = at('2026-10-01T15:20:00Z');
const THU_2205 = at('2026-10-01T16:20:00Z');
const SAT_1805 = at('2026-10-03T12:20:00Z');

const base = (over: Partial<HouseholdSnapshot> = {}): HouseholdSnapshot => ({
  id: 'h1', tz: 'Asia/Kathmandu', planMode: 'review', dayEndsAt: '22:00:00', activeMembers: 3,
  plans: [{ id: 'cur', weekStart: '2026-09-28', status: 'locked', approvals: 0, lockAt: '2026-09-27T12:15:00Z' }],
  days: [], streak: { current: 2, best: 5, lastSettledDay: '2026-09-30' }, digestSentFor: '2026-10-01',
  ...over,
});
const kinds = (s: HouseholdSnapshot, now: Date) => decideTick(s, now).map((a) => a.kind);

describe('plans', () => {
  test('a household without a plan this week gets one from today', () => {
    expect(decideTick(base({ plans: [] }), THU_1500)).toContainEqual({ kind: 'generate', weekStart: '2026-09-28', status: 'locked', fromDay: 3 });
  });
  test('Saturday 18:00 drafts next week in review mode', () => {
    expect(decideTick(base(), SAT_1805)).toContainEqual({ kind: 'generate', weekStart: '2026-10-05', status: 'draft', fromDay: 0 });
  });
  test('auto mode locks immediately', () => {
    expect(decideTick(base({ planMode: 'auto' }), SAT_1805)).toContainEqual({ kind: 'generate', weekStart: '2026-10-05', status: 'locked', fromDay: 0 });
  });
  test('never drafts twice', () => {
    const s = base({ plans: [...base().plans, { id: 'n', weekStart: '2026-10-05', status: 'draft', approvals: 0, lockAt: '2026-10-04T12:15:00Z' }] });
    expect(kinds(s, SAT_1805)).not.toContain('generate');
  });
  test('locks a draft when everyone approved', () => {
    const s = base({ plans: [{ id: 'n', weekStart: '2026-10-05', status: 'draft', approvals: 3, lockAt: '2026-10-04T12:15:00Z' }, ...base().plans] });
    expect(decideTick(s, SAT_1805)).toContainEqual({ kind: 'lock', planId: 'n' });
  });
  test('locks a draft once lockAt has passed, not before', () => {
    const draft = { id: 'n', weekStart: '2026-10-05', status: 'draft' as const, approvals: 1, lockAt: '2026-10-04T12:15:00Z' };
    const s = base({ plans: [...base().plans, draft] });
    expect(kinds(s, SAT_1805)).not.toContain('lock');
    expect(decideTick(s, at('2026-10-04T12:20:00Z'))).toContainEqual({ kind: 'lock', planId: 'n' });
  });
});

describe('missed chores', () => {
  const today = { date: '2026-10-01', statuses: ['done', 'todo'] as const };
  test('sweeps today once the day has ended', () => {
    expect(kinds(base({ days: [{ ...today, statuses: [...today.statuses] }] }), THU_2105)).not.toContain('sweep');
    expect(decideTick(base({ days: [{ ...today, statuses: [...today.statuses] }] }), THU_2205)).toContainEqual({ kind: 'sweep', date: '2026-10-01' });
  });
  test('expires yesterday 24 h after it ended, then settles it as broken', () => {
    const s = base({ days: [{ date: '2026-09-30', statuses: ['done', 'missed'] }], streak: { current: 2, best: 5, lastSettledDay: '2026-09-29' } });
    expect(kinds(s, THU_2105)).not.toContain('expire');
    const actions = decideTick(s, THU_2205);
    expect(actions).toContainEqual({ kind: 'expire', date: '2026-09-30' });
    expect(actions).toContainEqual({ kind: 'settle', date: '2026-09-30', outcome: 'broken' });
  });
});

describe('streak', () => {
  test('a fully done day settles as kept straight away', () => {
    expect(decideTick(base({ days: [{ date: '2026-10-01', statuses: ['done', 'done'] }] }), THU_1500))
      .toContainEqual({ kind: 'settle', date: '2026-10-01', outcome: 'kept' });
  });
  test('a pending day blocks later days from settling', () => {
    const s = base({ days: [{ date: '2026-10-01', statuses: ['done', 'missed'] }, { date: '2026-10-02', statuses: ['done'] }] });
    expect(kinds(s, at('2026-10-02T09:15:00Z'))).not.toContain('settle');
  });
  test('empty days settle only after their pool would have closed', () => {
    expect(kinds(base({ days: [{ date: '2026-10-01', statuses: [] }] }), THU_2205)).not.toContain('settle');
    expect(decideTick(base({ days: [{ date: '2026-10-01', statuses: [] }] }), at('2026-10-02T16:20:00Z')))
      .toContainEqual({ kind: 'settle', date: '2026-10-01', outcome: 'empty' });
  });
  test('already settled days are skipped', () => {
    expect(kinds(base({ days: [{ date: '2026-09-30', statuses: ['done'] }] }), THU_1500)).not.toContain('settle');
  });
});

describe('digest', () => {
  test('sent once in the 08:00–11:59 window', () => {
    expect(decideTick(base({ digestSentFor: null }), THU_0845)).toContainEqual({ kind: 'digest', date: '2026-10-01' });
    expect(kinds(base({ digestSentFor: '2026-10-01' }), THU_0845)).not.toContain('digest');
    expect(kinds(base({ digestSentFor: null }), THU_1500)).not.toContain('digest');
  });
});

describe('pushDecision', () => {
  test('quiet hours defer', () => {
    expect(pushDecision(23, 0, 'pool')).toBe('defer');
    expect(pushDecision(6, 0, 'pool')).toBe('defer');
    expect(pushDecision(7, 0, 'pool')).toBe('send');
  });
  test('daily cap skips everything except covered', () => {
    expect(pushDecision(12, 3, 'pool')).toBe('skip');
    expect(pushDecision(12, 3, 'covered')).toBe('send');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run supabase/functions/_shared/domain/tick.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `tick.ts`**

```ts
import type { AssignmentStatus } from './types.ts';
import type { NudgeKind } from './copy.ts';
import { dayOutcome, type Streak } from './streak.ts';
import { addDays, localParts, minutesOf, type Weekday, weekStartOf } from './time.ts';

export interface HouseholdSnapshot {
  id: string;
  tz: string;
  planMode: 'review' | 'auto';
  dayEndsAt: string;
  activeMembers: number;
  plans: { id: string; weekStart: string; status: 'draft' | 'locked'; approvals: number; lockAt: string }[];
  /** Recent days (up to 3 back) and today, ascending, with every assignment status on that day. */
  days: { date: string; statuses: AssignmentStatus[] }[];
  streak: Streak;
  digestSentFor: string | null;
}

export type TickAction =
  | { kind: 'generate'; weekStart: string; status: 'draft' | 'locked'; fromDay: Weekday }
  | { kind: 'lock'; planId: string }
  | { kind: 'sweep'; date: string }
  | { kind: 'expire'; date: string }
  | { kind: 'settle'; date: string; outcome: 'kept' | 'broken' | 'empty' }
  | { kind: 'digest'; date: string };

export function decideTick(s: HouseholdSnapshot, now: Date): TickAction[] {
  const local = localParts(now, s.tz);
  const nowMin = local.hour * 60 + local.minute;
  const endMin = minutesOf(s.dayEndsAt);
  const thisWeek = weekStartOf(local.date);
  const nextWeek = addDays(thisWeek, 7);
  const yesterday = addDays(local.date, -1);
  const hasPlan = (week: string) => s.plans.some((p) => p.weekStart === week);
  const ended = (date: string) => date < local.date || (date === local.date && nowMin >= endMin);
  const poolClosed = (date: string) => date < yesterday || (date === yesterday && nowMin >= endMin);
  const actions: TickAction[] = [];

  if (!hasPlan(thisWeek)) actions.push({ kind: 'generate', weekStart: thisWeek, status: 'locked', fromDay: local.weekday });
  const draftWindow = (local.weekday === 5 && local.hour >= 18) || local.weekday === 6;
  if (draftWindow && !hasPlan(nextWeek)) {
    actions.push({ kind: 'generate', weekStart: nextWeek, status: s.planMode === 'auto' ? 'locked' : 'draft', fromDay: 0 });
  }
  for (const p of s.plans) {
    if (p.status === 'draft' && (p.approvals >= s.activeMembers || now.getTime() >= Date.parse(p.lockAt))) {
      actions.push({ kind: 'lock', planId: p.id });
    }
  }

  for (const d of s.days) {
    if (ended(d.date) && d.statuses.includes('todo')) actions.push({ kind: 'sweep', date: d.date });
    if (poolClosed(d.date) && d.statuses.some((st) => st === 'todo' || st === 'missed' || st === 'claimed')) {
      actions.push({ kind: 'expire', date: d.date });
    }
  }

  // Settle streak days in order, as they would look after this tick's sweep/expire.
  for (const d of s.days) {
    if (s.streak.lastSettledDay && d.date <= s.streak.lastSettledDay) continue;
    const closed = poolClosed(d.date);
    const statuses = closed ? d.statuses.map((st): AssignmentStatus => (st === 'done' ? 'done' : 'expired')) : d.statuses;
    const outcome = dayOutcome(statuses);
    if (outcome === 'pending' || (!closed && outcome !== 'kept')) break;
    actions.push({ kind: 'settle', date: d.date, outcome });
  }

  if (local.hour >= 8 && local.hour < 12 && s.digestSentFor !== local.date) actions.push({ kind: 'digest', date: local.date });
  return actions;
}

export const PUSH_DAILY_CAP = 3;

export function pushDecision(localHour: number, sentToday: number, kind: NudgeKind): 'send' | 'defer' | 'skip' {
  if (localHour >= 22 || localHour < 7) return 'defer';
  if (sentToday >= PUSH_DAILY_CAP && kind !== 'covered') return 'skip';
  return 'send';
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run supabase/functions/_shared/domain/tick.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the whole domain suite and commit**

Run: `npm test`
Expected: all domain tests pass, App smoke test passes.

```bash
git add supabase/functions/_shared/domain/tick.*
git commit -m "feat(domain): hourly tick decisions and push rules"
```

---
### Task 7: Database — schema, row-level security and `get_state()`

> **ACCOUNT CHECKPOINT.** Stop and ask Pema for: Supabase **project ref**, **database password**, **anon key**, **service_role key**, and a **personal access token** (supabase.com → Account → Access Tokens). In the dev project's Auth settings: Email provider on, "Confirm email" **off**, password sign-in **on** (tests only). Put them in `.env.local`:
>
> ```
> VITE_SUPABASE_URL=https://<ref>.supabase.co
> VITE_SUPABASE_ANON_KEY=<anon>
> SUPABASE_TEST_URL=https://<ref>.supabase.co
> SUPABASE_TEST_ANON_KEY=<anon>
> SUPABASE_TEST_SERVICE_KEY=<service_role>
> SUPABASE_ACCESS_TOKEN=<personal access token>
> SUPABASE_DB_PASSWORD=<db password>
> ```

**Files:**
- Create: `supabase/config.toml` (via `supabase init`)
- Create: `supabase/migrations/20261001000001_schema.sql`, `supabase/migrations/20261001000002_rls.sql`
- Create: `tests/db/helpers.ts`
- Modify: `vite.config.ts` (load all `.env.local` vars into tests)
- Modify: `package.json` (add `supabase` CLI dev dependency and `db:push` script)
- Test: `tests/db/rls.test.ts`

**Interfaces:**
- Produces tables (all columns snake_case): `profiles`, `households`, `members`, `chores`, `plans`, `plan_approvals`, `assignments`, `swap_requests`, `effort_ledger`, `streaks`, `push_subscriptions`, `activity`, `notifications`, `join_attempts`; schema `private` for internal helpers (not exposed by the API).
- Produces RPC `get_state() returns jsonb` with keys: `profile`, `household` (null when not in one), `members[] {user_id,name,color,role,busy_days}`, `chores[]`, `plans[] {id,week_start,status,lock_at,approved_by[]}`, `assignments[]`, `swaps[]` (pending), `streak {household_id,current,best,last_settled_day}`, `balance` (int, caller's own), `activity[]` (latest 50, newest first), `today` (household-local date).
- Produces test helpers: `hasDb: boolean`, `admin(): SupabaseClient`, `makeUser(name): Promise<{ id: string; client: SupabaseClient }>`, `seedHousehold(ownerId, extraMemberIds?): Promise<string>`, `seedPlan(householdId, weekStart, rows): Promise<string[]>`.

- [ ] **Step 1: Install the Supabase CLI and link the project**

Run:
```bash
npm i -D supabase@^2.48.0
npx supabase init
```
Answer **N** to both editor-settings prompts. Then (env loaded from `.env.local`):
```bash
set -a; . ./.env.local; set +a
npx supabase link --project-ref <ref> --password "$SUPABASE_DB_PASSWORD"
```
Expected: `Finished supabase link.`

Add to `package.json` scripts: `"db:push": "supabase db push"`.

- [ ] **Step 2: Load every `.env.local` variable into Vitest**

Replace the top of `vite.config.ts` so the config is a function and tests receive non-`VITE_` vars:

```ts
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: { '@domain': fileURLToPath(new URL('./supabase/functions/_shared/domain', import.meta.url)) },
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'] },
      manifest: {
        name: 'Roomie',
        short_name: 'Roomie',
        description: "Fair isn't equal. The household app that does the asking.",
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    env: loadEnv(mode, process.cwd(), ''),
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'supabase/functions/_shared/**/*.test.ts', 'supabase/functions/tick/**/*.test.ts', 'tests/db/**/*.test.ts'],
    testTimeout: 20_000,
  },
}));
```

- [ ] **Step 3: Write `supabase/migrations/20261001000001_schema.sql`**

```sql
create extension if not exists pgcrypto;
create schema if not exists private;

create type nudge_style as enum ('motivate', 'facts');
create type plan_mode as enum ('review', 'auto');
create type cadence as enum ('daily', 'weekly', 'biweekly');
create type plan_status as enum ('draft', 'locked');
create type assignment_status as enum ('todo', 'done', 'missed', 'claimed', 'expired');
create type swap_status as enum ('pending', 'accepted', 'declined');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '' check (char_length(name) <= 30),
  color text not null default '#ffedd5' check (color ~ '^#[0-9a-fA-F]{6}$'),
  nudge_style nudge_style not null default 'motivate',
  activity_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6}$'),
  plan_mode plan_mode not null default 'review',
  tz text not null default 'Asia/Kathmandu',
  day_ends_at time not null default '22:00',
  digest_sent_for date,
  created_at timestamptz not null default now()
);

create table members (
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  busy_days smallint[] not null default '{}',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (household_id, user_id)
);
create unique index members_one_active_household on members (user_id) where left_at is null;

create table chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null default '🧹',
  effort smallint not null check (effort between 1 and 3),
  cadence cadence not null default 'weekly',
  active boolean not null default true,
  created_week date not null,
  created_at timestamptz not null default now()
);

create table plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  week_start date not null,
  status plan_status not null,
  generated_at timestamptz not null default now(),
  lock_at timestamptz not null,
  unique (household_id, week_start)
);

create table plan_approvals (
  plan_id uuid not null references plans on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  approved_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans on delete cascade,
  household_id uuid not null references households on delete cascade,
  chore_id uuid not null references chores on delete cascade,
  user_id uuid not null references profiles,
  day date not null,
  effort smallint not null check (effort between 1 and 3),
  status assignment_status not null default 'todo',
  prev_status assignment_status,
  claimed_by uuid references profiles,
  done_at timestamptz,
  reason jsonb not null default '{}'::jsonb
);
create index assignments_household_day on assignments (household_id, day);

create table swap_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  from_assignment uuid not null references assignments on delete cascade,
  to_assignment uuid not null references assignments on delete cascade,
  from_user uuid not null references profiles,
  to_user uuid not null references profiles,
  status swap_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table effort_ledger (
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  balance integer not null default 0,
  last_covered_by uuid references profiles,
  updated_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table streaks (
  household_id uuid primary key references households on delete cascade,
  current integer not null default 0,
  best integer not null default 0,
  last_settled_day date
);

create table push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references profiles on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table activity (
  id bigint generated always as identity primary key,
  household_id uuid not null references households on delete cascade,
  kind text not null,
  actor uuid references profiles,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_household_recent on activity (household_id, created_at desc);

create table notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles on delete cascade,
  household_id uuid references households on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  skipped boolean not null default false
);
create index notifications_pending on notifications (created_at) where sent_at is null and not skipped;

create table join_attempts (
  user_id uuid not null references profiles on delete cascade,
  at timestamptz not null default now()
);
create index join_attempts_recent on join_attempts (user_id, at);

-- Every new auth user gets a profile row.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();
```

- [ ] **Step 4: Write `supabase/migrations/20261001000002_rls.sql`**

```sql
-- Helpers live in the private schema (not exposed through the API).
create function private.is_member(h uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where household_id = h and user_id = auth.uid() and left_at is null)
$$;

alter table profiles enable row level security;
alter table households enable row level security;
alter table members enable row level security;
alter table chores enable row level security;
alter table plans enable row level security;
alter table plan_approvals enable row level security;
alter table assignments enable row level security;
alter table swap_requests enable row level security;
alter table effort_ledger enable row level security;
alter table streaks enable row level security;
alter table push_subscriptions enable row level security;
alter table activity enable row level security;
alter table notifications enable row level security;
alter table join_attempts enable row level security;

-- Read-only policies. There are deliberately NO insert/update/delete policies:
-- every write goes through a security-definer RPC (Task 8).
create policy profiles_read on profiles for select using (
  id = auth.uid() or exists (
    select 1 from members a join members b on a.household_id = b.household_id
    where a.user_id = auth.uid() and a.left_at is null and b.user_id = profiles.id
  )
);
create policy households_read on households for select using (private.is_member(id));
create policy members_read on members for select using (private.is_member(household_id));
create policy chores_read on chores for select using (private.is_member(household_id));
create policy plans_read on plans for select using (private.is_member(household_id));
create policy approvals_read on plan_approvals for select using (
  exists (select 1 from plans p where p.id = plan_id and private.is_member(p.household_id))
);
create policy assignments_read on assignments for select using (private.is_member(household_id));
create policy swaps_read on swap_requests for select using (private.is_member(household_id));
create policy streaks_read on streaks for select using (private.is_member(household_id));
create policy activity_read on activity for select using (private.is_member(household_id));
-- Private by design: only you can ever read your effort balance, subscriptions and notifications.
create policy ledger_read_own on effort_ledger for select using (user_id = auth.uid());
create policy push_read_own on push_subscriptions for select using (user_id = auth.uid());
create policy notifications_read_own on notifications for select using (user_id = auth.uid());

alter publication supabase_realtime add table
  households, members, chores, plans, plan_approvals, assignments, swap_requests, streaks, activity;

create function get_state() returns jsonb
language plpgsql stable security definer set search_path = public, private as $$
declare
  me uuid := auth.uid();
  h uuid;
  today date;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  select household_id into h from members where user_id = me and left_at is null;
  if h is null then
    return jsonb_build_object('profile', (select to_jsonb(p) from profiles p where p.id = me), 'household', null);
  end if;
  select (now() at time zone x.tz)::date into today from households x where x.id = h;
  return jsonb_build_object(
    'profile', (select to_jsonb(p) from profiles p where p.id = me),
    'household', (select to_jsonb(x) from households x where x.id = h),
    'members', (select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', m.user_id, 'name', p.name, 'color', p.color, 'role', m.role, 'busy_days', m.busy_days)
        order by m.joined_at), '[]'::jsonb)
      from members m join profiles p on p.id = m.user_id where m.household_id = h and m.left_at is null),
    'chores', (select coalesce(jsonb_agg(to_jsonb(c) order by c.created_at), '[]'::jsonb)
      from chores c where c.household_id = h and c.active),
    'plans', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', pl.id, 'week_start', pl.week_start, 'status', pl.status, 'lock_at', pl.lock_at,
        'approved_by', (select coalesce(jsonb_agg(a.user_id), '[]'::jsonb) from plan_approvals a where a.plan_id = pl.id))
        order by pl.week_start), '[]'::jsonb)
      from plans pl where pl.household_id = h and pl.week_start >= today - 13),
    'assignments', (select coalesce(jsonb_agg(to_jsonb(a) order by a.day), '[]'::jsonb)
      from assignments a where a.household_id = h and a.day between today - 7 and today + 13),
    'swaps', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
      from swap_requests s where s.household_id = h and s.status = 'pending'),
    'streak', (select to_jsonb(s) from streaks s where s.household_id = h),
    'balance', coalesce((select l.balance from effort_ledger l where l.household_id = h and l.user_id = me), 0),
    'activity', (select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (select * from activity where household_id = h order by created_at desc limit 50) x),
    'today', today
  );
end $$;

revoke all on all functions in schema private from public, anon, authenticated;
```

- [ ] **Step 5: Push the migrations**

Run: `npx supabase db push --password "$SUPABASE_DB_PASSWORD"`
Expected: both migrations listed as applied, no errors.

- [ ] **Step 6: Write `tests/db/helpers.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_TEST_URL;
const anon = process.env.SUPABASE_TEST_ANON_KEY;
const service = process.env.SUPABASE_TEST_SERVICE_KEY;
export const hasDb = Boolean(url && anon && service);

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
export const admin = (): SupabaseClient => createClient(url!, service!, opts);

export async function makeUser(name: string): Promise<{ id: string; client: SupabaseClient }> {
  const email = `${name.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}@roomie.test`;
  const password = `pw-${crypto.randomUUID()}`;
  const { data, error } = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const client = createClient(url!, anon!, opts);
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  await admin().from('profiles').update({ name }).eq('id', data.user.id);
  return { id: data.user.id, client };
}

const code = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

/** Creates a household directly (service role), bypassing RPCs — for tests that only need rows. */
export async function seedHousehold(ownerId: string, extraMemberIds: string[] = []): Promise<string> {
  const db = admin();
  const { data: h, error } = await db.from('households').insert({ name: 'Test flat', invite_code: code() }).select('id').single();
  if (error) throw error;
  await db.from('members').insert([
    { household_id: h.id, user_id: ownerId, role: 'owner' },
    ...extraMemberIds.map((user_id) => ({ household_id: h.id, user_id })),
  ]);
  await db.from('effort_ledger').insert([ownerId, ...extraMemberIds].map((user_id) => ({ household_id: h.id, user_id })));
  await db.from('streaks').insert({ household_id: h.id });
  return h.id;
}

export interface SeedRow { userId: string; day: string; effort?: number; status?: string; choreName?: string }

/** Creates a locked plan with one chore per row; returns assignment ids in row order. */
export async function seedPlan(householdId: string, weekStart: string, rows: SeedRow[]): Promise<string[]> {
  const db = admin();
  const { data: plan, error } = await db.from('plans')
    .insert({ household_id: householdId, week_start: weekStart, status: 'locked', lock_at: new Date().toISOString() })
    .select('id').single();
  if (error) throw error;
  const ids: string[] = [];
  for (const r of rows) {
    const { data: chore } = await db.from('chores')
      .insert({ household_id: householdId, name: r.choreName ?? 'Bathroom', effort: r.effort ?? 1, created_week: weekStart })
      .select('id').single();
    const { data: a, error: e } = await db.from('assignments').insert({
      plan_id: plan.id, household_id: householdId, chore_id: chore!.id, user_id: r.userId,
      day: r.day, effort: r.effort ?? 1, status: r.status ?? 'todo',
    }).select('id').single();
    if (e) throw e;
    ids.push(a.id);
  }
  return ids;
}
```

- [ ] **Step 7: Write the failing test `tests/db/rls.test.ts`**

```ts
// @vitest-environment node
import { beforeAll, describe, expect, test } from 'vitest';
import { admin, hasDb, makeUser, seedHousehold } from './helpers';

describe.skipIf(!hasDb)('row-level security', () => {
  let a: Awaited<ReturnType<typeof makeUser>>;
  let b: Awaited<ReturnType<typeof makeUser>>;
  let stranger: Awaited<ReturnType<typeof makeUser>>;
  let h: string;

  beforeAll(async () => {
    [a, b, stranger] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Stranger')]);
    h = await seedHousehold(a.id, [b.id]);
    await admin().from('chores').insert({ household_id: h, name: 'Bathroom', effort: 3, created_week: '2026-09-28' });
    await admin().from('effort_ledger').update({ balance: 2 }).eq('household_id', h).eq('user_id', a.id);
  });

  test('members read their household; strangers read nothing', async () => {
    expect((await a.client.from('chores').select('id')).data).toHaveLength(1);
    expect((await stranger.client.from('chores').select('id')).data).toEqual([]);
    expect((await stranger.client.from('households').select('id')).data).toEqual([]);
  });

  test('the effort ledger is private to its owner', async () => {
    const mine = await a.client.from('effort_ledger').select('user_id, balance');
    expect(mine.data).toEqual([{ user_id: a.id, balance: 2 }]);
    const theirs = await b.client.from('effort_ledger').select('user_id, balance');
    expect(theirs.data).toEqual([{ user_id: b.id, balance: 0 }]);
  });

  test('clients cannot write tables directly', async () => {
    const res = await a.client.from('chores').insert({ household_id: h, name: 'Hack', effort: 1, created_week: '2026-09-28' });
    expect(res.error).not.toBeNull();
  });

  test('get_state returns the household for members and null for strangers', async () => {
    const mine = await a.client.rpc('get_state');
    expect(mine.data.household.id).toBe(h);
    expect(mine.data.members).toHaveLength(2);
    expect(mine.data.balance).toBe(2);
    const priya = await b.client.rpc('get_state');
    expect(priya.data.balance).toBe(0);
    const none = await stranger.client.rpc('get_state');
    expect(none.data.household).toBeNull();
  });

  test('private helpers are not callable through the API', async () => {
    const res = await a.client.schema('private' as never).rpc('is_member', { h });
    expect(res.error).not.toBeNull();
  });
});
```

- [ ] **Step 8: Run it**

Run: `npx vitest run tests/db/rls.test.ts`
Expected: PASS (5 tests). (Before Step 5 it fails with `relation "chores" does not exist` — if it does now, re-run Step 5.)

- [ ] **Step 9: Commit**

```bash
git add supabase package.json package-lock.json vite.config.ts tests/db
git commit -m "feat(db): schema, row-level security and get_state snapshot"
```

---
### Task 8: Database — every write as a guarded RPC

**Files:**
- Create: `supabase/migrations/20261001000003_rpc.sql`
- Test: `tests/db/rpc.test.ts`

**Interfaces:**
- Consumes: tables and `private.is_member` (Task 7); error codes from `ERROR_CODES` (Task 5) — SQL raises exactly these strings.
- Produces client RPCs (all `security definer`, all derive the caller from `auth.uid()`):
  - `update_profile(p_name text default null, p_color text default null, p_nudge nudge_style default null) → void`
  - `create_household(p_name text, p_busy smallint[], p_chores jsonb) → uuid` — `p_chores` = `[{name, icon, effort, cadence}]`
  - `join_household(p_code text, p_busy smallint[]) → uuid | null` — `null` means invalid code (attempt still counted)
  - `complete_assignment(p_id uuid) → void` (idempotent) · `undo_complete(p_id uuid) → void` (10-minute window)
  - `claim_assignment(p_id uuid) → void`
  - `approve_plan(p_plan uuid) → void`
  - `request_swap(p_from uuid, p_to uuid) → uuid` · `respond_swap(p_swap uuid, p_accept boolean) → boolean`
  - `add_chore(p_name text, p_icon text, p_effort smallint, p_cadence cadence) → uuid` · `archive_chore(p_id uuid) → void`
  - `update_busy_days(p_days smallint[]) → void`
  - `update_household(p_name text default null, p_plan_mode plan_mode default null, p_day_ends_at time default null) → void`
  - `rotate_invite_code() → text` (owner) · `remove_member(p_user uuid) → void` (owner) · `leave_household() → void`
  - `save_push_subscription(p_endpoint text, p_p256dh text, p_auth text) → void` · `delete_push_subscription(p_endpoint text) → void`
  - `mark_activity_seen() → void`
  - `normalize_code(c text) → text` (pure; same rule as the client's `normalizeCode`)
- Produces internal helpers in `private`: `me()`, `my_household()`, `today(h)`, `day_ended(h, d)`, `name(u)`, `log(h, kind, actor, payload)`, `notify(u, h, kind, payload)`, `notify_household(h, kind, payload, except)`, `valid_days(d)`, `gen_code()`, `depart(h, u)`.
- Activity kinds written: `created`, `joined`, `completed`, `claimed`, `covered`, `left`, `swapped`, `chore_added`. Notification kinds: `joined`, `covered`, `swap_request`, `swap_answer`.

- [ ] **Step 1: Write the failing tests `tests/db/rpc.test.ts`**

```ts
// @vitest-environment node
import { beforeAll, describe, expect, test } from 'vitest';
import { admin, hasDb, makeUser, seedHousehold, seedPlan } from './helpers';

type U = Awaited<ReturnType<typeof makeUser>>;
const todayKtm = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
const plusDays = (d: string, n: number) => new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);
const monday = (d: string) => plusDays(d, -((new Date(d).getUTCDay() + 6) % 7));

describe.skipIf(!hasDb)('household lifecycle', () => {
  let owner: U; let joiner: U;
  beforeAll(async () => { [owner, joiner] = await Promise.all([makeUser('Aarav'), makeUser('Priya')]); });

  test('create_household sets up home, chores, ledger and streak', async () => {
    const { data: h, error } = await owner.client.rpc('create_household', {
      p_name: 'Flat 4B', p_busy: [0, 2, 4],
      p_chores: [{ name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily' }, { name: 'Bathroom', icon: '🪣', effort: 3, cadence: 'weekly' }],
    });
    expect(error).toBeNull();
    const state = (await owner.client.rpc('get_state')).data;
    expect(state.household.id).toBe(h);
    expect(state.household.invite_code).toMatch(/^[A-Z0-9]{6}$/);
    expect(state.chores).toHaveLength(2);
    expect(state.members[0]).toMatchObject({ role: 'owner', busy_days: [0, 2, 4] });
    expect(state.streak.current).toBe(0);
  });

  test('join normalizes code: lowercase, spaces, dashes and full links all work', async () => {
    const code: string = (await owner.client.rpc('get_state')).data.household.invite_code;
    const messy = `https://roomie.example/j/${code.slice(0, 3).toLowerCase()}-${code.slice(3)}`;
    const { data, error } = await joiner.client.rpc('join_household', { p_code: messy, p_busy: [5] });
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect((await owner.client.rpc('get_state')).data.members).toHaveLength(2);
  });

  test('an unknown code returns null rather than an error', async () => {
    const lone = await makeUser('Lone');
    const { data, error } = await lone.client.rpc('join_household', { p_code: 'ZZZZZZ', p_busy: [] });
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  test('you cannot be in two households', async () => {
    const { error } = await joiner.client.rpc('create_household', { p_name: 'Second', p_busy: [], p_chores: [] });
    expect(error?.message).toContain('already_member');
  });
});

describe.skipIf(!hasDb)('chores, claims and the private ledger', () => {
  let a: U; let b: U; let c: U; let h: string;
  const today = todayKtm();
  const week = monday(today);

  beforeAll(async () => {
    [a, b, c] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima')]);
    h = await seedHousehold(a.id, [b.id, c.id]);
  });

  test('complete is idempotent (offline replays, double taps)', async () => {
    const [id] = await seedPlan(h, week, [{ userId: a.id, day: today }]);
    expect((await a.client.rpc('complete_assignment', { p_id: id })).error).toBeNull();
    expect((await a.client.rpc('complete_assignment', { p_id: id })).error).toBeNull();
    const { data } = await admin().from('assignments').select('status').eq('id', id).single();
    expect(data!.status).toBe('done');
  });

  test("you cannot complete someone else's todo", async () => {
    const [id] = await seedPlan(h, plusDays(week, 7), [{ userId: a.id, day: plusDays(today, 7) }]);
    expect((await b.client.rpc('complete_assignment', { p_id: id })).error?.message).toContain('not_allowed');
  });

  test('claim race: exactly one roommate wins', async () => {
    const [id] = await seedPlan(h, plusDays(week, 14), [{ userId: a.id, day: plusDays(today, -1), status: 'missed', effort: 3 }]);
    const results = await Promise.all([b.client.rpc('claim_assignment', { p_id: id }), c.client.rpc('claim_assignment', { p_id: id })]);
    const errors = results.filter((r) => r.error);
    expect(errors).toHaveLength(1);
    expect(errors[0].error!.message).toContain('already_claimed');
  });

  test('completing a claimed chore moves effort privately and notifies the person who missed it', async () => {
    const [id] = await seedPlan(h, plusDays(week, 21), [{ userId: a.id, day: plusDays(today, -1), status: 'missed', effort: 3 }]);
    await b.client.rpc('claim_assignment', { p_id: id });
    expect((await b.client.rpc('complete_assignment', { p_id: id })).error).toBeNull();
    expect((await a.client.rpc('get_state')).data.balance).toBe(3);
    expect((await b.client.rpc('get_state')).data.balance).toBe(-3);
    expect((await c.client.rpc('get_state')).data.balance).toBe(0);
    const { data: note } = await admin().from('notifications').select('kind, payload').eq('user_id', a.id).eq('kind', 'covered').single();
    expect(note!.payload).toMatchObject({ actor: 'Priya', effort: 3 });
  });

  test('undo window: refused after 10 minutes', async () => {
    const [id] = await seedPlan(h, plusDays(week, 28), [{ userId: a.id, day: today }]);
    await a.client.rpc('complete_assignment', { p_id: id });
    await admin().from('assignments').update({ done_at: new Date(Date.now() - 11 * 60_000).toISOString() }).eq('id', id);
    expect((await a.client.rpc('undo_complete', { p_id: id })).error?.message).toContain('undo_expired');
  });

  test('undo inside the window restores the chore', async () => {
    const [id] = await seedPlan(h, plusDays(week, 35), [{ userId: a.id, day: today }]);
    await a.client.rpc('complete_assignment', { p_id: id });
    expect((await a.client.rpc('undo_complete', { p_id: id })).error).toBeNull();
    const { data } = await admin().from('assignments').select('status').eq('id', id).single();
    expect(['todo', 'missed']).toContain(data!.status);
  });
});

describe.skipIf(!hasDb)('swaps and leaving', () => {
  let a: U; let b: U; let h: string;
  const today = todayKtm();

  beforeAll(async () => {
    [a, b] = await Promise.all([makeUser('Aarav'), makeUser('Priya')]);
    h = await seedHousehold(a.id, [b.id]);
  });

  test('accepting a light-for-heavy swap swaps owners and credits the requester', async () => {
    const tomorrow = plusDays(today, 1);
    const [mine, theirs] = await seedPlan(h, monday(tomorrow), [
      { userId: a.id, day: tomorrow, effort: 1, choreName: 'Trash' },
      { userId: b.id, day: tomorrow, effort: 3, choreName: 'Bathroom' },
    ]);
    const { data: swapId } = await a.client.rpc('request_swap', { p_from: mine, p_to: theirs });
    const { data: accepted } = await b.client.rpc('respond_swap', { p_swap: swapId, p_accept: true });
    expect(accepted).toBe(true);
    const { data: rows } = await admin().from('assignments').select('id, user_id').in('id', [mine, theirs]);
    expect(rows!.find((r) => r.id === mine)!.user_id).toBe(b.id);
    expect(rows!.find((r) => r.id === theirs)!.user_id).toBe(a.id);
    expect((await a.client.rpc('get_state')).data.balance).toBe(-2);
    expect((await b.client.rpc('get_state')).data.balance).toBe(2);
  });

  test('leaving cancels pending swaps and sends future chores to the claim pool', async () => {
    const later = plusDays(today, 2);
    // a different plan week from the previous test (one plan per household per week)
    const [mine, theirs] = await seedPlan(h, plusDays(monday(later), 7), [
      { userId: a.id, day: later, choreName: 'Dishes' },
      { userId: b.id, day: later, choreName: 'Sweep' },
    ]);
    const { data: swapId } = await a.client.rpc('request_swap', { p_from: mine, p_to: theirs });
    expect((await b.client.rpc('leave_household')).error).toBeNull();
    const { data: swap } = await admin().from('swap_requests').select('status').eq('id', swapId).single();
    expect(swap!.status).toBe('declined');
    const { data: orphan } = await admin().from('assignments').select('status').eq('id', theirs).single();
    expect(orphan!.status).toBe('missed');
    expect((await b.client.rpc('respond_swap', { p_swap: swapId, p_accept: true })).error?.message).toMatch(/swap_unavailable|not_member/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/db/rpc.test.ts`
Expected: FAIL — `Could not find the function public.create_household`.

- [ ] **Step 3: Write `supabase/migrations/20261001000003_rpc.sql`**

```sql
-- ───────── private helpers (not callable through the API) ─────────
create function private.me() returns uuid language plpgsql stable as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  return auth.uid();
end $$;

create function private.my_household() returns uuid
language plpgsql stable security definer set search_path = public as $$
declare h uuid;
begin
  select household_id into h from members where user_id = private.me() and left_at is null;
  if h is null then raise exception 'not_member'; end if;
  return h;
end $$;

create function private.today(h uuid) returns date
language sql stable security definer set search_path = public as $$
  select (now() at time zone tz)::date from households where id = h
$$;

create function private.day_ended(h uuid, d date) returns boolean
language sql stable security definer set search_path = public as $$
  select d < (now() at time zone tz)::date
      or (d = (now() at time zone tz)::date and (now() at time zone tz)::time >= day_ends_at)
  from households where id = h
$$;

create function private.name(u uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(name, ''), 'A roommate') from profiles where id = u
$$;

create function private.log(h uuid, k text, actor uuid, p jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = public as $$
  insert into activity (household_id, kind, actor, payload) values (h, k, actor, p)
$$;

create function private.notify(u uuid, h uuid, k text, p jsonb) returns void
language sql security definer set search_path = public as $$
  insert into notifications (user_id, household_id, kind, payload) values (u, h, k, p)
$$;

create function private.notify_household(h uuid, k text, p jsonb, except_user uuid default null) returns void
language sql security definer set search_path = public as $$
  insert into notifications (user_id, household_id, kind, payload)
  select user_id, h, k, p from members
  where household_id = h and left_at is null and user_id is distinct from except_user
$$;

create function private.valid_days(d smallint[]) returns smallint[] language plpgsql immutable as $$
begin
  if d is null then return '{}'; end if;
  if exists (select 1 from unnest(d) x where x < 0 or x > 6) then raise exception 'invalid_input'; end if;
  return (select coalesce(array_agg(distinct x order by x), '{}') from unnest(d) x);
end $$;

create function private.gen_code() returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 6)
$$;

-- Leaving (or being removed): future chores go to the claim pool, pending swaps are cancelled.
create function private.depart(h uuid, u uuid) returns void
language plpgsql security definer set search_path = public as $$
declare was_owner boolean;
begin
  select role = 'owner' into was_owner from members where household_id = h and user_id = u and left_at is null;
  update members set left_at = now(), role = 'member' where household_id = h and user_id = u and left_at is null;
  update assignments set status = 'missed'
    where household_id = h and user_id = u and status = 'todo' and day >= private.today(h);
  update swap_requests set status = 'declined'
    where household_id = h and status = 'pending' and (from_user = u or to_user = u);
  if was_owner then
    update members set role = 'owner'
    where household_id = h and user_id = (
      select user_id from members where household_id = h and left_at is null order by joined_at limit 1);
  end if;
  perform private.log(h, 'left', u, jsonb_build_object('actor', private.name(u)));
end $$;

revoke all on all functions in schema private from public, anon, authenticated;

-- ───────── client RPCs ─────────
create function normalize_code(c text) returns text language sql immutable as $$
  select upper(right(regexp_replace(coalesce(c, ''), '[^A-Za-z0-9]', '', 'g'), 6))
$$;

create function update_profile(p_name text default null, p_color text default null, p_nudge nudge_style default null)
returns void language plpgsql security definer set search_path = public, private as $$
begin
  if p_name is not null and char_length(trim(p_name)) not between 1 and 30 then raise exception 'invalid_input'; end if;
  if p_color is not null and p_color !~ '^#[0-9a-fA-F]{6}$' then raise exception 'invalid_input'; end if;
  update profiles set
    name = coalesce(trim(p_name), name),
    color = coalesce(p_color, color),
    nudge_style = coalesce(p_nudge, nudge_style)
  where id = private.me();
end $$;

create function create_household(p_name text, p_busy smallint[], p_chores jsonb)
returns uuid language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := private.me();
  h uuid;
  code text;
  wk date := date_trunc('week', now() at time zone 'Asia/Kathmandu')::date;
  c jsonb;
begin
  if exists (select 1 from members where user_id = me and left_at is null) then raise exception 'already_member'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 40 then raise exception 'invalid_input'; end if;
  loop
    code := private.gen_code();
    exit when not exists (select 1 from households where invite_code = code);
  end loop;
  insert into households (name, invite_code) values (trim(p_name), code) returning id into h;
  insert into members (household_id, user_id, role, busy_days) values (h, me, 'owner', private.valid_days(p_busy));
  for c in select * from jsonb_array_elements(coalesce(p_chores, '[]'::jsonb)) loop
    if char_length(trim(coalesce(c->>'name', ''))) not between 1 and 40 or (c->>'effort')::int not between 1 and 3 then
      raise exception 'invalid_input';
    end if;
    insert into chores (household_id, name, icon, effort, cadence, created_week)
    values (h, trim(c->>'name'), coalesce(c->>'icon', '🧹'), (c->>'effort')::smallint,
            coalesce((c->>'cadence')::cadence, 'weekly'), wk);
  end loop;
  insert into effort_ledger (household_id, user_id) values (h, me);
  insert into streaks (household_id) values (h);
  perform private.log(h, 'created', me, jsonb_build_object('actor', private.name(me)));
  return h;
end $$;

create function join_household(p_code text, p_busy smallint[])
returns uuid language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := private.me();
  h uuid;
begin
  if (select count(*) from join_attempts where user_id = me and at > now() - interval '10 minutes') >= 10 then
    raise exception 'rate_limited';
  end if;
  insert into join_attempts (user_id) values (me);
  if exists (select 1 from members where user_id = me and left_at is null) then raise exception 'already_member'; end if;
  select id into h from households where invite_code = normalize_code(p_code);
  if h is null then return null; end if; -- no exception, so the attempt above is kept for rate limiting
  if (select count(*) from members where household_id = h and left_at is null) >= 8 then raise exception 'household_full'; end if;
  insert into members (household_id, user_id, busy_days) values (h, me, private.valid_days(p_busy))
  on conflict (household_id, user_id) do update
    set left_at = null, busy_days = excluded.busy_days, joined_at = now(), role = 'member';
  insert into effort_ledger (household_id, user_id) values (h, me) on conflict do nothing;
  perform private.log(h, 'joined', me, jsonb_build_object('actor', private.name(me)));
  perform private.notify_household(h, 'joined', jsonb_build_object('actor', private.name(me)), me);
  return h;
end $$;

create function complete_assignment(p_id uuid)
returns void language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a assignments;
  chore_name text;
begin
  select * into a from assignments where id = p_id and household_id = h for update;
  if not found then raise exception 'not_allowed'; end if;
  select name into chore_name from chores where id = a.chore_id;
  -- idempotent: repeating a completion you already made is a no-op
  if a.status = 'done' and (a.claimed_by = me or (a.claimed_by is null and a.user_id = me)) then return; end if;

  if a.status in ('todo', 'missed') and a.user_id = me then
    update assignments set status = 'done', prev_status = a.status, done_at = now() where id = a.id;
    perform private.log(h, 'completed', me, jsonb_build_object('actor', private.name(me), 'chore', chore_name));
  elsif a.status = 'claimed' and a.claimed_by = me then
    update assignments set status = 'done', prev_status = 'claimed', done_at = now() where id = a.id;
    update effort_ledger set balance = balance + a.effort, last_covered_by = me, updated_at = now()
      where household_id = h and user_id = a.user_id;
    update effort_ledger set balance = balance - a.effort, updated_at = now()
      where household_id = h and user_id = me;
    perform private.log(h, 'covered', me, jsonb_build_object('actor', private.name(me), 'chore', chore_name));
    perform private.notify(a.user_id, h, 'covered',
      jsonb_build_object('actor', private.name(me), 'chore', chore_name, 'effort', a.effort));
  else
    raise exception 'not_allowed';
  end if;
end $$;

create function undo_complete(p_id uuid)
returns void language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a assignments;
  back assignment_status;
begin
  select * into a from assignments where id = p_id and household_id = h for update;
  if not found or a.status <> 'done' or not (a.claimed_by = me or (a.claimed_by is null and a.user_id = me)) then
    raise exception 'not_allowed';
  end if;
  if a.done_at < now() - interval '10 minutes' then raise exception 'undo_expired'; end if;
  if a.prev_status = 'claimed' then
    back := 'claimed';
    update effort_ledger set balance = balance - a.effort, updated_at = now() where household_id = h and user_id = a.user_id;
    update effort_ledger set balance = balance + a.effort, updated_at = now() where household_id = h and user_id = me;
  elsif a.prev_status = 'missed' or private.day_ended(h, a.day) then
    back := 'missed';
  else
    back := 'todo';
  end if;
  update assignments set status = back, prev_status = null, done_at = null where id = a.id;
end $$;

create function claim_assignment(p_id uuid)
returns void language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a assignments;
begin
  select * into a from assignments where id = p_id and household_id = h for update;
  if not found then raise exception 'not_allowed'; end if;
  if a.status = 'claimed' or (a.status = 'done' and a.claimed_by is not null) then raise exception 'already_claimed'; end if;
  if a.status <> 'missed' or a.user_id = me then raise exception 'not_allowed'; end if;
  update assignments set status = 'claimed', claimed_by = me where id = a.id;
  perform private.log(h, 'claimed', me, jsonb_build_object(
    'actor', private.name(me), 'chore', (select name from chores where id = a.chore_id)));
end $$;

create function approve_plan(p_plan uuid)
returns void language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  st plan_status;
begin
  select status into st from plans where id = p_plan and household_id = h;
  if not found then raise exception 'not_allowed'; end if;
  if st <> 'draft' then raise exception 'plan_locked'; end if;
  insert into plan_approvals (plan_id, user_id) values (p_plan, me) on conflict do nothing;
end $$;

create function request_swap(p_from uuid, p_to uuid)
returns uuid language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a1 assignments;
  a2 assignments;
  sid uuid;
begin
  select * into a1 from assignments where id = p_from and household_id = h for update;
  select * into a2 from assignments where id = p_to and household_id = h for update;
  if a1.id is null or a2.id is null or a1.user_id <> me or a2.user_id = me
     or a1.status <> 'todo' or a2.status <> 'todo'
     or a1.day < private.today(h) or a2.day < private.today(h)
     or exists (select 1 from swap_requests where from_assignment = a1.id and status = 'pending') then
    raise exception 'swap_unavailable';
  end if;
  insert into swap_requests (household_id, from_assignment, to_assignment, from_user, to_user)
  values (h, a1.id, a2.id, me, a2.user_id) returning id into sid;
  perform private.notify(a2.user_id, h, 'swap_request', jsonb_build_object(
    'actor', private.name(me),
    'chore', (select name from chores where id = a2.chore_id),
    'offered', (select name from chores where id = a1.chore_id)));
  return sid;
end $$;

create function respond_swap(p_swap uuid, p_accept boolean)
returns boolean language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  s swap_requests;
  a1 assignments;
  a2 assignments;
  delta int;
begin
  select * into s from swap_requests where id = p_swap and household_id = h and to_user = me and status = 'pending' for update;
  if not found then raise exception 'swap_unavailable'; end if;
  select * into a1 from assignments where id = s.from_assignment for update;
  select * into a2 from assignments where id = s.to_assignment for update;
  if not p_accept or a1.status <> 'todo' or a2.status <> 'todo' or a1.user_id <> s.from_user or a2.user_id <> s.to_user then
    update swap_requests set status = 'declined' where id = s.id;
    perform private.notify(s.from_user, h, 'swap_answer', jsonb_build_object('actor', private.name(me), 'accepted', false));
    return false;
  end if;
  update assignments set user_id = s.to_user, reason = jsonb_build_object('code', 'swap', 'withUserId', s.from_user) where id = a1.id;
  update assignments set user_id = s.from_user, reason = jsonb_build_object('code', 'swap', 'withUserId', s.to_user) where id = a2.id;
  delta := a2.effort - a1.effort; -- what the requester takes on
  update effort_ledger set balance = balance - delta, updated_at = now() where household_id = h and user_id = s.from_user;
  update effort_ledger set balance = balance + delta, updated_at = now() where household_id = h and user_id = s.to_user;
  update swap_requests set status = 'accepted' where id = s.id;
  update swap_requests set status = 'declined'
    where status = 'pending' and id <> s.id
      and (from_assignment in (a1.id, a2.id) or to_assignment in (a1.id, a2.id));
  perform private.notify(s.from_user, h, 'swap_answer', jsonb_build_object('actor', private.name(me), 'accepted', true));
  perform private.log(h, 'swapped', me, jsonb_build_object('actor', private.name(me), 'with', private.name(s.from_user)));
  return true;
end $$;

create function add_chore(p_name text, p_icon text, p_effort smallint, p_cadence cadence)
returns uuid language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  cid uuid;
begin
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 40 or p_effort not between 1 and 3 then
    raise exception 'invalid_input';
  end if;
  insert into chores (household_id, name, icon, effort, cadence, created_week)
  values (h, trim(p_name), coalesce(p_icon, '🧹'), p_effort, p_cadence, date_trunc('week', private.today(h))::date)
  returning id into cid;
  perform private.log(h, 'chore_added', me, jsonb_build_object('actor', private.name(me), 'chore', trim(p_name)));
  return cid;
end $$;

create function archive_chore(p_id uuid)
returns void language plpgsql security definer set search_path = public, private as $$
declare h uuid := private.my_household();
begin
  update chores set active = false where id = p_id and household_id = h;
  if not found then raise exception 'not_allowed'; end if;
  delete from assignments where chore_id = p_id and status = 'todo' and day > private.today(h);
end $$;

create function update_busy_days(p_days smallint[])
returns void language plpgsql security definer set search_path = public, private as $$
begin
  update members set busy_days = private.valid_days(p_days)
  where household_id = private.my_household() and user_id = private.me();
end $$;

create function update_household(p_name text default null, p_plan_mode plan_mode default null, p_day_ends_at time default null)
returns void language plpgsql security definer set search_path = public, private as $$
begin
  if p_name is not null and char_length(trim(p_name)) not between 1 and 40 then raise exception 'invalid_input'; end if;
  update households set
    name = coalesce(trim(p_name), name),
    plan_mode = coalesce(p_plan_mode, plan_mode),
    day_ends_at = coalesce(p_day_ends_at, day_ends_at)
  where id = private.my_household();
end $$;

create function rotate_invite_code()
returns text language plpgsql security definer set search_path = public, private as $$
declare
  h uuid := private.my_household();
  code text;
begin
  if not exists (select 1 from members where household_id = h and user_id = private.me() and role = 'owner' and left_at is null) then
    raise exception 'not_allowed';
  end if;
  loop
    code := private.gen_code();
    exit when not exists (select 1 from households where invite_code = code);
  end loop;
  update households set invite_code = code where id = h;
  return code;
end $$;

create function remove_member(p_user uuid)
returns void language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
begin
  if p_user = me or not exists (select 1 from members where household_id = h and user_id = me and role = 'owner' and left_at is null)
     or not exists (select 1 from members where household_id = h and user_id = p_user and left_at is null) then
    raise exception 'not_allowed';
  end if;
  perform private.depart(h, p_user);
end $$;

create function leave_household()
returns void language plpgsql security definer set search_path = public, private as $$
begin
  perform private.depart(private.my_household(), private.me());
end $$;

create function save_push_subscription(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = public, private as $$
begin
  insert into push_subscriptions (endpoint, user_id, p256dh, auth) values (p_endpoint, private.me(), p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

create function delete_push_subscription(p_endpoint text)
returns void language plpgsql security definer set search_path = public, private as $$
begin
  delete from push_subscriptions where endpoint = p_endpoint and user_id = private.me();
end $$;

create function mark_activity_seen()
returns void language plpgsql security definer set search_path = public, private as $$
begin
  update profiles set activity_seen_at = now() where id = private.me();
end $$;
```

- [ ] **Step 4: Push and run the tests**

Run: `npx supabase db push --password "$SUPABASE_DB_PASSWORD" && npx vitest run tests/db`
Expected: PASS — `rls.test.ts` (5) and `rpc.test.ts` (12).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261001000003_rpc.sql tests/db/rpc.test.ts
git commit -m "feat(db): guarded RPCs for households, chores, claims, swaps and ledger"
```

---
### Task 9: The `tick` Edge Function — plans, sweeps, streak and Web Push

**Files:**
- Create: `supabase/migrations/20261001000004_server.sql`, `supabase/migrations/20261001000005_cron.sql`
- Create: `supabase/functions/tick/actions.ts`, `supabase/functions/tick/push.ts`, `supabase/functions/tick/index.ts`, `supabase/functions/tick/deno.json`
- Modify: `tsconfig.json` (`include` gains the testable tick files), `.env.example` (cron secret for tests)
- Test: `supabase/functions/tick/actions.test.ts`, `supabase/functions/tick/push.test.ts`, `tests/db/tick.test.ts`

**Interfaces:**
- Consumes: `decideTick`, `pushDecision`, `HouseholdSnapshot`, `TickAction` (Task 6); `generatePlan` (Task 3); `settleDay`, `Streak` (Task 4); `nudge`, `NudgeKind` (Task 5); `localParts`, `weekStartOf`, `addDays`, `dateOfWeekday`, `Weekday` (Task 2).
- Produces service-role-only SQL functions: `srv_snapshots(p_household uuid default null) → jsonb` (array of `HouseholdSnapshot`), `srv_plan_inputs(p_household uuid, p_week date) → jsonb {members, chores, history, existingTotals}`, `srv_insert_plan(p_household uuid, p_week date, p_status plan_status, p_assignments jsonb, p_consume boolean, p_only_if_new boolean) → uuid`, `srv_lock_plan(p_plan uuid)`, `srv_sweep_day(p_household uuid, p_day date)`, `srv_expire_day(p_household uuid, p_day date)`, `srv_set_streak(p_household uuid, p_current int, p_best int, p_day date, p_kept boolean)`, `srv_queue_digest(p_household uuid, p_day date)`, `srv_pending_notifications() → jsonb`, `srv_mark_notification(p_id bigint, p_skipped boolean)`, `srv_delete_subscription(p_endpoint text)`.
- Produces (`actions.ts`): `interface RpcClient { rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }> }`, `planWeek(db, householdId, weekStart, status, opts)`, `runActions(db, snapshot, actions)`, `planNewChore(db, snapshot, choreId, now)`.
- Produces (`push.ts`): `interface PushSub { endpoint: string; keys: { p256dh: string; auth: string } }`, `type SendPush = (sub: PushSub, message: string) => Promise<{ gone: boolean }>`, `drainNotifications(db, send, now?)`. Push message JSON = `{ title, body, url, tag }` (consumed by the service worker in Task 17).
- HTTP contract (consumed by the app in Task 10): `POST /functions/v1/tick` with the user's JWT and body `{}` → plans/sweeps that user's household now; body `{ choreId }` → also plans a just-added chore. Cron calls with header `x-cron-secret`. Response `{ ok: true }`.

- [ ] **Step 1: Write the failing unit tests `supabase/functions/tick/actions.test.ts`**

```ts
import { describe, expect, test, vi } from 'vitest';
import { planNewChore, runActions, type RpcClient } from './actions.ts';
import type { HouseholdSnapshot } from '../_shared/domain/tick.ts';

function fakeDb(responses: Record<string, unknown> = {}) {
  const calls: { fn: string; args?: Record<string, unknown> }[] = [];
  const db: RpcClient = {
    rpc: vi.fn(async (fn: string, args?: Record<string, unknown>) => {
      calls.push({ fn, args });
      return { data: responses[fn] ?? null, error: null };
    }),
  };
  return { db, calls };
}

const inputs = {
  members: [{ userId: 'a', busyDays: [], balance: 0 }, { userId: 'b', busyDays: [], balance: 0 }],
  chores: [{ id: 'c1', effort: 1, cadence: 'weekly', createdWeek: '2026-09-28' }, { id: 'c2', effort: 3, cadence: 'weekly', createdWeek: '2026-09-28' }],
  history: [],
  existingTotals: { a: 4, b: 0 },
};
const snap = (over: Partial<HouseholdSnapshot> = {}): HouseholdSnapshot => ({
  id: 'h1', tz: 'Asia/Kathmandu', planMode: 'review', dayEndsAt: '22:00:00', activeMembers: 2,
  plans: [{ id: 'cur', weekStart: '2026-09-28', status: 'locked', approvals: 0, lockAt: '2026-09-27T12:15:00Z' }],
  days: [], streak: { current: 1, best: 1, lastSettledDay: null }, digestSentFor: null, ...over,
});

describe('runActions', () => {
  test('generate plans the whole week with dates, consuming debt, only if new', async () => {
    const { db, calls } = fakeDb({ srv_plan_inputs: inputs });
    await runActions(db, snap(), [{ kind: 'generate', weekStart: '2026-10-05', status: 'draft', fromDay: 0 }]);
    const insert = calls.find((c) => c.fn === 'srv_insert_plan')!;
    expect(insert.args).toMatchObject({ p_household: 'h1', p_week: '2026-10-05', p_status: 'draft', p_consume: true, p_only_if_new: true });
    const rows = insert.args!.p_assignments as { day: string; userId: string }[];
    expect(rows).toHaveLength(2);
    for (const r of rows) expect(r.day >= '2026-10-05' && r.day <= '2026-10-11').toBe(true);
  });

  test('settle applies streak days in order', async () => {
    const { db, calls } = fakeDb();
    await runActions(db, snap(), [
      { kind: 'settle', date: '2026-09-29', outcome: 'kept' },
      { kind: 'settle', date: '2026-09-30', outcome: 'kept' },
    ]);
    const sets = calls.filter((c) => c.fn === 'srv_set_streak').map((c) => c.args);
    expect(sets).toEqual([
      { p_household: 'h1', p_current: 2, p_best: 2, p_day: '2026-09-29', p_kept: true },
      { p_household: 'h1', p_current: 3, p_best: 3, p_day: '2026-09-30', p_kept: true },
    ]);
  });

  test('simple actions map to their srv_ functions', async () => {
    const { db, calls } = fakeDb();
    await runActions(db, snap(), [
      { kind: 'lock', planId: 'p9' }, { kind: 'sweep', date: '2026-10-01' }, { kind: 'expire', date: '2026-09-30' }, { kind: 'digest', date: '2026-10-01' },
    ]);
    expect(calls.map((c) => c.fn)).toEqual(['srv_lock_plan', 'srv_sweep_day', 'srv_expire_day', 'srv_queue_digest']);
  });
});

describe('planNewChore', () => {
  const THU = new Date('2026-10-01T09:15:00Z'); // 15:00 Thursday in Kathmandu

  test('adds only that chore to the rest of this week, counting existing totals', async () => {
    const { db, calls } = fakeDb({ srv_plan_inputs: inputs });
    await planNewChore(db, snap(), 'c1', THU);
    const insert = calls.find((c) => c.fn === 'srv_insert_plan')!;
    expect(insert.args).toMatchObject({ p_week: '2026-09-28', p_status: 'locked', p_consume: false, p_only_if_new: false });
    const rows = insert.args!.p_assignments as { choreId: string; userId: string; day: string }[];
    expect(rows).toEqual([expect.objectContaining({ choreId: 'c1', userId: 'b' })]);
    expect(rows[0].day >= '2026-10-01').toBe(true);
  });

  test("also adds it to next week's draft when one exists", async () => {
    const { db, calls } = fakeDb({ srv_plan_inputs: inputs });
    const s = snap({ plans: [...snap().plans, { id: 'n', weekStart: '2026-10-05', status: 'draft', approvals: 0, lockAt: '2026-10-04T12:15:00Z' }] });
    await planNewChore(db, s, 'c1', THU);
    expect(calls.filter((c) => c.fn === 'srv_insert_plan').map((c) => c.args!.p_week)).toEqual(['2026-09-28', '2026-10-05']);
  });

  test('falls back to a full plan when this week has none yet', async () => {
    const { db, calls } = fakeDb({ srv_plan_inputs: inputs });
    await planNewChore(db, snap({ plans: [] }), 'c1', THU);
    const insert = calls.find((c) => c.fn === 'srv_insert_plan')!;
    expect(insert.args).toMatchObject({ p_only_if_new: true, p_consume: true });
    expect((insert.args!.p_assignments as unknown[]).length).toBe(2);
  });
});
```

- [ ] **Step 2: Write the failing unit tests `supabase/functions/tick/push.test.ts`**

```ts
import { expect, test, vi } from 'vitest';
import { drainNotifications, type PushSub } from './push.ts';
import type { RpcClient } from './actions.ts';

const sub = (n: number): PushSub => ({ endpoint: `https://push/${n}`, keys: { p256dh: 'k', auth: 'a' } });
const note = (id: number, over: Record<string, unknown> = {}) => ({
  id, userId: 'u1', kind: 'pool', payload: { chore: 'Bathroom' }, style: 'motivate', tz: 'Asia/Kathmandu', sentToday: 0, subscriptions: [sub(1)], ...over,
});
function db(pending: unknown[]) {
  const calls: { fn: string; args?: Record<string, unknown> }[] = [];
  const client: RpcClient = {
    rpc: vi.fn(async (fn: string, args?: Record<string, unknown>) => {
      calls.push({ fn, args });
      return { data: fn === 'srv_pending_notifications' ? pending : null, error: null };
    }),
  };
  return { client, calls };
}
const NOON = new Date('2026-10-01T06:15:00Z'); // 12:00 Kathmandu
const LATE = new Date('2026-10-01T17:15:00Z'); // 23:00 Kathmandu

test('sends in the user’s tone with a deep link, then marks sent', async () => {
  const { client, calls } = db([note(1)]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(JSON.parse(send.mock.calls[0][1])).toEqual({ title: 'Up for grabs 🙌', body: 'Up for grabs: Bathroom. Be a hero?', url: '/chores', tag: 'pool-1' });
  expect(calls.at(-1)).toEqual({ fn: 'srv_mark_notification', args: { p_id: 1, p_skipped: false } });
});

test('quiet hours leave the notification queued', async () => {
  const { client, calls } = db([note(1)]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, LATE);
  expect(send).not.toHaveBeenCalled();
  expect(calls.some((c) => c.fn === 'srv_mark_notification')).toBe(false);
});

test('the daily cap counts pushes sent within the same batch', async () => {
  const { client, calls } = db([note(1, { sentToday: 2 }), note(2, { sentToday: 2 }), note(3, { sentToday: 2, kind: 'covered', payload: { actor: 'A', chore: 'X', effort: 1 } })]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send).toHaveBeenCalledTimes(2); // #1 and the 'covered' one
  expect(calls).toContainEqual({ fn: 'srv_mark_notification', args: { p_id: 2, p_skipped: true } });
});

test('expired subscriptions are deleted', async () => {
  const { client, calls } = db([note(1, { subscriptions: [sub(1), sub(2)] })]);
  const send = vi.fn(async (s: PushSub) => ({ gone: s.endpoint.endsWith('/2') }));
  await drainNotifications(client, send, NOON);
  expect(calls).toContainEqual({ fn: 'srv_delete_subscription', args: { p_endpoint: 'https://push/2' } });
});
```

- [ ] **Step 3: Run to verify both fail**

Add to `tsconfig.json` `include`: `"supabase/functions/tick/actions.ts", "supabase/functions/tick/push.ts", "supabase/functions/tick/*.test.ts"`.

Run: `npx vitest run supabase/functions/tick`
Expected: FAIL — `./actions.ts` and `./push.ts` not found.

- [ ] **Step 4: Implement `supabase/functions/tick/actions.ts`**

```ts
import type { HouseholdSnapshot, TickAction } from '../_shared/domain/tick.ts';
import { generatePlan } from '../_shared/domain/rotation.ts';
import { settleDay, type Streak } from '../_shared/domain/streak.ts';
import { addDays, dateOfWeekday, localParts, type Weekday, weekStartOf } from '../_shared/domain/time.ts';
import type { ChoreInput, HistoryItem, MemberInput } from '../_shared/domain/types.ts';

/** The slice of supabase-js the tick needs — keeps this file testable without Deno. */
export interface RpcClient {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export async function call<T = unknown>(db: RpcClient, fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

interface PlanInputs { members: MemberInput[]; chores: ChoreInput[]; history: HistoryItem[]; existingTotals: Record<string, number> }

export async function planWeek(
  db: RpcClient, householdId: string, weekStart: string, status: 'draft' | 'locked',
  opts: { fromDay: Weekday; choreIds?: string[]; onlyIfNew: boolean; consume: boolean },
) {
  const inputs = await call<PlanInputs>(db, 'srv_plan_inputs', { p_household: householdId, p_week: weekStart });
  const chores = opts.choreIds ? inputs.chores.filter((c) => opts.choreIds!.includes(c.id)) : inputs.chores;
  const result = generatePlan({
    householdId, weekStart, members: inputs.members, chores, history: inputs.history, fromDay: opts.fromDay,
    existingTotals: opts.choreIds ? inputs.existingTotals : undefined,
  });
  await call(db, 'srv_insert_plan', {
    p_household: householdId, p_week: weekStart, p_status: status,
    p_assignments: result.assignments.map((a) => ({
      choreId: a.choreId, userId: a.userId, day: dateOfWeekday(weekStart, a.day), effort: a.effort, reason: a.reason,
    })),
    p_consume: opts.consume, p_only_if_new: opts.onlyIfNew,
  });
  return result;
}

export async function runActions(db: RpcClient, s: HouseholdSnapshot, actions: TickAction[]) {
  let streak: Streak = s.streak;
  for (const a of actions) {
    switch (a.kind) {
      case 'generate':
        await planWeek(db, s.id, a.weekStart, a.status, { fromDay: a.fromDay, onlyIfNew: true, consume: true });
        break;
      case 'lock':
        await call(db, 'srv_lock_plan', { p_plan: a.planId });
        break;
      case 'sweep':
        await call(db, 'srv_sweep_day', { p_household: s.id, p_day: a.date });
        break;
      case 'expire':
        await call(db, 'srv_expire_day', { p_household: s.id, p_day: a.date });
        break;
      case 'settle':
        streak = settleDay(streak, a.date, a.outcome);
        await call(db, 'srv_set_streak', {
          p_household: s.id, p_current: streak.current, p_best: streak.best, p_day: a.date, p_kept: a.outcome === 'kept',
        });
        break;
      case 'digest':
        await call(db, 'srv_queue_digest', { p_household: s.id, p_day: a.date });
        break;
    }
  }
}

/** A chore added mid-week joins the rest of this week (and next week's plan, if it already exists). */
export async function planNewChore(db: RpcClient, s: HouseholdSnapshot, choreId: string, now: Date) {
  const local = localParts(now, s.tz);
  const thisWeek = weekStartOf(local.date);
  if (!s.plans.some((p) => p.weekStart === thisWeek)) {
    await planWeek(db, s.id, thisWeek, 'locked', { fromDay: local.weekday, onlyIfNew: true, consume: true });
    return;
  }
  await planWeek(db, s.id, thisWeek, 'locked', { fromDay: local.weekday, choreIds: [choreId], onlyIfNew: false, consume: false });
  const next = s.plans.find((p) => p.weekStart === addDays(thisWeek, 7));
  if (next) await planWeek(db, s.id, next.weekStart, next.status, { fromDay: 0, choreIds: [choreId], onlyIfNew: false, consume: false });
}
```

- [ ] **Step 5: Implement `supabase/functions/tick/push.ts`**

```ts
import { nudge, type NudgeKind, type NudgePayload } from '../_shared/domain/copy.ts';
import { localParts } from '../_shared/domain/time.ts';
import { pushDecision } from '../_shared/domain/tick.ts';
import type { NudgeStyle } from '../_shared/domain/types.ts';
import { call, type RpcClient } from './actions.ts';

export interface PushSub { endpoint: string; keys: { p256dh: string; auth: string } }
export type SendPush = (sub: PushSub, message: string) => Promise<{ gone: boolean }>;

interface PendingNotification {
  id: number; userId: string; kind: NudgeKind; payload: NudgePayload; style: NudgeStyle; tz: string;
  sentToday: number; subscriptions: PushSub[];
}

const DEEP_LINK: Record<NudgeKind, string> = {
  digest: '/chores', pool: '/chores', plan_ready: '/plan', plan_locked: '/plan', covered: '/profile',
  day_kept: '/', swap_request: '/plan', swap_answer: '/plan', joined: '/',
};

export async function drainNotifications(db: RpcClient, send: SendPush, now = new Date()) {
  const pending = await call<PendingNotification[]>(db, 'srv_pending_notifications');
  const sent = new Map<string, number>();
  for (const n of pending ?? []) {
    const sentToday = sent.get(n.userId) ?? n.sentToday;
    const decision = pushDecision(localParts(now, n.tz).hour, sentToday, n.kind);
    if (decision === 'defer') continue;
    if (decision === 'skip') {
      await call(db, 'srv_mark_notification', { p_id: n.id, p_skipped: true });
      continue;
    }
    const { title, body } = nudge(n.kind, n.style, n.payload);
    const message = JSON.stringify({ title, body, url: DEEP_LINK[n.kind] ?? '/', tag: `${n.kind}-${n.id}` });
    for (const sub of n.subscriptions) {
      const { gone } = await send(sub, message);
      if (gone) await call(db, 'srv_delete_subscription', { p_endpoint: sub.endpoint });
    }
    await call(db, 'srv_mark_notification', { p_id: n.id, p_skipped: false });
    sent.set(n.userId, sentToday + 1);
  }
}
```

- [ ] **Step 6: Run the unit tests**

Run: `npx vitest run supabase/functions/tick`
Expected: PASS (10 tests).

- [ ] **Step 7: Implement the Deno entry `supabase/functions/tick/index.ts`** (thin wiring, excluded from tsc/Vitest)

```ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { decideTick, type HouseholdSnapshot } from '../_shared/domain/tick.ts';
import { planNewChore, runActions } from './actions.ts';
import { drainNotifications, type SendPush } from './push.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);

const send: SendPush = async (sub, message) => {
  try {
    await webpush.sendNotification(sub, message, { TTL: 60 * 60 * 12 });
    return { gone: false };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return { gone: true };
    console.error('push failed', status);
    return { gone: false };
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const isCron = req.headers.get('x-cron-secret') === Deno.env.get('CRON_SECRET');
  const body = (await req.json().catch(() => ({}))) as { choreId?: string };

  let only: string | null = null;
  if (!isCron) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ error: 'not_authenticated' }, 401);
    const { data: m } = await db.from('members').select('household_id').eq('user_id', user.id).is('left_at', null).maybeSingle();
    if (!m) return json({ error: 'not_member' }, 403);
    only = m.household_id;
  }

  const { data: snaps, error } = await db.rpc('srv_snapshots', { p_household: only });
  if (error) return json({ error: error.message }, 500);
  const now = new Date();
  for (const s of (snaps ?? []) as HouseholdSnapshot[]) {
    try {
      if (body.choreId) await planNewChore(db, s, body.choreId, now);
      await runActions(db, s, decideTick(s, now));
    } catch (e) {
      console.error('household failed', s.id, e); // next tick retries; one household never blocks the rest
    }
  }
  if (isCron) await drainNotifications(db, send, now);
  return json({ ok: true });
});
```

`supabase/functions/tick/deno.json`:

```json
{ "imports": {} }
```

- [ ] **Step 8: Write `supabase/migrations/20261001000004_server.sql`**

```sql
-- Service-role-only functions used by the tick Edge Function.
create function srv_snapshots(p_household uuid default null) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(snap), '[]'::jsonb) from (
    select jsonb_build_object(
      'id', h.id,
      'tz', h.tz,
      'planMode', h.plan_mode,
      'dayEndsAt', h.day_ends_at::text,
      'activeMembers', (select count(*) from members m where m.household_id = h.id and m.left_at is null),
      'plans', (select coalesce(jsonb_agg(jsonb_build_object(
          'id', p.id, 'weekStart', p.week_start, 'status', p.status, 'lockAt', p.lock_at,
          'approvals', (select count(*) from plan_approvals pa
                        join members m on m.user_id = pa.user_id and m.household_id = h.id and m.left_at is null
                        where pa.plan_id = p.id))), '[]'::jsonb)
        from plans p where p.household_id = h.id and p.week_start >= date_trunc('week', now() at time zone h.tz)::date),
      'days', (select coalesce(jsonb_agg(jsonb_build_object('date', d.day, 'statuses', d.statuses) order by d.day), '[]'::jsonb)
        from (select gs::date as day,
                     coalesce((select jsonb_agg(a.status) from assignments a where a.household_id = h.id and a.day = gs::date), '[]'::jsonb) as statuses
              from generate_series((now() at time zone h.tz)::date - 3, (now() at time zone h.tz)::date, interval '1 day') gs) d),
      'streak', (select jsonb_build_object('current', s.current, 'best', s.best, 'lastSettledDay', s.last_settled_day)
                 from streaks s where s.household_id = h.id),
      'digestSentFor', h.digest_sent_for
    ) as snap
    from households h
    where (p_household is null or h.id = p_household)
      and exists (select 1 from members m where m.household_id = h.id and m.left_at is null)
  ) x
$$;

create function srv_plan_inputs(p_household uuid, p_week date) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'members', (select coalesce(jsonb_agg(jsonb_build_object(
        'userId', m.user_id, 'busyDays', m.busy_days, 'balance', coalesce(l.balance, 0), 'coveredBy', l.last_covered_by)
        order by m.joined_at), '[]'::jsonb)
      from members m left join effort_ledger l on l.household_id = m.household_id and l.user_id = m.user_id
      where m.household_id = p_household and m.left_at is null),
    'chores', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id, 'effort', c.effort, 'cadence', c.cadence, 'createdWeek', c.created_week) order by c.created_at), '[]'::jsonb)
      from chores c where c.household_id = p_household and c.active),
    'history', (select coalesce(jsonb_agg(jsonb_build_object(
        'choreId', a.chore_id, 'userId', coalesce(a.claimed_by, a.user_id), 'weekStart', p.week_start)), '[]'::jsonb)
      from assignments a join plans p on p.id = a.plan_id
      where a.household_id = p_household and p.week_start between p_week - 28 and p_week - 7),
    'existingTotals', (select coalesce(jsonb_object_agg(t.user_id, t.pts), '{}'::jsonb) from (
        select a.user_id, sum(a.effort) as pts from assignments a join plans p on p.id = a.plan_id
        where p.household_id = p_household and p.week_start = p_week and a.status <> 'expired'
        group by a.user_id) t)
  )
$$;

create function srv_insert_plan(p_household uuid, p_week date, p_status plan_status, p_assignments jsonb,
                                p_consume boolean, p_only_if_new boolean) returns uuid
language plpgsql security definer set search_path = public, private as $$
declare
  pid uuid;
  zone text;
  existed boolean;
begin
  select tz into zone from households where id = p_household;
  select id into pid from plans where household_id = p_household and week_start = p_week for update;
  existed := pid is not null;
  if existed and p_only_if_new then return pid; end if; -- a concurrent run already planned this week
  if not existed then
    insert into plans (household_id, week_start, status, lock_at)
    values (p_household, p_week, p_status, ((p_week - 1) + time '18:00') at time zone zone)
    returning id into pid;
  end if;
  insert into assignments (plan_id, household_id, chore_id, user_id, day, effort, reason)
  select pid, p_household, (x->>'choreId')::uuid, (x->>'userId')::uuid, (x->>'day')::date, (x->>'effort')::smallint, x->'reason'
  from jsonb_array_elements(p_assignments) x;
  if p_consume then
    update effort_ledger set balance = balance - greatest(-3, least(3, balance)), updated_at = now()
    where household_id = p_household;
  end if;
  if not existed and p_week > (now() at time zone zone)::date then
    perform private.notify_household(p_household, case when p_status = 'draft' then 'plan_ready' else 'plan_locked' end, '{}'::jsonb);
    perform private.log(p_household, case when p_status = 'draft' then 'plan_ready' else 'plan_locked' end, null);
  end if;
  return pid;
end $$;

create function srv_lock_plan(p_plan uuid) returns void
language plpgsql security definer set search_path = public, private as $$
declare h uuid;
begin
  update plans set status = 'locked' where id = p_plan and status = 'draft' returning household_id into h;
  if h is not null then
    perform private.notify_household(h, 'plan_locked', '{}'::jsonb);
    perform private.log(h, 'plan_locked', null);
  end if;
end $$;

create function srv_sweep_day(p_household uuid, p_day date) returns void
language plpgsql security definer set search_path = public, private as $$
declare r record;
begin
  for r in
    update assignments set status = 'missed'
    where household_id = p_household and day = p_day and status = 'todo'
    returning user_id, chore_id
  loop
    perform private.notify_household(p_household, 'pool',
      jsonb_build_object('chore', (select name from chores where id = r.chore_id)), r.user_id);
  end loop;
  if found then perform private.log(p_household, 'pool', null, jsonb_build_object('day', p_day)); end if;
end $$;

create function srv_expire_day(p_household uuid, p_day date) returns void
language plpgsql security definer set search_path = public as $$
begin
  with gone as (
    update assignments set status = 'expired'
    where household_id = p_household and day = p_day and status in ('todo', 'missed', 'claimed')
    returning user_id, effort
  ), owed as (select user_id, sum(effort) as pts from gone group by user_id)
  update effort_ledger l set balance = l.balance + owed.pts, updated_at = now()
  from owed where l.household_id = p_household and l.user_id = owed.user_id;
end $$;

create function srv_set_streak(p_household uuid, p_current int, p_best int, p_day date, p_kept boolean) returns void
language plpgsql security definer set search_path = public, private as $$
begin
  update streaks set current = p_current, best = p_best, last_settled_day = p_day where household_id = p_household;
  if p_kept and p_current > 1 then
    perform private.notify_household(p_household, 'day_kept', jsonb_build_object('streak', p_current));
    perform private.log(p_household, 'day_kept', null, jsonb_build_object('streak', p_current));
  end if;
end $$;

create function srv_queue_digest(p_household uuid, p_day date) returns void
language plpgsql security definer set search_path = public, private as $$
declare r record;
begin
  for r in
    select a.user_id, jsonb_agg(c.name order by a.effort desc) as chores
    from assignments a join chores c on c.id = a.chore_id
    join members m on m.household_id = a.household_id and m.user_id = a.user_id and m.left_at is null
    where a.household_id = p_household and a.day = p_day and a.status = 'todo'
    group by a.user_id
  loop
    perform private.notify(r.user_id, p_household, 'digest', jsonb_build_object('chores', r.chores));
  end loop;
  update households set digest_sent_for = p_day where id = p_household;
end $$;

create function srv_pending_notifications() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id, 'userId', n.user_id, 'kind', n.kind, 'payload', n.payload, 'style', p.nudge_style,
    'tz', coalesce(h.tz, 'Asia/Kathmandu'),
    'sentToday', (select count(*) from notifications n2
                  where n2.user_id = n.user_id and not n2.skipped
                    and n2.sent_at >= (date_trunc('day', now() at time zone coalesce(h.tz, 'Asia/Kathmandu')) at time zone coalesce(h.tz, 'Asia/Kathmandu'))),
    'subscriptions', (select coalesce(jsonb_agg(jsonb_build_object(
        'endpoint', s.endpoint, 'keys', jsonb_build_object('p256dh', s.p256dh, 'auth', s.auth))), '[]'::jsonb)
      from push_subscriptions s where s.user_id = n.user_id)
  ) order by n.id), '[]'::jsonb)
  from notifications n
  join profiles p on p.id = n.user_id
  left join households h on h.id = n.household_id
  where n.sent_at is null and not n.skipped and n.created_at > now() - interval '2 days'
$$;

create function srv_mark_notification(p_id bigint, p_skipped boolean) returns void
language sql security definer set search_path = public as $$
  update notifications set sent_at = now(), skipped = p_skipped where id = p_id
$$;

create function srv_delete_subscription(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from push_subscriptions where endpoint = p_endpoint
$$;

do $$
declare f text;
begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'srv\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
```

- [ ] **Step 9: Write `supabase/migrations/20261001000005_cron.sql`**

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Every 10 minutes: plans, locks, sweeps, expiries, streak, digest, push.
-- Reads the function URL and shared secret from Vault (created once by hand, never committed).
select cron.schedule('roomie-tick', '*/10 * * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'tick_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000)
$$);
```

- [ ] **Step 10: Configure secrets and deploy**

Generate VAPID keys and a cron secret:

Run: `npx web-push generate-vapid-keys --json` and `node -e "console.log(crypto.randomUUID())"`
Expected: a JSON object with `publicKey` / `privateKey`, and a UUID.

Add to `.env.local`: `VITE_VAPID_PUBLIC_KEY=<publicKey>` and `SUPABASE_TEST_CRON_SECRET=<uuid>`; add `SUPABASE_TEST_CRON_SECRET=` to `.env.example`.

Run:
```bash
npx supabase secrets set VAPID_PUBLIC_KEY=<publicKey> VAPID_PRIVATE_KEY=<privateKey> VAPID_SUBJECT=mailto:pema.ghising133@gmail.com CRON_SECRET=<uuid>
npx supabase db push --password "$SUPABASE_DB_PASSWORD"
npx supabase functions deploy tick --no-verify-jwt --use-api
```
Expected: secrets set, two migrations applied, `Deployed Functions on project <ref>: tick`.

In the Supabase dashboard → SQL editor, run once (values not committed):
```sql
select vault.create_secret('https://<ref>.supabase.co/functions/v1/tick', 'tick_url');
select vault.create_secret('<uuid>', 'cron_secret');
```

- [ ] **Step 11: Write the integration test `tests/db/tick.test.ts`**

```ts
// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { admin, hasDb, makeUser } from './helpers';

const secret = process.env.SUPABASE_TEST_CRON_SECRET;

describe.skipIf(!hasDb || !secret)('tick edge function', () => {
  test('a new household gets this week planned and a user call can trigger it', async () => {
    const owner = await makeUser('Aarav');
    const { data: h } = await owner.client.rpc('create_household', {
      p_name: 'Tick flat', p_busy: [],
      p_chores: [{ name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily' }, { name: 'Bathroom', icon: '🪣', effort: 3, cadence: 'weekly' }],
    });
    const res = await owner.client.functions.invoke('tick', { body: {} });
    expect(res.error).toBeNull();
    const { data: plans } = await admin().from('plans').select('id, status').eq('household_id', h);
    expect(plans).toHaveLength(1);
    expect(plans![0].status).toBe('locked');
    const { data: rows } = await admin().from('assignments').select('id').eq('household_id', h);
    expect(rows!.length).toBeGreaterThan(0);
  });

  test('cron calls are accepted with the shared secret and rejected without it', async () => {
    const url = `${process.env.SUPABASE_TEST_URL}/functions/v1/tick`;
    const ok = await fetch(url, { method: 'POST', headers: { 'x-cron-secret': secret! }, body: '{}' });
    expect(ok.status).toBe(200);
    const denied = await fetch(url, { method: 'POST', body: '{}' });
    expect(denied.status).toBe(401);
  });
});
```

- [ ] **Step 12: Run all tests**

Run: `npm test`
Expected: every suite passes, including `tests/db/tick.test.ts` (2).

- [ ] **Step 13: Commit**

```bash
git add supabase tests/db/tick.test.ts tsconfig.json .env.example
git commit -m "feat(server): tick edge function for plans, sweeps, streak and web push"
```

---
### Task 10: App foundation — data layer, routing guards, design-system components

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/types.ts`, `src/lib/queryClient.ts`, `src/lib/state.ts`, `src/lib/selectors.ts`, `src/lib/gate.ts`, `src/lib/code.ts`
- Create: `src/features/auth/AuthProvider.tsx`
- Create: `src/ui/Button.tsx`, `src/ui/EffortChip.tsx`, `src/ui/Sheet.tsx`, `src/ui/Toast.tsx`, `src/ui/TabBar.tsx`, `src/ui/Avatar.tsx`, `src/ui/Skeleton.tsx`, `src/ui/EmptyState.tsx`, `src/ui/Sprout.tsx`, `src/ui/Progress.tsx`, `src/ui/OtpInput.tsx`, `src/ui/TaskRow.tsx`, `src/ui/Splash.tsx`, `src/ui/ui.css`
- Create (placeholders, replaced by Tasks 11–17): `src/features/auth/{Welcome,ContactEntry,VerifyCode}.tsx`, `src/features/onboarding/{ProfileStep,StartStep,JoinStep,HomeNameStep,ChoresStep,BusyStep,InviteStep}.tsx`, `src/features/home/Home.tsx`, `src/features/chores/Chores.tsx`, `src/features/plan/PlanReview.tsx`, `src/features/profile/{Profile,HouseholdSettings}.tsx`, `src/features/activity/Activity.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`; Delete: `src/App.test.tsx`
- Test: `src/lib/code.test.ts`, `src/lib/selectors.test.ts`, `src/lib/gate.test.ts`, `src/ui/OtpInput.test.tsx`, `src/ui/TaskRow.test.tsx`

**Interfaces:**
- Consumes: `get_state()` shape (Task 7); RPC names (Task 8); `POST tick` (Task 9); `effortLabel`, `errorText`, `ERROR_CODES` (Task 5); `addDays`, `weekStartOf` (Task 2); domain types (Task 3).
- Produces (later tasks import these exact names):
  - `supabase` client (`src/lib/supabase.ts`)
  - Types `AppState`, `Profile`, `Household`, `Member`, `Chore`, `Plan`, `Assignment`, `SwapRequest`, `ActivityItem` (`src/lib/types.ts`)
  - `STATE_KEY`, `useAppState()`, `useRealtime(householdId?)`, `rpc<T>(fn, args?)`, `RpcError`, `useAction<A>(fn, { optimistic?, onSuccess? })`, `planNow(choreId?)`, `useMe(): { me: string; state: AppState }` (`src/lib/state.ts`)
  - Selectors: `namesOf`, `choreMap`, `myTasksOn`, `pool`, `planForWeek`, `weekDates`, `weekTotals`, `roommates`, `nextUp`, `pendingDraft`, `incomingSwaps`, `outgoingSwaps`, `unreadCount` (`src/lib/selectors.ts`)
  - `type Gate`, `gateFor()`, `HOME_OF` (`src/lib/gate.ts`); `normalizeCode()` (`src/lib/code.ts`)
  - `AuthProvider`, `useAuth()`, `signOut()` (`src/features/auth/AuthProvider.tsx`)
  - UI: `Button`, `EffortChip`, `Sheet`, `ToastProvider`/`useToast`, `TabBar`, `Avatar`, `Skeleton`, `EmptyState`, `Sprout`, `Progress`, `OtpInput`, `TaskRow`, `Splash`

- [ ] **Step 1: Write the failing tests**

`src/lib/code.test.ts`:

```ts
import { expect, test } from 'vitest';
import { normalizeCode } from './code';

test.each([
  ['abc123', 'ABC123'],
  ['abc 123', 'ABC123'],
  ['ABC-123', 'ABC123'],
  ['https://roomie.example/j/ABC123', 'ABC123'],
  ['  a b c', 'ABC'],
])('%s → %s', (input, out) => expect(normalizeCode(input)).toBe(out));
```

`src/lib/gate.test.ts`:

```ts
import { expect, test } from 'vitest';
import { gateFor } from './gate';
import type { AppState } from './types';

const session = { user: { id: 'u' } } as never;
const st = (over: Partial<AppState>): AppState => ({
  profile: { id: 'u', name: 'Aarav', color: '#ffedd5', nudge_style: 'motivate', activity_seen_at: '' },
  household: { id: 'h', name: 'Flat', invite_code: 'ABC123', plan_mode: 'review', tz: 'Asia/Kathmandu', day_ends_at: '22:00:00' },
  members: [], chores: [], plans: [], assignments: [], swaps: [], streak: null, balance: 0, activity: [], today: '2026-10-01',
  ...over,
});

test('gates', () => {
  expect(gateFor({ session: null, loading: true }, { isLoading: false })).toBe('loading');
  expect(gateFor({ session: null, loading: false }, { isLoading: false })).toBe('signed_out');
  expect(gateFor({ session, loading: false }, { isLoading: true })).toBe('loading');
  expect(gateFor({ session, loading: false }, { isLoading: false, error: new Error('x') })).toBe('error');
  expect(gateFor({ session, loading: false }, { isLoading: false, data: st({ profile: { ...st({}).profile, name: '' } }) })).toBe('needs_profile');
  expect(gateFor({ session, loading: false }, { isLoading: false, data: st({ household: null }) })).toBe('needs_household');
  expect(gateFor({ session, loading: false }, { isLoading: false, data: st({}) })).toBe('ready');
});
```

`src/lib/selectors.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { myTasksOn, nextUp, pendingDraft, pool, roommates, unreadCount, weekDates, weekTotals } from './selectors';
import type { AppState, Assignment } from './types';

const a = (over: Partial<Assignment>): Assignment => ({
  id: crypto.randomUUID(), plan_id: 'p1', chore_id: 'c1', user_id: 'me', day: '2026-10-01', effort: 1,
  status: 'todo', claimed_by: null, done_at: null, reason: { code: 'credit' }, ...over,
});
const state = (assignments: Assignment[], over: Partial<AppState> = {}): AppState => ({
  profile: { id: 'me', name: 'Me', color: '#d1fae5', nudge_style: 'motivate', activity_seen_at: '2026-10-01T00:00:00Z' },
  household: { id: 'h', name: 'Flat', invite_code: 'ABC123', plan_mode: 'review', tz: 'Asia/Kathmandu', day_ends_at: '22:00:00' },
  members: [
    { user_id: 'me', name: 'Me', color: '#d1fae5', role: 'owner', busy_days: [] },
    { user_id: 'p', name: 'Priya', color: '#dbeafe', role: 'member', busy_days: [] },
  ],
  chores: [], plans: [{ id: 'p1', week_start: '2026-09-28', status: 'locked', lock_at: '', approved_by: [] }],
  assignments, swaps: [], streak: null, balance: 0, activity: [], today: '2026-10-01', ...over,
});

describe('selectors', () => {
  test('myTasksOn includes my todos and chores I claimed, open ones first', () => {
    const s = state([
      a({ id: 'done', status: 'done', done_at: 'x' }),
      a({ id: 'mine', effort: 2 }),
      a({ id: 'claimed', user_id: 'p', status: 'claimed', claimed_by: 'me' }),
      a({ id: 'theirs', user_id: 'p' }),
      a({ id: 'gone', status: 'expired' }),
    ]);
    expect(myTasksOn(s, 'me', '2026-10-01').map((x) => x.id)).toEqual(['mine', 'claimed', 'done']);
  });
  test("today's list includes chores I claimed from earlier days", () => {
    const s = state([a({ id: 'old', user_id: 'p', day: '2026-09-30', status: 'claimed', claimed_by: 'me' })]);
    expect(myTasksOn(s, 'me', '2026-10-01').map((x) => x.id)).toEqual(['old']);
    expect(myTasksOn(s, 'me', '2026-10-02')).toEqual([]);
  });
  test('pool shows other people’s missed chores only', () => {
    const s = state([a({ id: 'm1', user_id: 'p', status: 'missed', day: '2026-09-30' }), a({ id: 'm2', status: 'missed' })]);
    expect(pool(s, 'me').map((x) => x.id)).toEqual(['m1']);
  });
  test('weekTotals sums planned points per person, ignoring expired', () => {
    const s = state([a({ effort: 3 }), a({ effort: 1, user_id: 'p' }), a({ effort: 2, status: 'expired' })]);
    expect(weekTotals(s, '2026-09-28')).toEqual({ me: 3, p: 1 });
  });
  test('roommates counts today’s tasks', () => {
    const s = state([a({ status: 'done' }), a({}), a({ user_id: 'p' })]);
    expect(roommates(s, '2026-10-01').map((r) => [r.user_id, r.today, r.done])).toEqual([['me', 2, 1], ['p', 1, 0]]);
  });
  test('nextUp is my first future todo', () => {
    const s = state([a({ id: 'later', day: '2026-10-03' }), a({ id: 'soon', day: '2026-10-02' })]);
    expect(nextUp(s, 'me', '2026-10-01')?.id).toBe('soon');
  });
  test('pendingDraft finds next week’s draft', () => {
    const s = state([], { plans: [{ id: 'n', week_start: '2026-10-05', status: 'draft', lock_at: '', approved_by: [] }] });
    expect(pendingDraft(s)?.id).toBe('n');
  });
  test('unreadCount ignores my own activity', () => {
    const s = state([], { activity: [
      { id: 1, kind: 'completed', actor: 'p', payload: {}, created_at: '2026-10-01T05:00:00Z' },
      { id: 2, kind: 'completed', actor: 'me', payload: {}, created_at: '2026-10-01T05:00:00Z' },
      { id: 3, kind: 'completed', actor: 'p', payload: {}, created_at: '2026-09-30T05:00:00Z' },
    ] });
    expect(unreadCount(s, 'me')).toBe(1);
  });
  test('weekDates', () => {
    expect(weekDates('2026-09-28')).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  });
});
```

`src/ui/OtpInput.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, test, vi } from 'vitest';
import { OtpInput } from './OtpInput';

function Harness({ alnum, onComplete }: { alnum?: boolean; onComplete: (v: string) => void }) {
  const [v, setV] = useState('');
  return <OtpInput label="Code" value={v} onChange={setV} onComplete={onComplete} alphanumeric={alnum} />;
}

test('digits only, completes at 6', async () => {
  const done = vi.fn();
  render(<Harness onComplete={done} />);
  await userEvent.type(screen.getByLabelText('Code'), '12a3456');
  expect(done).toHaveBeenCalledWith('123456');
});

test('alphanumeric accepts a pasted invite link', async () => {
  const done = vi.fn();
  render(<Harness alnum onComplete={done} />);
  await userEvent.click(screen.getByLabelText('Code'));
  await userEvent.paste('https://roomie.example/j/abc123');
  expect(done).toHaveBeenCalledWith('ABC123');
});
```

`src/ui/TaskRow.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { TaskRow } from './TaskRow';

const chore = { id: 'c', name: 'Bathroom', icon: '🪣', effort: 3 as const, cadence: 'weekly' as const, active: true };
const base = { id: 'a', plan_id: 'p', chore_id: 'c', user_id: 'me', day: '2026-10-01', effort: 3 as const, claimed_by: null, done_at: null, reason: { code: 'credit' as const } };

test('tapping the circle completes the chore', async () => {
  const onComplete = vi.fn();
  render(<TaskRow chore={chore} assignment={{ ...base, status: 'todo' }} onComplete={onComplete} />);
  await userEvent.click(screen.getByRole('button', { name: 'Mark Bathroom done' }));
  expect(onComplete).toHaveBeenCalledOnce();
  expect(screen.getByText('Heavy')).toBeInTheDocument();
});

test('a done chore shows as checked and cannot be completed again', () => {
  render(<TaskRow chore={chore} assignment={{ ...base, status: 'done' }} onComplete={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Bathroom done' })).toHaveAttribute('aria-pressed', 'true');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src`
Expected: FAIL — modules not found.

- [ ] **Step 3: Data layer**

`src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL ?? 'http://localhost', import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'anon', {
  // implicit flow: OAuth and magic-link redirects land as URL tokens the SPA picks up (the e2e test signs in this way)
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
```

`src/lib/types.ts`:

```ts
import type { AssignmentStatus, Cadence, Effort, NudgeStyle, Reason } from '@domain/types.ts';
import type { Weekday } from '@domain/time.ts';

export interface Profile { id: string; name: string; color: string; nudge_style: NudgeStyle; activity_seen_at: string }
export interface Household { id: string; name: string; invite_code: string; plan_mode: 'review' | 'auto'; tz: string; day_ends_at: string }
export interface Member { user_id: string; name: string; color: string; role: 'owner' | 'member'; busy_days: Weekday[] }
export interface Chore { id: string; name: string; icon: string; effort: Effort; cadence: Cadence; active: boolean }
export interface Plan { id: string; week_start: string; status: 'draft' | 'locked'; lock_at: string; approved_by: string[] }
export interface Assignment {
  id: string; plan_id: string; chore_id: string; user_id: string; day: string; effort: Effort;
  status: AssignmentStatus; claimed_by: string | null; done_at: string | null; reason: Reason;
}
export interface SwapRequest { id: string; from_assignment: string; to_assignment: string; from_user: string; to_user: string; status: 'pending' }
export interface ActivityItem { id: number; kind: string; actor: string | null; payload: Record<string, unknown>; created_at: string }

export interface AppState {
  profile: Profile;
  household: Household | null;
  members: Member[];
  chores: Chore[];
  plans: Plan[];
  assignments: Assignment[];
  swaps: SwapRequest[];
  streak: { current: number; best: number; last_settled_day: string | null } | null;
  balance: number;
  activity: ActivityItem[];
  today: string;
}
```

`src/lib/code.ts`:

```ts
/** Same rule as SQL `normalize_code`: keep letters/digits, uppercase, last 6 (so pasted links work). */
export function normalizeCode(input: string): string {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length > 6 ? s.slice(-6) : s;
}
```

`src/lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { del, get, set } from 'idb-keyval';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: 1000 * 60 * 60 * 24, retry: 2, networkMode: 'offlineFirst', refetchOnWindowFocus: true },
    mutations: { networkMode: 'online', retry: 1 }, // paused while offline, resumed when back online
  },
});

export const persister = createAsyncStoragePersister({
  key: 'roomie-cache',
  storage: { getItem: (k) => get(k), setItem: (k, v) => set(k, v), removeItem: (k) => del(k) },
});
```

`src/lib/state.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ERROR_CODES, errorText } from '@domain/copy.ts';
import { supabase } from './supabase';
import type { AppState } from './types';
import { useToast } from '../ui/Toast';
import { useAuth } from '../features/auth/AuthProvider';

export const STATE_KEY = ['app-state'] as const;

const localToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());

export async function fetchState(): Promise<AppState> {
  const { data, error } = await supabase.rpc('get_state');
  if (error) throw error;
  return { members: [], chores: [], plans: [], assignments: [], swaps: [], streak: null, balance: 0, activity: [], today: localToday(), ...data } as AppState;
}

export function useAppState() {
  const { session } = useAuth();
  return useQuery({ queryKey: STATE_KEY, queryFn: fetchState, enabled: Boolean(session), staleTime: 15_000 });
}

/** For screens behind the 'ready' gate: state and household are guaranteed. */
export function useMe(): { me: string; state: AppState } {
  const { data } = useAppState();
  if (!data?.household) throw new Error('useMe used outside a ready household');
  return { me: data.profile.id, state: data };
}

export class RpcError extends Error {
  constructor(public code: string) { super(code); }
}

export const codeOf = (message: string) => (ERROR_CODES as readonly string[]).find((c) => message.includes(c)) ?? 'unknown';

export async function rpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new RpcError(codeOf(error.message));
  return data as T;
}

/** Optimistic RPC: apply the change to the cached state instantly, roll back with a friendly toast on error. */
export function useAction<A extends Record<string, unknown>>(
  fn: string,
  opts: { optimistic?: (s: AppState, args: A) => AppState; onSuccess?: (data: unknown, args: A) => void } = {},
) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (args: A) => rpc(fn, args),
    onMutate: async (args: A) => {
      await qc.cancelQueries({ queryKey: STATE_KEY });
      const prev = qc.getQueryData<AppState>(STATE_KEY);
      if (prev && opts.optimistic) qc.setQueryData(STATE_KEY, opts.optimistic(prev, args));
      return { prev };
    },
    onError: (err, _args, ctx) => {
      if (ctx?.prev) qc.setQueryData(STATE_KEY, ctx.prev);
      toast.show(errorText(err instanceof RpcError ? err.code : 'unknown'));
    },
    onSuccess: opts.onSuccess,
    onSettled: () => qc.invalidateQueries({ queryKey: STATE_KEY }),
  });
}

/** Ask the server to plan/sweep this household now (after creating, joining or adding a chore). */
export async function planNow(choreId?: string) {
  await supabase.functions.invoke('tick', { body: choreId ? { choreId } : {} });
}

const TABLES = ['assignments', 'plans', 'swap_requests', 'members', 'chores', 'streaks', 'activity'] as const;

/** One realtime channel per household; any change refetches the snapshot (debounced). */
export function useRealtime(householdId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!householdId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => qc.invalidateQueries({ queryKey: STATE_KEY }), 150);
    };
    const channel = supabase.channel(`household:${householdId}`);
    for (const table of TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `household_id=eq.${householdId}` }, refresh);
    }
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'households', filter: `id=eq.${householdId}` }, refresh);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'plan_approvals' }, refresh); // RLS scopes rows to this household
    channel.subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(channel); };
  }, [householdId, qc]);
}
```

`src/lib/selectors.ts`:

```ts
import { addDays } from '@domain/time.ts';
import type { AppState, Assignment, Chore, Plan, SwapRequest } from './types';

export const namesOf = (s: AppState): Record<string, string> =>
  Object.fromEntries(s.members.map((m) => [m.user_id, m.name || 'Roommate']));

export const choreMap = (s: AppState): Map<string, Chore> => new Map(s.chores.map((c) => [c.id, c]));

const open = (a: Assignment) => a.status !== 'done';

/**
 * What I'm responsible for on a date: my own chores (unless someone claimed them) and chores I claimed.
 * On today's list, chores I claimed from earlier days (the missed pile) show up too — they're today's work now.
 */
export function myTasksOn(s: AppState, me: string, date: string): Assignment[] {
  return s.assignments
    .filter((a) => a.status !== 'expired' && (
      (a.day === date && (
        (a.user_id === me && a.status !== 'claimed' && !(a.status === 'done' && a.claimed_by)) ||
        (a.claimed_by === me && (a.status === 'claimed' || a.status === 'done')))) ||
      (date === s.today && a.day < date && a.claimed_by === me && a.status === 'claimed')))
    .sort((x, y) => Number(open(y)) - Number(open(x)) || y.effort - x.effort);
}

/** Missed by roommates — claimable by me. */
export const pool = (s: AppState, me: string): Assignment[] =>
  s.assignments.filter((a) => a.status === 'missed' && a.user_id !== me).sort((x, y) => y.effort - x.effort);

export const planForWeek = (s: AppState, weekStart: string): Plan | undefined => s.plans.find((p) => p.week_start === weekStart);

export const weekDates = (weekStart: string): string[] => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

export function weekTotals(s: AppState, weekStart: string): Record<string, number> {
  const plan = planForWeek(s, weekStart);
  const totals: Record<string, number> = {};
  for (const a of s.assignments) {
    if (!plan || a.plan_id !== plan.id || a.status === 'expired') continue;
    totals[a.user_id] = (totals[a.user_id] ?? 0) + a.effort;
  }
  return totals;
}

export function roommates(s: AppState, today: string) {
  return s.members.map((m) => {
    const mine = s.assignments.filter((a) => a.user_id === m.user_id && a.day === today && a.status !== 'expired');
    return { ...m, today: mine.length, done: mine.filter((a) => a.status === 'done').length };
  });
}

export const nextUp = (s: AppState, me: string, today: string): Assignment | undefined =>
  s.assignments.filter((a) => a.user_id === me && a.status === 'todo' && a.day > today).sort((x, y) => x.day.localeCompare(y.day))[0];

export const pendingDraft = (s: AppState): Plan | undefined =>
  s.plans.find((p) => p.status === 'draft' && p.week_start > s.today);

export const incomingSwaps = (s: AppState, me: string): SwapRequest[] => s.swaps.filter((w) => w.to_user === me);
export const outgoingSwaps = (s: AppState, me: string): SwapRequest[] => s.swaps.filter((w) => w.from_user === me);

export const unreadCount = (s: AppState, me: string): number =>
  s.activity.filter((x) => x.created_at > s.profile.activity_seen_at && x.actor !== me).length;
```

`src/lib/gate.ts`:

```ts
import type { Session } from '@supabase/supabase-js';
import type { AppState } from './types';

export type Gate = 'loading' | 'error' | 'signed_out' | 'needs_profile' | 'needs_household' | 'ready';

export const HOME_OF: Record<Exclude<Gate, 'loading' | 'error'>, string> = {
  signed_out: '/welcome',
  needs_profile: '/onboarding/profile',
  needs_household: '/onboarding/start',
  ready: '/',
};

export function gateFor(
  auth: { session: Session | null; loading: boolean },
  state: { data?: AppState; isLoading: boolean; error?: unknown },
): Gate {
  if (auth.loading) return 'loading';
  if (!auth.session) return 'signed_out';
  if (!state.data) return state.error ? 'error' : 'loading';
  if (!state.data.profile?.name) return 'needs_profile';
  if (!state.data.household) return 'needs_household';
  return 'ready';
}
```

`src/features/auth/AuthProvider.tsx`:

```tsx
import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { persister, queryClient } from '../../lib/queryClient';

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export async function signOut() {
  await supabase.auth.signOut();
  queryClient.clear();
  await persister.removeClient();
}
```

- [ ] **Step 4: Design-system components**

`src/ui/Button.tsx`:

```tsx
import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; block?: boolean; loading?: boolean };

export function Button({ variant = 'primary', block, loading, className = '', children, disabled, ...rest }: Props) {
  return (
    <button {...rest} className={`btn btn--${variant}${block ? ' btn--block' : ''} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined}>
      {loading && <span className="spinner" aria-hidden />}
      <span>{children}</span>
    </button>
  );
}
```

`src/ui/EffortChip.tsx`:

```tsx
import { effortLabel } from '@domain/copy.ts';

export function EffortChip({ effort, size = 'sm' }: { effort: number; size?: 'sm' | 'md' }) {
  const label = effortLabel(effort);
  return <span className={`chip chip--${label.toLowerCase()} chip--${size}`}>{label}</span>;
}
```

`src/ui/Sheet.tsx`:

```tsx
import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; previous?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" aria-hidden />
        <h2 className="sheet__title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
```

`src/ui/Toast.tsx`:

```tsx
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

interface ToastAction { label: string; onClick: () => void }
interface ToastItem { id: number; message: string; action?: ToastAction }
type Show = (message: string, opts?: { action?: ToastAction; duration?: number }) => void;

const ToastContext = createContext<{ show: Show }>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id));
  const show = useCallback<Show>((message, opts = {}) => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-2), { id, message, action: opts.action }]);
    setTimeout(() => dismiss(id), opts.duration ?? 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.message}</span>
            {t.action && (
              <button className="toast__action" onClick={() => { t.action!.onClick(); dismiss(t.id); }}>{t.action.label}</button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
```

`src/ui/TabBar.tsx`:

```tsx
import { ClipboardList, Home, User } from 'lucide-react';
import { NavLink } from 'react-router';

const TABS = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/chores', label: 'Chores', Icon: ClipboardList, end: false },
  { to: '/profile', label: 'Profile', Icon: User, end: false },
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `tabbar__item${isActive ? ' is-active' : ''}`}>
          <Icon size={20} aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

`src/ui/Avatar.tsx`:

```tsx
export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <span className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  );
}
```

`src/ui/Skeleton.tsx`:

```tsx
export const Skeleton = ({ height = 64 }: { height?: number }) => <div className="skeleton" style={{ height }} aria-hidden />;
```

`src/ui/Sprout.tsx`:

```tsx
export function Sprout({ size = 56, grow = 1 }: { size?: number; grow?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="sprout" style={{ ['--grow' as string]: grow }}>
      <path d="M32 58V30" stroke="#065F46" strokeWidth="4" strokeLinecap="round" />
      <path className="sprout__leaf sprout__leaf--l" d="M31 34C21 34 14 27 13 18c10 0 17 6 18 16Z" fill="#34D399" />
      <path className="sprout__leaf sprout__leaf--r" d="M33 30c7 0 12-5 13-11-7 0-12 4-13 11Z" fill="#6EE7B7" />
    </svg>
  );
}
```

`src/ui/EmptyState.tsx`:

```tsx
import { Sprout } from './Sprout';

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="empty">
      <Sprout size={48} />
      <p className="empty__title">{title}</p>
      {body && <p className="muted">{body}</p>}
    </div>
  );
}
```

`src/ui/Progress.tsx`:

```tsx
export function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`Step ${step} of ${total}`}>
      <span style={{ width: `${(step / total) * 100}%` }} />
    </div>
  );
}
```

`src/ui/OtpInput.tsx`:

```tsx
import { normalizeCode } from '../lib/code';

interface Props {
  label: string; value: string; onChange: (v: string) => void; onComplete?: (v: string) => void;
  alphanumeric?: boolean; autoFocus?: boolean;
}

export function OtpInput({ label, value, onChange, onComplete, alphanumeric = false, autoFocus = true }: Props) {
  const clean = (v: string) => (alphanumeric ? normalizeCode(v) : v.replace(/\D/g, '').slice(0, 6));
  return (
    <div className="otp">
      <input
        className="otp__input" aria-label={label} value={value} autoFocus={autoFocus}
        inputMode={alphanumeric ? 'text' : 'numeric'} autoComplete={alphanumeric ? 'off' : 'one-time-code'}
        autoCapitalize="characters" spellCheck={false}
        onChange={(e) => {
          const v = clean(e.target.value);
          onChange(v);
          if (v.length === 6) onComplete?.(v);
        }}
      />
      <div className="otp__boxes" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className={`otp__box${i === value.length ? ' is-current' : ''}`}>{value[i] ?? ''}</span>
        ))}
      </div>
    </div>
  );
}
```

`src/ui/TaskRow.tsx`:

```tsx
import { type ReactNode, useRef, useState } from 'react';
import { EffortChip } from './EffortChip';
import type { Assignment, Chore } from '../lib/types';

interface Props { chore: Chore; assignment: Assignment; onComplete?: () => void; onOpen?: () => void; action?: ReactNode; note?: string }

export function TaskRow({ chore, assignment, onComplete, onOpen, action, note }: Props) {
  const done = assignment.status === 'done';
  const canSwipe = Boolean(onComplete) && !done;
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const moved = useRef(false);
  const reset = () => { setDx(0); start.current = null; };

  return (
    <div className={`task${done ? ' is-done' : ''}`}>
      {canSwipe && <div className="task__swipe" aria-hidden style={{ opacity: Math.min(1, dx / 80) }}>Done ✓</div>}
      <div
        className="task__card"
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        onPointerDown={canSwipe ? (e) => { start.current = e.clientX; moved.current = false; } : undefined}
        onPointerMove={canSwipe ? (e) => {
          if (start.current === null) return;
          const d = Math.max(0, Math.min(120, e.clientX - start.current));
          if (d > 6) moved.current = true;
          setDx(d);
        } : undefined}
        onPointerUp={canSwipe ? () => { if (dx > 80) onComplete!(); reset(); } : undefined}
        onPointerCancel={reset}
        onPointerLeave={() => { if (start.current !== null) reset(); }}
      >
        <span className="task__icon" aria-hidden>{chore.icon}</span>
        <button className="task__body" onClick={() => { if (!moved.current) onOpen?.(); }} disabled={!onOpen} aria-label={onOpen ? `${chore.name}: why this is yours` : undefined}>
          <span className="task__name">{chore.name}</span>
          <span className="task__meta"><EffortChip effort={assignment.effort} />{note && <span className="muted">{note}</span>}</span>
        </button>
        {action ?? (onComplete && (
          <button
            className={`check${done ? ' is-checked' : ''}`}
            aria-label={done ? `${chore.name} done` : `Mark ${chore.name} done`}
            aria-pressed={done}
            onClick={done ? undefined : onComplete}
          />
        ))}
      </div>
    </div>
  );
}
```

`src/ui/Splash.tsx`:

```tsx
import { Button } from './Button';
import { Sprout } from './Sprout';

export function Splash({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return (
    <main className="splash">
      <Sprout size={64} />
      {error ? (
        <>
          <p>Can't reach Roomie right now.</p>
          <Button variant="secondary" onClick={onRetry}>Try again</Button>
        </>
      ) : <span className="sr-only">Loading</span>}
    </main>
  );
}
```

`src/ui/ui.css`:

```css
/* buttons */
.btn { min-height: var(--tap); display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0 22px; border: 0; border-radius: var(--radius-pill); font-weight: 600; font-size: 16px; cursor: pointer; transition: transform .15s var(--ease), background .2s; }
.btn:active { transform: scale(.98); }
.btn:disabled { opacity: .55; cursor: not-allowed; }
.btn--primary { background: var(--navy); color: #fff; min-height: 54px; }
.btn--secondary { background: var(--lav); color: var(--lav-ink); }
.btn--ghost { background: transparent; color: var(--ink-2); }
.btn--danger { background: #fee2e2; color: var(--danger); }
.btn--block { width: 100%; }
.spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid currentColor; border-right-color: transparent; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* effort chips */
.chip { display: inline-flex; align-items: center; font: 600 12px/1 var(--font-ui); padding: 5px 9px; border-radius: 8px; }
.chip--md { font-size: 14px; padding: 9px 16px; border-radius: var(--radius-pill); }
.chip--light { background: var(--light-bg); color: var(--light-ink); }
.chip--medium { background: var(--medium-bg); color: var(--medium-ink); }
.chip--heavy { background: var(--heavy-bg); color: var(--heavy-ink); }

/* sheet */
.sheet-backdrop { position: fixed; inset: 0; background: rgba(17, 24, 39, .45); display: flex; align-items: flex-end; justify-content: center; z-index: 50; animation: fade .2s var(--ease); }
.sheet { width: 100%; max-width: 520px; max-height: 88vh; overflow: auto; background: #fff; border-radius: 28px 28px 0 0; padding: 12px 24px calc(var(--safe-bottom) + 24px); box-shadow: var(--shadow-sheet); animation: rise .32s var(--ease); outline: none; }
.sheet__handle { width: 40px; height: 4px; border-radius: 4px; background: var(--line); margin: 0 auto 16px; }
.sheet__title { margin-bottom: 16px; }
@keyframes rise { from { transform: translateY(100%); } }
@keyframes fade { from { opacity: 0; } }

/* toasts */
.toasts { position: fixed; left: 50%; bottom: calc(var(--safe-bottom) + 104px); transform: translateX(-50%); display: grid; gap: 8px; z-index: 60; width: min(92vw, 440px); }
.toast { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--navy); color: #fff; padding: 12px 16px; border-radius: 16px; box-shadow: var(--shadow-card); animation: rise .25s var(--ease); }
.toast__action { background: none; border: 0; color: var(--lav-2); font-weight: 700; min-height: var(--tap); cursor: pointer; }

/* tab bar — the floating dark pill from the hi-fi screens */
.tabbar { position: fixed; left: 50%; bottom: calc(var(--safe-bottom) + 14px); transform: translateX(-50%); display: flex; gap: 4px; background: var(--navy); padding: 6px; border-radius: var(--radius-pill); box-shadow: 0 12px 32px -8px rgba(17, 24, 39, .45); z-index: 40; }
.tabbar__item { min-width: 84px; min-height: 52px; display: grid; place-items: center; align-content: center; gap: 2px; color: #9ca3af; text-decoration: none; font-size: 11px; font-weight: 600; border-radius: var(--radius-pill); transition: background .2s, color .2s; }
.tabbar__item.is-active { background: #fff; color: var(--navy); }

/* avatar, skeleton, empty, progress, splash */
.avatar { display: inline-grid; place-items: center; border-radius: 50%; font-weight: 700; color: var(--ink); flex: none; }
.skeleton { border-radius: var(--radius-m); background: linear-gradient(90deg, #f3f4f6 25%, #eceef1 37%, #f3f4f6 63%); background-size: 400% 100%; animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
.empty { display: grid; justify-items: center; gap: 6px; text-align: center; padding: 28px 12px; }
.empty__title { font: 700 18px/1.2 var(--font-display); }
.progress { height: 6px; background: var(--lav); border-radius: 6px; overflow: hidden; }
.progress span { display: block; height: 100%; background: var(--lav-3); border-radius: 6px; transition: width .4s var(--ease); }
.splash { min-height: 100%; display: grid; place-items: center; align-content: center; gap: 16px; }
.sprout__leaf { transform-origin: 32px 32px; transform: scale(var(--grow, 1)); transition: transform .6s var(--ease); }

/* otp */
.otp { position: relative; }
.otp__input { position: absolute; inset: 0; opacity: 0; font-size: 16px; width: 100%; }
.otp__boxes { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; pointer-events: none; }
.otp__box { height: 58px; display: grid; place-items: center; border-radius: 14px; background: var(--surface); border: 1.5px solid var(--line); font: 700 24px var(--font-ui); }
.otp__box.is-current { border-color: var(--lav-3); box-shadow: 0 0 0 3px var(--lav); }
.otp:focus-within .otp__box.is-current { border-color: var(--lav-ink); }

/* task rows */
.task { position: relative; border-radius: var(--radius-m); }
.task + .task { margin-top: 10px; }
.task__swipe { position: absolute; inset: 0; border-radius: var(--radius-m); background: var(--light-bg); color: var(--light-ink); display: flex; align-items: center; padding-left: 20px; font-weight: 700; }
.task__card { position: relative; display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #fff; border: 1px solid var(--line); border-radius: var(--radius-m); transition: transform .25s var(--ease); touch-action: pan-y; }
.task__icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: var(--sky-bg); font-size: 20px; flex: none; }
.task__body { flex: 1; display: grid; gap: 6px; text-align: left; background: none; border: 0; padding: 4px 0; cursor: pointer; min-height: var(--tap); }
.task__body:disabled { cursor: default; }
.task__name { font-weight: 600; }
.task__meta { display: flex; gap: 8px; align-items: center; font-size: 13px; }
.task.is-done .task__name { color: var(--muted); text-decoration: line-through; }
.check { width: 30px; height: 30px; margin: 7px; border-radius: 50%; border: 2px solid #d1d5db; background: #fff; cursor: pointer; flex: none; transition: background .2s, border-color .2s; position: relative; }
.check::after { content: ''; position: absolute; inset: 0; margin: auto; width: 8px; height: 14px; border: solid #fff; border-width: 0 3px 3px 0; transform: rotate(45deg) translate(-1px, -2px) scale(0); transition: transform .25s var(--ease); }
.check.is-checked { background: var(--navy); border-color: var(--navy); }
.check.is-checked::after { transform: rotate(45deg) translate(-1px, -2px) scale(1); }
```

- [ ] **Step 5: Routing, guards and placeholder screens**

Create each placeholder with this exact pattern (later tasks replace the file wholesale), e.g. `src/features/home/Home.tsx`:

```tsx
export default function Home() {
  return <main className="screen"><h1>Home</h1></main>;
}
```

Do the same for `Welcome`, `ContactEntry`, `VerifyCode`, `ProfileStep`, `StartStep`, `JoinStep`, `HomeNameStep`, `ChoresStep`, `BusyStep`, `InviteStep`, `Chores`, `PlanReview`, `Profile`, `HouseholdSettings`, `Activity` (default export named after the file; heading = file name).

`src/App.tsx`:

```tsx
import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useParams } from 'react-router';
import { gateFor, type Gate, HOME_OF } from './lib/gate';
import { useAppState, useRealtime } from './lib/state';
import { useAuth } from './features/auth/AuthProvider';
import { Splash } from './ui/Splash';
import { TabBar } from './ui/TabBar';
import Welcome from './features/auth/Welcome';
import ContactEntry from './features/auth/ContactEntry';
import VerifyCode from './features/auth/VerifyCode';
import ProfileStep from './features/onboarding/ProfileStep';
import StartStep from './features/onboarding/StartStep';
import JoinStep from './features/onboarding/JoinStep';
import HomeNameStep from './features/onboarding/HomeNameStep';
import ChoresStep from './features/onboarding/ChoresStep';
import BusyStep from './features/onboarding/BusyStep';
import InviteStep from './features/onboarding/InviteStep';
import Home from './features/home/Home';
import Chores from './features/chores/Chores';
import PlanReview from './features/plan/PlanReview';
import Profile from './features/profile/Profile';
import HouseholdSettings from './features/profile/HouseholdSettings';
import Activity from './features/activity/Activity';

function useGate(): Gate {
  const auth = useAuth();
  const state = useAppState();
  return gateFor(auth, state);
}

function Guard({ allow, children }: { allow: Gate[]; children: ReactNode }) {
  const gate = useGate();
  const state = useAppState();
  if (gate === 'loading') return <Splash />;
  if (gate === 'error') return <Splash error onRetry={() => state.refetch()} />;
  if (allow.includes(gate)) return <>{children}</>;
  return <Navigate to={HOME_OF[gate]} replace />;
}

function Root() {
  const { data } = useAppState();
  useRealtime(data?.household?.id);
  return <Outlet />;
}

function Tabs() {
  return (<><Outlet /><TabBar /></>);
}

/** Invite links (/j/ABC123) remember the code, then continue through the normal gates. */
function InviteLink() {
  const { code = '' } = useParams();
  sessionStorage.setItem('roomie-invite', code);
  return <Navigate to="/onboarding/join" replace />;
}

const ready: Gate[] = ['ready'];
const household: Gate[] = ['needs_household'];

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/welcome', element: <Guard allow={['signed_out']}><Welcome /></Guard> },
      { path: '/signin/:method', element: <Guard allow={['signed_out']}><ContactEntry /></Guard> },
      { path: '/verify', element: <Guard allow={['signed_out']}><VerifyCode /></Guard> },
      { path: '/j/:code', element: <InviteLink /> },
      { path: '/onboarding/profile', element: <Guard allow={['needs_profile']}><ProfileStep /></Guard> },
      { path: '/onboarding/start', element: <Guard allow={household}><StartStep /></Guard> },
      { path: '/onboarding/join', element: <Guard allow={household}><JoinStep /></Guard> },
      { path: '/onboarding/home', element: <Guard allow={household}><HomeNameStep /></Guard> },
      { path: '/onboarding/chores', element: <Guard allow={household}><ChoresStep /></Guard> },
      { path: '/onboarding/busy', element: <Guard allow={household}><BusyStep /></Guard> },
      { path: '/onboarding/invite', element: <Guard allow={ready}><InviteStep /></Guard> },
      {
        element: <Guard allow={ready}><Tabs /></Guard>,
        children: [
          { path: '/', element: <Home /> },
          { path: '/chores', element: <Chores /> },
          { path: '/profile', element: <Profile /> },
        ],
      },
      { path: '/plan', element: <Guard allow={ready}><PlanReview /></Guard> },
      { path: '/profile/household', element: <Guard allow={ready}><HouseholdSettings /></Guard> },
      { path: '/activity', element: <Guard allow={ready}><Activity /></Guard> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { registerSW } from 'virtual:pwa-register';
import './styles/tokens.css';
import './styles/base.css';
import './ui/ui.css';
import App from './App';
import { persister, queryClient } from './lib/queryClient';
import { AuthProvider } from './features/auth/AuthProvider';
import { ToastProvider } from './ui/Toast';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24, buster: 'v1' }}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
);
```

Delete `src/App.test.tsx` (the router now needs providers; the gate is covered by `gate.test.ts`).

- [ ] **Step 6: Run tests and build**

Run: `npx vitest run src && npm run build`
Expected: all `src` tests pass (code 5, gate 1, selectors 9, OtpInput 2, TaskRow 2); build succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(app): data layer, gated routing and design-system components"
```

---
### Task 11: Sign-in — Google, email code, phone code

**Files:**
- Create: `src/test-utils.tsx`
- Modify (replace placeholders): `src/features/auth/Welcome.tsx`, `src/features/auth/ContactEntry.tsx`, `src/features/auth/VerifyCode.tsx`
- Create: `src/features/auth/auth.css`, `src/features/auth/pending.ts`
- Test: `src/features/auth/auth.test.tsx`

**Interfaces:**
- Consumes: `supabase` (Task 10); `OtpInput`, `Button`, `useToast` (Task 10).
- Produces: `src/test-utils.tsx` → `renderWithState(ui, { state?, route?, path? })` returning `{ qc, ...RenderResult }`, and `fixture(over?: Partial<AppState>): AppState` (2 members `me`/`p`, 3 chores, a locked plan for this week with today's assignments). Every later UI test uses these.
- Produces: `pending.ts` → `savePending({ method: 'email' | 'phone'; contact: string })`, `loadPending()`, `clearPending()`.

- [ ] **Step 1: Create shared test utilities `src/test-utils.tsx`**

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { STATE_KEY } from './lib/state';
import type { AppState, Assignment } from './lib/types';
import { ToastProvider } from './ui/Toast';

export function fixture(over: Partial<AppState> = {}): AppState {
  const today = '2026-10-01';
  const a = (id: string, chore_id: string, user_id: string, effort: 1 | 2 | 3, extra: Partial<Assignment> = {}): Assignment => ({
    id, plan_id: 'plan-cur', chore_id, user_id, day: today, effort, status: 'todo', claimed_by: null, done_at: null,
    reason: { code: 'balance', points: 5, target: 5 }, ...extra,
  });
  return {
    profile: { id: 'me', name: 'Rahul', color: '#d1fae5', nudge_style: 'motivate', activity_seen_at: '2026-10-01T00:00:00Z' },
    household: { id: 'h1', name: 'Flat 4B', invite_code: 'ABC123', plan_mode: 'review', tz: 'Asia/Kathmandu', day_ends_at: '22:00:00' },
    members: [
      { user_id: 'me', name: 'Rahul', color: '#d1fae5', role: 'owner', busy_days: [0, 2] },
      { user_id: 'p', name: 'Priya', color: '#dbeafe', role: 'member', busy_days: [] },
    ],
    chores: [
      { id: 'c-sweep', name: 'Sweep living room', icon: '🧹', effort: 2, cadence: 'weekly', active: true },
      { id: 'c-trash', name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily', active: true },
      { id: 'c-bath', name: 'Mop bathroom floor', icon: '🪣', effort: 3, cadence: 'weekly', active: true },
    ],
    plans: [{ id: 'plan-cur', week_start: '2026-09-28', status: 'locked', lock_at: '2026-09-27T12:15:00Z', approved_by: [] }],
    assignments: [
      a('a-sweep', 'c-sweep', 'me', 2),
      a('a-trash', 'c-trash', 'me', 1),
      a('a-p-trash', 'c-trash', 'p', 1),
      a('a-missed', 'c-bath', 'p', 3, { status: 'missed', day: '2026-09-30' }),
    ],
    swaps: [],
    streak: { current: 3, best: 5, last_settled_day: '2026-09-30' },
    balance: 0,
    activity: [],
    today,
    ...over,
  };
}

export function renderWithState(ui: ReactElement, opts: { state?: AppState; route?: string; path?: string } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  if (opts.state) qc.setQueryData(STATE_KEY, opts.state);
  const route = opts.route ?? '/';
  const result = render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={opts.path ?? route} element={ui} />
            <Route path="*" element={<p>navigated</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { qc, ...result };
}
```

- [ ] **Step 2: Write the failing tests `src/features/auth/auth.test.tsx`**

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { renderWithState } from '../../test-utils';
import ContactEntry from './ContactEntry';
import VerifyCode from './VerifyCode';
import Welcome from './Welcome';
import { loadPending, savePending } from './pending';

const auth = vi.hoisted(() => ({
  signInWithOtp: vi.fn(async () => ({ error: null })),
  verifyOtp: vi.fn(async () => ({ error: null })),
  signInWithOAuth: vi.fn(async () => ({ error: null })),
}));
vi.mock('../../lib/supabase', () => ({ supabase: { auth } }));

beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });

test('welcome offers Google and email, and phone only when enabled', () => {
  renderWithState(<Welcome />, { route: '/welcome' });
  expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /continue with email/i })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /continue with phone/i })).toBeNull();
});

test('email entry validates, sends a code and remembers the address', async () => {
  renderWithState(<ContactEntry />, { route: '/signin/email', path: '/signin/:method' });
  const input = screen.getByLabelText(/email/i);
  await userEvent.type(input, 'not-an-email');
  await userEvent.click(screen.getByRole('button', { name: /send code/i }));
  expect(screen.getByText(/check that email/i)).toBeInTheDocument();
  expect(auth.signInWithOtp).not.toHaveBeenCalled();

  await userEvent.clear(input);
  await userEvent.type(input, 'rahul@example.com');
  await userEvent.click(screen.getByRole('button', { name: /send code/i }));
  await waitFor(() => expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'rahul@example.com', options: { shouldCreateUser: true } }));
  expect(loadPending()).toEqual({ method: 'email', contact: 'rahul@example.com' });
  expect(await screen.findByText('navigated')).toBeInTheDocument();
});

test('phone entry builds an E.164 Nepal number', async () => {
  renderWithState(<ContactEntry />, { route: '/signin/phone', path: '/signin/:method' });
  await userEvent.type(screen.getByLabelText(/phone/i), '98 0123 4567');
  await userEvent.click(screen.getByRole('button', { name: /send code/i }));
  await waitFor(() => expect(auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+9779801234567' }));
});

test('entering the 6-digit code verifies it', async () => {
  savePending({ method: 'email', contact: 'rahul@example.com' });
  renderWithState(<VerifyCode />, { route: '/verify' });
  await userEvent.type(screen.getByLabelText(/6-digit code/i), '123456');
  await waitFor(() => expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'rahul@example.com', token: '123456', type: 'email' }));
});

test('a wrong code says so and clears the boxes', async () => {
  auth.verifyOtp.mockResolvedValueOnce({ error: { message: 'Token has expired or is invalid' } } as never);
  savePending({ method: 'phone', contact: '+9779801234567' });
  renderWithState(<VerifyCode />, { route: '/verify' });
  await userEvent.type(screen.getByLabelText(/6-digit code/i), '999999');
  expect(await screen.findByText(/that code didn't work/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/6-digit code/i)).toHaveValue('');
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run src/features/auth`
Expected: FAIL — `pending.ts` missing / placeholder screens lack the expected controls.

- [ ] **Step 4: Implement**

`src/features/auth/pending.ts`:

```ts
export interface Pending { method: 'email' | 'phone'; contact: string }
const KEY = 'roomie-otp';
export const savePending = (p: Pending) => sessionStorage.setItem(KEY, JSON.stringify(p));
export const loadPending = (): Pending | null => JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
export const clearPending = () => sessionStorage.removeItem(KEY);
```

`src/features/auth/Welcome.tsx`:

```tsx
import { Link } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../ui/Button';
import { Sprout } from '../../ui/Sprout';
import { useToast } from '../../ui/Toast';
import './auth.css';

export default function Welcome() {
  const toast = useToast();
  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) toast.show("Google sign-in didn't start. Try email instead.");
  };
  return (
    <main className="screen auth">
      <div className="auth__hero">
        <div className="auth__mark"><Sprout size={72} /></div>
        <h1>Fair isn't equal.</h1>
        <p className="muted auth__lede">Roomie plans the chores, keeps heavy ones off your busy days, and does the reminding — so nobody has to.</p>
      </div>
      <div className="auth__actions">
        <Button block onClick={google}>Continue with Google</Button>
        <Link className="btn btn--secondary btn--block" to="/signin/email">Continue with email</Link>
        {import.meta.env.VITE_PHONE_AUTH === 'on' && (
          <Link className="btn btn--ghost btn--block" to="/signin/phone">Continue with phone</Link>
        )}
        <p className="auth__fine muted">No passwords. We'll send you a 6-digit code.</p>
      </div>
    </main>
  );
}
```

`src/features/auth/ContactEntry.tsx`:

```tsx
import { ArrowLeft } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../ui/Button';
import { savePending } from './pending';
import './auth.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const toE164 = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (raw.trim().startsWith('+')) return `+${digits}`;
  return `+977${digits.replace(/^0+/, '')}`; // default to Nepal
};

export default function ContactEntry() {
  const { method = 'email' } = useParams();
  const isPhone = method === 'phone';
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const contact = isPhone ? toE164(value) : value.trim().toLowerCase();
    if (isPhone ? !/^\+\d{8,15}$/.test(contact) : !EMAIL.test(contact)) {
      setError(isPhone ? 'Check that phone number.' : 'Check that email address.');
      return;
    }
    setBusy(true);
    const { error: err } = isPhone
      ? await supabase.auth.signInWithOtp({ phone: contact })
      : await supabase.auth.signInWithOtp({ email: contact, options: { shouldCreateUser: true } });
    setBusy(false);
    if (err) { setError(err.message.includes('rate') ? 'Too many codes requested. Try again in a minute.' : "We couldn't send a code. Try again."); return; }
    savePending({ method: isPhone ? 'phone' : 'email', contact });
    navigate('/verify');
  };

  return (
    <main className="screen auth">
      <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
      <form className="auth__form" onSubmit={submit} noValidate>
        <h1>{isPhone ? "What's your number?" : "What's your email?"}</h1>
        <p className="muted">We'll send a 6-digit code to sign you in.</p>
        <label className="field">
          <span className="field__label">{isPhone ? 'Phone number' : 'Email'}</span>
          <span className="field__control">
            {isPhone && <span className="field__prefix">+977</span>}
            <input
              autoFocus value={value} onChange={(e) => { setValue(e.target.value); setError(null); }}
              type={isPhone ? 'tel' : 'email'} inputMode={isPhone ? 'tel' : 'email'}
              autoComplete={isPhone ? 'tel-national' : 'email'} placeholder={isPhone ? '98XXXXXXXX' : 'you@example.com'}
              aria-invalid={Boolean(error)} aria-describedby={error ? 'contact-error' : undefined}
            />
          </span>
        </label>
        {error && <p id="contact-error" className="field__error" role="alert">{error}</p>}
        <Button block type="submit" loading={busy}>Send code</Button>
      </form>
    </main>
  );
}
```

`src/features/auth/VerifyCode.tsx`:

```tsx
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../ui/Button';
import { OtpInput } from '../../ui/OtpInput';
import { clearPending, loadPending } from './pending';
import './auth.css';

export default function VerifyCode() {
  const pending = loadPending();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(30);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  if (!pending) return <Navigate to="/welcome" replace />;

  const verify = async (token: string) => {
    setBusy(true);
    const { error: err } = pending.method === 'phone'
      ? await supabase.auth.verifyOtp({ phone: pending.contact, token, type: 'sms' })
      : await supabase.auth.verifyOtp({ email: pending.contact, token, type: 'email' });
    setBusy(false);
    if (err) { setError("That code didn't work. Check it, or send a new one."); setCode(''); return; }
    clearPending(); // the auth listener updates the session; the route guard moves us on
  };

  const resend = async () => {
    setWait(30);
    if (pending.method === 'phone') await supabase.auth.signInWithOtp({ phone: pending.contact });
    else await supabase.auth.signInWithOtp({ email: pending.contact, options: { shouldCreateUser: true } });
  };

  return (
    <main className="screen auth">
      <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
      <div className="auth__form">
        <h1>Enter your code</h1>
        <p className="muted">Sent to <strong>{pending.contact}</strong></p>
        <OtpInput label="6-digit code" value={code} onChange={(v) => { setCode(v); setError(null); }} onComplete={verify} />
        {error && <p className="field__error" role="alert">{error}</p>}
        <Button variant="ghost" onClick={resend} disabled={wait > 0 || busy}>
          {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
        </Button>
      </div>
    </main>
  );
}
```

`src/features/auth/auth.css`:

```css
.auth { display: flex; flex-direction: column; min-height: 100%; padding-bottom: calc(var(--safe-bottom) + 28px); }
.auth__hero { flex: 1; display: grid; align-content: center; gap: 16px; }
.auth__mark { width: 104px; height: 104px; border-radius: 30px; background: var(--lav); display: grid; place-items: center; }
.auth__lede { font-size: 17px; max-width: 32ch; }
.auth__actions { display: grid; gap: 10px; }
.auth__fine { text-align: center; font-size: 13px; margin-top: 6px; }
.auth__form { display: grid; gap: 16px; margin-top: 24px; }
.icon-btn { width: var(--tap); height: var(--tap); display: grid; place-items: center; border-radius: 50%; border: 0; background: var(--surface); cursor: pointer; }
.field { display: grid; gap: 6px; }
.field__label { font-weight: 600; font-size: 14px; }
.field__control { display: flex; align-items: center; gap: 8px; min-height: 54px; padding: 0 16px; border-radius: 16px; background: var(--surface); border: 1.5px solid var(--line); }
.field__control:focus-within { border-color: var(--lav-3); box-shadow: 0 0 0 3px var(--lav); }
.field__control input, .field__control select { flex: 1; border: 0; background: none; font: inherit; font-size: 17px; outline: none; min-width: 0; }
.field__prefix { color: var(--muted); font-weight: 600; }
.field__error { color: var(--danger); font-size: 14px; }
```

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run src/features/auth`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/test-utils.tsx src/features/auth
git commit -m "feat(auth): passwordless sign-in with Google, email code and phone code"
```

---

### Task 12: Onboarding — profile, create or join, chores, busy days, invite

**Files:**
- Create: `src/features/onboarding/draft.ts`, `src/features/onboarding/onboarding.css`, `src/features/onboarding/Step.tsx`
- Modify (replace placeholders): `ProfileStep.tsx`, `StartStep.tsx`, `JoinStep.tsx`, `HomeNameStep.tsx`, `ChoresStep.tsx`, `BusyStep.tsx`, `InviteStep.tsx` in `src/features/onboarding/`
- Modify: `src/App.tsx` (busy step allows `needs_household` **and** `ready`, so finishing doesn't bounce before navigating to the invite screen)
- Test: `src/features/onboarding/onboarding.test.tsx`

**Interfaces:**
- Consumes: `rpc`, `planNow`, `STATE_KEY`, `useAppState` (Task 10); `normalizeCode` (Task 10); `OtpInput`, `Button`, `EffortChip`, `Progress`, `useToast` (Task 10); RPCs `update_profile`, `create_household`, `join_household` (Task 8); `effortLabel`, `errorText` (Task 5); `DAY_NAMES`, `Weekday` (Task 2).
- Produces: `PASTELS: string[]` and `DAY_SHORT: string[]` (exported from `draft.ts`, reused by Profile in Task 16); `useDraft()`; `SUGGESTED` chores; `<Step title subtitle step total back?>` layout wrapper.

- [ ] **Step 1: Write the failing tests `src/features/onboarding/onboarding.test.tsx`**

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { renderWithState } from '../../test-utils';
import BusyStep from './BusyStep';
import ChoresStep from './ChoresStep';
import JoinStep from './JoinStep';
import { loadDraft, saveDraft } from './draft';

const api = vi.hoisted(() => ({ rpc: vi.fn(async () => 'new-id' as unknown), planNow: vi.fn(async () => {}) }));
vi.mock('../../lib/state', async (orig) => ({ ...(await orig<object>()), rpc: api.rpc, planNow: api.planNow }));

beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });

test('chores step: basics pre-selected, effort taps cycle, continue needs one chore', async () => {
  saveDraft({ ...loadDraft(), mode: 'create', homeName: 'Flat 4B' });
  renderWithState(<ChoresStep />, { route: '/onboarding/chores' });
  expect(screen.getByRole('checkbox', { name: /take out trash/i })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: /vacuum rugs/i })).not.toBeChecked();

  await userEvent.click(screen.getByRole('button', { name: /take out trash effort: light/i }));
  expect(screen.getByRole('button', { name: /take out trash effort: medium/i })).toBeInTheDocument();

  for (const name of [/take out trash/i, /sweep living room/i, /do the laundry/i]) {
    await userEvent.click(screen.getByRole('checkbox', { name }));
  }
  expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
});

test('chores step: add a custom chore', async () => {
  renderWithState(<ChoresStep />, { route: '/onboarding/chores' });
  await userEvent.click(screen.getByRole('button', { name: /add custom chore/i }));
  await userEvent.type(screen.getByLabelText(/chore name/i), 'Water plants{enter}');
  expect(screen.getByRole('checkbox', { name: /water plants/i })).toBeChecked();
});

test('join step pre-fills a code from an invite link', () => {
  sessionStorage.setItem('roomie-invite', 'abc-123');
  renderWithState(<JoinStep />, { route: '/onboarding/join' });
  expect(screen.getByLabelText(/household code/i)).toHaveValue('ABC123');
});

test('busy step (create) creates the household with selected chores, plans it, then invites', async () => {
  saveDraft({ ...loadDraft(), mode: 'create', homeName: 'Flat 4B' });
  renderWithState(<BusyStep />, { route: '/onboarding/busy' });
  await userEvent.click(screen.getByRole('checkbox', { name: 'Monday' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Friday' }));
  await userEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => expect(api.rpc).toHaveBeenCalledWith('create_household', {
    p_name: 'Flat 4B',
    p_busy: [0, 4],
    p_chores: [
      { name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily' },
      { name: 'Sweep living room', icon: '🧹', effort: 2, cadence: 'weekly' },
      { name: 'Do the laundry', icon: '🧺', effort: 2, cadence: 'weekly' },
    ],
  }));
  expect(api.planNow).toHaveBeenCalled();
  expect(await screen.findByText('navigated')).toBeInTheDocument();
});

test('busy step (join) with an unknown code says so', async () => {
  api.rpc.mockResolvedValueOnce(null);
  saveDraft({ ...loadDraft(), mode: 'join', code: 'ZZZZZZ' });
  renderWithState(<BusyStep />, { route: '/onboarding/busy' });
  await userEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(await screen.findByText(/doesn't match a household/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/onboarding`
Expected: FAIL — `draft.ts` missing.

- [ ] **Step 3: Implement shared onboarding pieces**

`src/features/onboarding/draft.ts`:

```ts
import { useState } from 'react';
import type { Cadence, Effort } from '@domain/types.ts';
import type { Weekday } from '@domain/time.ts';

export const PASTELS = ['#ffedd5', '#dbeafe', '#d1fae5', '#fce7f3', '#fef3c7', '#e0e7ff'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface DraftChore { key: string; name: string; icon: string; effort: Effort; cadence: Cadence; selected: boolean }
export interface Draft { mode: 'create' | 'join'; homeName: string; code: string; busyDays: Weekday[]; chores: DraftChore[] }

export const SUGGESTED: DraftChore[] = [
  { key: 'trash', name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily', selected: true },
  { key: 'sweep', name: 'Sweep living room', icon: '🧹', effort: 2, cadence: 'weekly', selected: true },
  { key: 'laundry', name: 'Do the laundry', icon: '🧺', effort: 2, cadence: 'weekly', selected: true },
  { key: 'vacuum', name: 'Vacuum rugs', icon: '🧽', effort: 2, cadence: 'weekly', selected: false },
  { key: 'dishes', name: 'Wash dishes', icon: '🍽️', effort: 1, cadence: 'daily', selected: false },
];

const KEY = 'roomie-onboarding';
const fresh = (): Draft => ({ mode: 'create', homeName: '', code: '', busyDays: [], chores: SUGGESTED.map((c) => ({ ...c })) });

export const loadDraft = (): Draft => ({ ...fresh(), ...JSON.parse(sessionStorage.getItem(KEY) ?? '{}') });
export const saveDraft = (d: Draft) => sessionStorage.setItem(KEY, JSON.stringify(d));
export const clearDraft = () => sessionStorage.removeItem(KEY);

export function useDraft(): [Draft, (patch: Partial<Draft>) => void] {
  const [draft, setDraft] = useState(loadDraft);
  const update = (patch: Partial<Draft>) => setDraft((d) => { const next = { ...d, ...patch }; saveDraft(next); return next; });
  return [draft, update];
}
```

`src/features/onboarding/Step.tsx`:

```tsx
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Progress } from '../../ui/Progress';
import './onboarding.css';

export function Step({ title, subtitle, step, total, children, footer, back = true }: {
  title: string; subtitle?: string; step?: number; total?: number; children: ReactNode; footer?: ReactNode; back?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <main className="screen step">
      {step && total && <Progress step={step} total={total} />}
      {back && <button className="icon-btn step__back" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>}
      <h1 className="step__title">{title}</h1>
      {subtitle && <p className="muted step__subtitle">{subtitle}</p>}
      <div className="step__body">{children}</div>
      {footer && <div className="step__footer">{footer}</div>}
    </main>
  );
}
```

`src/features/onboarding/onboarding.css`:

```css
.step { display: flex; flex-direction: column; gap: 14px; padding-bottom: calc(var(--safe-bottom) + 24px); }
.step__back { margin-top: 6px; }
.step__title { font-size: 30px; }
.step__subtitle { margin-top: -6px; }
.step__body { flex: 1; display: grid; gap: 10px; align-content: start; }
.step__footer { position: sticky; bottom: calc(var(--safe-bottom) + 12px); display: grid; gap: 8px; }
.pick { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 6px 8px 6px 14px; border-radius: var(--radius-pill); border: 1.5px solid var(--line); background: #fff; cursor: pointer; }
.pick.is-on { background: var(--sky-bg); border-color: transparent; color: var(--sky-ink); }
.pick input { position: absolute; opacity: 0; pointer-events: none; }
.pick__name { flex: 1; font-weight: 600; }
.pick__tick { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #d1d5db; display: grid; place-items: center; }
.pick.is-on .pick__tick { background: var(--navy); border-color: var(--navy); color: #fff; }
.pick:focus-within { box-shadow: 0 0 0 3px var(--lav); }
.effort-tap { border: 0; background: none; padding: 0; cursor: pointer; min-height: var(--tap); display: grid; place-items: center; }
.day-pick { min-height: 52px; padding: 0 22px; border-radius: var(--radius-pill); display: flex; align-items: center; justify-content: space-between; background: var(--surface); font-weight: 600; cursor: pointer; position: relative; }
.day-pick.is-on { background: var(--lav); color: var(--lav-ink); }
.day-pick input { position: absolute; opacity: 0; pointer-events: none; }
.day-pick:focus-within { box-shadow: 0 0 0 3px var(--lav-2); }
.choice-card { display: grid; gap: 4px; text-align: left; padding: 20px; border-radius: var(--radius-l); border: 1.5px solid var(--line); background: #fff; cursor: pointer; min-height: 96px; }
.choice-card strong { font: 700 20px/1.2 var(--font-display); }
.choice-card:hover { border-color: var(--lav-3); }
.swatches { display: flex; gap: 10px; flex-wrap: wrap; }
.swatch { width: 48px; height: 48px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; }
.swatch.is-on { border-color: var(--navy); }
.code-big { font: 700 44px/1 var(--font-ui); letter-spacing: .18em; text-align: center; padding: 26px; border-radius: var(--radius-l); background: var(--sky-bg); color: var(--sky-ink); }
```

- [ ] **Step 4: Implement the steps**

`ProfileStep.tsx`:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { errorText } from '@domain/copy.ts';
import { rpc, RpcError, STATE_KEY, useAppState } from '../../lib/state';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { PASTELS } from './draft';
import { Step } from './Step';

export default function ProfileStep() {
  const { data } = useAppState();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState(data?.profile.name ?? '');
  const [color, setColor] = useState(data?.profile.color ?? PASTELS[0]);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await rpc('update_profile', { p_name: name.trim(), p_color: color });
      await qc.invalidateQueries({ queryKey: STATE_KEY }); // the gate moves on to create/join
    } catch (err) {
      toast.show(errorText(err instanceof RpcError ? err.code : 'unknown'));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save}>
      <Step title="What should your roommates call you?" back={false}
        footer={<Button block type="submit" loading={busy} disabled={!name.trim()}>Continue</Button>}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}><Avatar name={name || '?'} color={color} size={88} /></div>
        <label className="field">
          <span className="field__label">Your name</span>
          <span className="field__control"><input autoFocus maxLength={30} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" /></span>
        </label>
        <p className="field__label">Pick your colour</p>
        <div className="swatches" role="radiogroup" aria-label="Your colour">
          {PASTELS.map((c) => (
            <button type="button" key={c} role="radio" aria-checked={c === color} aria-label={`Colour ${c}`}
              className={`swatch${c === color ? ' is-on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
        <p className="muted">Your colour marks your chores, so ownership reads at a glance.</p>
      </Step>
    </form>
  );
}
```

`StartStep.tsx`:

```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useDraft } from './draft';
import { Step } from './Step';

export default function StartStep() {
  const navigate = useNavigate();
  const [, update] = useDraft();
  useEffect(() => { if (sessionStorage.getItem('roomie-invite')) navigate('/onboarding/join', { replace: true }); }, [navigate]);
  return (
    <Step title="Your space" subtitle="Start a new home, or join the one your roommates already set up." back={false}>
      <button className="choice-card" onClick={() => { update({ mode: 'create' }); navigate('/onboarding/home'); }}>
        <strong>Create a home</strong><span className="muted">Set up chores and invite your roommates.</span>
      </button>
      <button className="choice-card" onClick={() => { update({ mode: 'join' }); navigate('/onboarding/join'); }}>
        <strong>Join with a code</strong><span className="muted">Got a 6-character code or a link? Use it here.</span>
      </button>
    </Step>
  );
}
```

`JoinStep.tsx`:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { normalizeCode } from '../../lib/code';
import { Button } from '../../ui/Button';
import { OtpInput } from '../../ui/OtpInput';
import { useDraft } from './draft';
import { Step } from './Step';

export default function JoinStep() {
  const navigate = useNavigate();
  const [draft, update] = useDraft();
  const [code, setCode] = useState(() => normalizeCode(sessionStorage.getItem('roomie-invite') ?? draft.code));
  const next = (c: string) => { update({ mode: 'join', code: c }); sessionStorage.removeItem('roomie-invite'); navigate('/onboarding/busy'); };
  return (
    <Step title="Join your home" subtitle="Enter the code your roommate shared." step={1} total={2}
      footer={<Button block disabled={code.length !== 6} onClick={() => next(code)}>Continue</Button>}>
      <OtpInput label="Household code" alphanumeric value={code} onChange={setCode} />
    </Step>
  );
}
```

`HomeNameStep.tsx`:

```tsx
import { useNavigate } from 'react-router';
import { Button } from '../../ui/Button';
import { useDraft } from './draft';
import { Step } from './Step';

export default function HomeNameStep() {
  const navigate = useNavigate();
  const [draft, update] = useDraft();
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (draft.homeName.trim()) navigate('/onboarding/chores'); }}>
      <Step title="Name your home" subtitle="Your roommates will see this." step={1} total={4}
        footer={<Button block type="submit" disabled={!draft.homeName.trim()}>Continue</Button>}>
        <label className="field">
          <span className="field__label">Home name</span>
          <span className="field__control">
            <input autoFocus maxLength={40} placeholder="Flat 4B" value={draft.homeName} onChange={(e) => update({ homeName: e.target.value })} />
          </span>
        </label>
      </Step>
    </form>
  );
}
```

`ChoresStep.tsx`:

```tsx
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { effortLabel } from '@domain/copy.ts';
import type { Effort } from '@domain/types.ts';
import { Button } from '../../ui/Button';
import { EffortChip } from '../../ui/EffortChip';
import { useDraft } from './draft';
import { Step } from './Step';

const nextEffort = (e: Effort): Effort => (e === 3 ? 1 : ((e + 1) as Effort));

export default function ChoresStep() {
  const navigate = useNavigate();
  const [draft, update] = useDraft();
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState('');
  const chores = draft.chores;
  const patch = (key: string, p: Partial<(typeof chores)[number]>) => update({ chores: chores.map((c) => (c.key === key ? { ...c, ...p } : c)) });
  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    update({ chores: [...chores, { key: `custom-${Date.now()}`, name, icon: '✨', effort: 1, cadence: 'weekly', selected: true }] });
    setCustom(''); setAdding(false);
  };

  return (
    <Step title="Let's set up your chores." subtitle="We've suggested a few basics. Tap to keep or remove; tap the chip to set effort." step={2} total={4}
      footer={<Button block disabled={!chores.some((c) => c.selected)} onClick={() => navigate('/onboarding/busy')}>Continue</Button>}>
      {chores.map((c) => (
        <div key={c.key} className={`pick${c.selected ? ' is-on' : ''}`}>
          <label style={{ display: 'contents' }}>
            <input type="checkbox" checked={c.selected} onChange={() => patch(c.key, { selected: !c.selected })} aria-label={c.name} />
            <span aria-hidden>{c.icon}</span>
            <span className="pick__name">{c.name}</span>
          </label>
          <button type="button" className="effort-tap" onClick={() => patch(c.key, { effort: nextEffort(c.effort) })}
            aria-label={`${c.name} effort: ${effortLabel(c.effort)}`}>
            <EffortChip effort={c.effort} />
          </button>
          <span className="pick__tick" aria-hidden>{c.selected ? '✓' : ''}</span>
        </div>
      ))}
      {adding ? (
        <form onSubmit={(e) => { e.preventDefault(); addCustom(); }} className="field">
          <span className="field__control">
            <input autoFocus aria-label="Chore name" maxLength={40} placeholder="e.g. Water plants" value={custom} onChange={(e) => setCustom(e.target.value)} />
            <Button type="submit" variant="secondary">Add</Button>
          </span>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden /> Add custom chore</Button>
      )}
    </Step>
  );
}
```

`BusyStep.tsx`:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { errorText } from '@domain/copy.ts';
import { DAY_NAMES, type Weekday } from '@domain/time.ts';
import { planNow, rpc, RpcError, STATE_KEY } from '../../lib/state';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { clearDraft, useDraft } from './draft';
import { Step } from './Step';

export default function BusyStep() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, update] = useDraft();
  const [busy, setBusy] = useState(false);
  const isJoin = draft.mode === 'join';

  const toggle = (d: Weekday) =>
    update({ busyDays: draft.busyDays.includes(d) ? draft.busyDays.filter((x) => x !== d) : [...draft.busyDays, d].sort() as Weekday[] });

  const finish = async () => {
    setBusy(true);
    try {
      if (isJoin) {
        const h = await rpc<string | null>('join_household', { p_code: draft.code, p_busy: draft.busyDays });
        if (!h) { toast.show(errorText('invalid_code')); navigate('/onboarding/join'); return; }
      } else {
        await rpc('create_household', {
          p_name: draft.homeName.trim(),
          p_busy: draft.busyDays,
          p_chores: draft.chores.filter((c) => c.selected).map(({ name, icon, effort, cadence }) => ({ name, icon, effort, cadence })),
        });
      }
      await planNow().catch(() => {}); // the 10-minute tick catches up if this call fails
      clearDraft();
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      navigate(isJoin ? '/' : '/onboarding/invite', { replace: true });
    } catch (err) {
      toast.show(errorText(err instanceof RpcError ? err.code : 'unknown'));
    } finally { setBusy(false); }
  };

  return (
    <Step title="Which days are you busiest?" subtitle="We won't assign you heavy tasks on these days."
      step={isJoin ? 2 : 3} total={isJoin ? 2 : 4}
      footer={<Button block loading={busy} onClick={finish}>Continue</Button>}>
      {DAY_NAMES.map((name, i) => {
        const d = i as Weekday;
        const on = draft.busyDays.includes(d);
        return (
          <label key={name} className={`day-pick${on ? ' is-on' : ''}`}>
            <input type="checkbox" checked={on} onChange={() => toggle(d)} aria-label={name} />
            <span>{name}</span>{on && <span aria-hidden>✓</span>}
          </label>
        );
      })}
    </Step>
  );
}
```

`InviteStep.tsx`:

```tsx
import { Copy, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useMe } from '../../lib/state';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { Step } from './Step';

export default function InviteStep() {
  const { state } = useMe();
  const navigate = useNavigate();
  const toast = useToast();
  const code = state.household!.invite_code;
  const link = `${window.location.origin}/j/${code}`;
  const text = `Join ${state.household!.name} on Roomie — code ${code}: ${link}`;

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Join our home on Roomie', text, url: link }); return; } catch { /* cancelled */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  const copy = async () => { await navigator.clipboard.writeText(link); toast.show('Invite link copied.'); };

  return (
    <Step title="Invite your roommates" subtitle="Share this code. Everyone who joins is part of next week's plan." step={4} total={4} back={false}
      footer={<><Button block onClick={share}><Share2 size={18} aria-hidden /> Share invite</Button><Button block variant="ghost" onClick={() => navigate('/', { replace: true })}>Done</Button></>}>
      <div className="code-big" aria-label={`Household code ${code.split('').join(' ')}`}>{code}</div>
      <Button variant="secondary" onClick={copy}><Copy size={16} aria-hidden /> Copy link</Button>
    </Step>
  );
}
```

- [ ] **Step 5: Let the busy step survive the gate change**

In `src/App.tsx`, change the busy route to:

```tsx
{ path: '/onboarding/busy', element: <Guard allow={['needs_household', 'ready']}><BusyStep /></Guard> },
```

- [ ] **Step 6: Run to verify they pass**

Run: `npx vitest run src/features/onboarding && npm run build`
Expected: PASS (5 tests); build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/features/onboarding src/App.tsx
git commit -m "feat(onboarding): create or join a home in under a minute"
```

---
### Task 13: Home — today, the household streak, roommates, "why me?"

**Files:**
- Create: `src/features/chores/useChoreActions.ts`, `src/features/chores/WhySheet.tsx`, `src/features/chores/Celebration.tsx`, `src/features/chores/chores.css`, `src/features/home/home.css`
- Modify (replace placeholder): `src/features/home/Home.tsx`
- Test: `src/features/home/Home.test.tsx`

**Interfaces:**
- Consumes: `useMe`, `useAction`, `STATE_KEY` (Task 10); selectors `namesOf`, `choreMap`, `myTasksOn`, `pool`, `roommates`, `nextUp`, `pendingDraft`, `unreadCount`, `weekTotals` (Task 10); `reasonText`, `balanceSentence` (Task 5); `DAY_NAMES`, `weekdayOf`, `weekStartOf` (Task 2); UI kit (Task 10).
- Produces (reused by Tasks 14–15):
  - `useChoreActions(): { complete(a: Assignment): void; claim(a: Assignment): void; celebration: 'all_done' | 'covered' | null; closeCelebration(): void }`
  - `<WhySheet assignment onClose />` — reason sentence + household's week points (alphabetical, never ranked) + your private balance line
  - `<Celebration kind onClose />`

- [ ] **Step 1: Write the failing tests `src/features/home/Home.test.tsx`**

```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import Home from './Home';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

test('greets me, shows the household streak and today’s tasks', () => {
  renderWithState(<Home />, { state: fixture() });
  expect(screen.getByRole('heading', { name: 'Hello, Rahul.' })).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
  const today = screen.getByRole('region', { name: "Today's tasks" });
  expect(within(today).getByText('Sweep living room')).toBeInTheDocument();
  expect(within(today).getByText('Take out trash')).toBeInTheDocument();
});

test('roommate cards count today’s tasks, with no ranking', () => {
  renderWithState(<Home />, { state: fixture() });
  expect(screen.getByText('Priya')).toBeInTheDocument();
  expect(screen.getByText('1 task')).toBeInTheDocument();
  expect(screen.queryByText(/rank|#1|leader/i)).toBeNull();
});

test('completing a task updates instantly and offers undo', async () => {
  renderWithState(<Home />, { state: fixture() });
  await userEvent.click(screen.getByRole('button', { name: 'Mark Take out trash done' }));
  expect(screen.getByRole('button', { name: 'Take out trash done' })).toHaveAttribute('aria-pressed', 'true');
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('complete_assignment', { p_id: 'a-trash' }));
  expect(await screen.findByRole('button', { name: 'Undo' })).toBeInTheDocument();
});

test('finishing the last task of the day celebrates', async () => {
  const s = fixture();
  s.assignments = s.assignments.map((a) => (a.id === 'a-sweep' ? { ...a, status: 'done' as const } : a));
  renderWithState(<Home />, { state: s });
  await userEvent.click(screen.getByRole('button', { name: 'Mark Take out trash done' }));
  expect(await screen.findByRole('dialog', { name: 'Wonderful job.' })).toBeInTheDocument();
});

test('tapping a task explains why it is mine', async () => {
  renderWithState(<Home />, { state: fixture() });
  await userEvent.click(screen.getByRole('button', { name: 'Sweep living room: why this is yours' }));
  const sheet = await screen.findByRole('dialog', { name: 'Sweep living room' });
  expect(within(sheet).getByText("Evens out effort: you're at 5 of 5 points this week.")).toBeInTheDocument();
  expect(within(sheet).getByText(/only you can see/i)).toBeInTheDocument();
});

test('shows the claim-pool teaser and a pending plan banner', () => {
  const s = fixture({ plans: [...fixture().plans, { id: 'n', week_start: '2026-10-05', status: 'draft', lock_at: '2026-10-04T12:15:00Z', approved_by: [] }] });
  renderWithState(<Home />, { state: s });
  expect(screen.getByRole('link', { name: /1 chore up for grabs/i })).toHaveAttribute('href', '/chores');
  expect(screen.getByRole('link', { name: /next week's plan is ready/i })).toHaveAttribute('href', '/plan');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/home`
Expected: FAIL — placeholder Home has none of these elements.

- [ ] **Step 3: Implement chore actions, why-sheet and celebration**

`src/features/chores/useChoreActions.ts`:

```ts
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { STATE_KEY, useAction } from '../../lib/state';
import { myTasksOn } from '../../lib/selectors';
import type { AppState, Assignment } from '../../lib/types';
import { useToast } from '../../ui/Toast';

const buzz = () => navigator.vibrate?.(12);

export function useChoreActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const [celebration, setCelebration] = useState<'all_done' | 'covered' | null>(null);

  const undo = useAction<{ p_id: string }>('undo_complete', {
    optimistic: (s, { p_id }) => ({
      ...s,
      assignments: s.assignments.map((a) => (a.id === p_id ? { ...a, status: a.claimed_by ? 'claimed' : 'todo', done_at: null } : a)),
    }),
  });
  const completeAction = useAction<{ p_id: string }>('complete_assignment', {
    optimistic: (s, { p_id }) => ({
      ...s,
      assignments: s.assignments.map((a) => (a.id === p_id ? { ...a, status: 'done', done_at: new Date().toISOString() } : a)),
    }),
    onSuccess: (_d, { p_id }) =>
      toast.show('Done. Nice one.', { action: { label: 'Undo', onClick: () => undo.mutate({ p_id }) }, duration: 5000 }),
  });
  const claimAction = useAction<{ p_id: string; me: string }>('claim_assignment', {
    optimistic: (s, { p_id, me }) => ({
      ...s,
      assignments: s.assignments.map((a) => (a.id === p_id ? { ...a, status: 'claimed', claimed_by: me } : a)),
    }),
    onSuccess: () => toast.show("It's yours — thanks for covering."),
  });

  const complete = (a: Assignment) => {
    buzz();
    const s = qc.getQueryData<AppState>(STATE_KEY);
    if (a.status === 'claimed') setCelebration('covered');
    else if (s) {
      const me = s.profile.id;
      const stillOpen = myTasksOn(s, me, s.today).filter((x) => x.id !== a.id && x.status !== 'done');
      if (a.day === s.today && stillOpen.length === 0) setCelebration('all_done');
    }
    completeAction.mutate({ p_id: a.id });
  };

  const claim = (a: Assignment) => {
    const me = qc.getQueryData<AppState>(STATE_KEY)?.profile.id;
    if (!me) return;
    buzz();
    claimAction.mutate({ p_id: a.id, me });
  };

  return { complete, claim, celebration, closeCelebration: () => setCelebration(null) };
}
```

Note: `useAction<A extends Record<string, unknown>>` sends every key of `A` to the RPC. `claim_assignment` takes only `p_id`, so strip `me` before the call — change `mutationFn` in `src/lib/state.ts` to drop keys that don't start with `p_`:

```ts
mutationFn: (args: A) => rpc(fn, Object.fromEntries(Object.entries(args).filter(([k]) => k.startsWith('p_')))),
```

`src/features/chores/WhySheet.tsx`:

```tsx
import { Lock } from 'lucide-react';
import { balanceSentence, reasonText } from '@domain/copy.ts';
import { weekStartOf } from '@domain/time.ts';
import { choreMap, namesOf, weekTotals } from '../../lib/selectors';
import { useMe } from '../../lib/state';
import type { Assignment } from '../../lib/types';
import { EffortChip } from '../../ui/EffortChip';
import { Sheet } from '../../ui/Sheet';
import './chores.css';

export function WhySheet({ assignment, onClose }: { assignment: Assignment | null; onClose: () => void }) {
  const { me, state } = useMe();
  if (!assignment) return null;
  const chore = choreMap(state).get(assignment.chore_id);
  const names = namesOf(state);
  const totals = weekTotals(state, weekStartOf(assignment.day));
  const max = Math.max(1, ...Object.values(totals));
  const people = [...state.members].sort((a, b) => a.name.localeCompare(b.name)); // alphabetical: a picture of the week, never a ranking

  return (
    <Sheet open onClose={onClose} title={chore?.name ?? 'Chore'}>
      <div className="why">
        <EffortChip effort={assignment.effort} size="md" />
        <p className="why__reason">{reasonText(assignment.reason, names)}</p>
        <p className="eyebrow">This week's effort</p>
        <ul className="why__bars">
          {people.map((m) => (
            <li key={m.user_id}>
              <span className="why__name">{m.user_id === me ? 'You' : m.name}</span>
              <span className="why__track"><span style={{ width: `${((totals[m.user_id] ?? 0) / max) * 100}%`, background: m.color }} /></span>
              <span className="why__pts">{totals[m.user_id] ?? 0} pts</span>
            </li>
          ))}
        </ul>
        <p className="why__private"><Lock size={14} aria-hidden /> {balanceSentence(state.balance)} Only you can see this.</p>
      </div>
    </Sheet>
  );
}
```

`src/features/chores/Celebration.tsx`:

```tsx
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { Sprout } from '../../ui/Sprout';

const COPY = {
  all_done: { title: 'Wonderful job.', body: "That's everything for today. The house noticed." },
  covered: { title: 'Thanks for covering.', body: 'You took one off a roommate’s plate — it evens out next week.' },
};

export function Celebration({ kind, onClose }: { kind: 'all_done' | 'covered' | null; onClose: () => void }) {
  if (!kind) return null;
  const c = COPY[kind];
  return (
    <Sheet open onClose={onClose} title={c.title}>
      <div className="celebrate">
        <div className="celebrate__sprout"><Sprout size={72} grow={1.15} /></div>
        <p>{c.body}</p>
        <Button block onClick={onClose}>Close</Button>
      </div>
    </Sheet>
  );
}
```

`src/features/chores/chores.css`:

```css
.why { display: grid; gap: 14px; justify-items: start; }
.why__reason { font: 600 19px/1.35 var(--font-ui); }
.why__bars { list-style: none; margin: 0; padding: 0; width: 100%; display: grid; gap: 10px; }
.why__bars li { display: grid; grid-template-columns: 64px 1fr 52px; align-items: center; gap: 10px; }
.why__name { font-weight: 600; font-size: 14px; }
.why__track { height: 10px; background: var(--surface); border-radius: 10px; overflow: hidden; }
.why__track span { display: block; height: 100%; border-radius: 10px; filter: saturate(1.6) brightness(.92); }
.why__pts { font-size: 13px; color: var(--muted); text-align: right; }
.why__private { display: flex; gap: 6px; align-items: center; font-size: 14px; color: var(--muted); padding: 12px 14px; background: var(--surface); border-radius: 14px; width: 100%; }
.celebrate { display: grid; gap: 18px; justify-items: center; text-align: center; padding-bottom: 6px; }
.celebrate__sprout { width: 120px; height: 120px; border-radius: 50%; background: var(--light-bg); display: grid; place-items: center; animation: pop .5s var(--ease); }
@keyframes pop { from { transform: scale(.6); opacity: 0; } }
.section { margin-top: 28px; display: grid; gap: 10px; }
.section__title { display: flex; justify-content: space-between; align-items: baseline; }
.claim-btn { min-height: 40px; padding: 0 18px; border-radius: var(--radius-pill); border: 0; background: var(--navy); color: #fff; font-weight: 600; cursor: pointer; }
.task--pool .task__card { background: #fff7ed; border-color: transparent; }
```

- [ ] **Step 4: Implement `src/features/home/Home.tsx`**

```tsx
import { Bell, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { DAY_NAMES, weekdayOf } from '@domain/time.ts';
import { choreMap, myTasksOn, nextUp, pendingDraft, pool, roommates, unreadCount } from '../../lib/selectors';
import { useMe } from '../../lib/state';
import type { Assignment } from '../../lib/types';
import { Avatar } from '../../ui/Avatar';
import { EmptyState } from '../../ui/EmptyState';
import { Sprout } from '../../ui/Sprout';
import { TaskRow } from '../../ui/TaskRow';
import { Celebration } from '../chores/Celebration';
import { useChoreActions } from '../chores/useChoreActions';
import { WhySheet } from '../chores/WhySheet';
import './home.css';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning ✨' : h < 17 ? 'Good afternoon ☀️' : 'Good evening 🌙';
};

export default function Home() {
  const { me, state } = useMe();
  const { complete, celebration, closeCelebration } = useChoreActions();
  const [why, setWhy] = useState<Assignment | null>(null);
  const chores = choreMap(state);
  const tasks = myTasksOn(state, me, state.today);
  const upFor = pool(state, me);
  const next = nextUp(state, me, state.today);
  const draft = pendingDraft(state);
  const unread = unreadCount(state, me);
  const streak = state.streak?.current ?? 0;
  const first = state.profile.name.split(' ')[0];

  return (
    <main className="screen home">
      <header className="home__header">
        <div>
          <p className="muted">{greeting()}</p>
          <h1>Hello, {first}.</h1>
        </div>
        <Link to="/activity" className="icon-btn home__bell" aria-label={unread ? `Activity, ${unread} new` : 'Activity'}>
          <Bell size={20} aria-hidden />{unread > 0 && <span className="dot" aria-hidden />}
        </Link>
      </header>

      <section className="streak" aria-label="Household streak">
        <div>
          <p className="streak__label">Clean streak</p>
          <p className="streak__value"><span className="streak__num">{streak}</span> <span>day{streak === 1 ? '' : 's'} in a row</span></p>
          <p className="streak__sub">{streak > 0 ? 'Kept together, by everyone.' : 'Finish today together to start one.'}</p>
        </div>
        <Sprout size={84} grow={1 + Math.min(streak, 14) / 28} />
      </section>

      <ul className="mates" aria-label="Roommates today">
        {roommates(state, state.today).map((m) => (
          <li key={m.user_id} className="mate" style={{ background: m.color }}>
            <Avatar name={m.name} color="#ffffffaa" size={36} />
            <strong>{m.user_id === me ? 'You' : m.name}</strong>
            <span>{m.today} task{m.today === 1 ? '' : 's'}</span>
          </li>
        ))}
      </ul>

      {draft && !draft.approved_by.includes(me) && (
        <Link to="/plan" className="banner banner--plan"><CalendarDays size={18} aria-hidden /> Next week's plan is ready — take a look</Link>
      )}

      <section className="section" aria-label="Today's tasks">
        <h2>Today's Tasks</h2>
        {tasks.length === 0 ? (
          <EmptyState title="No tasks today." body="Enjoy it." />
        ) : tasks.map((a) => {
          const chore = chores.get(a.chore_id);
          if (!chore) return null;
          return (
            <TaskRow key={a.id} chore={chore} assignment={a} onComplete={() => complete(a)} onOpen={() => setWhy(a)}
              note={a.claimed_by === me && a.user_id !== me ? 'Covering' : undefined} />
          );
        })}
      </section>

      {upFor.length > 0 && (
        <Link to="/chores" className="banner banner--pool">🙌 {upFor.length} chore{upFor.length === 1 ? '' : 's'} up for grabs</Link>
      )}

      {next && chores.get(next.chore_id) && (
        <div className="next-up">
          <span aria-hidden>📅</span>
          <div>
            <strong>Next up: {chores.get(next.chore_id)!.name}</strong>
            <p className="muted">{DAY_NAMES[weekdayOf(next.day)]}</p>
          </div>
        </div>
      )}

      <WhySheet assignment={why} onClose={() => setWhy(null)} />
      <Celebration kind={celebration} onClose={closeCelebration} />
    </main>
  );
}
```

`src/features/home/home.css`:

```css
.home__header { display: flex; justify-content: space-between; align-items: flex-start; }
.home__header h1 { font-size: 34px; margin-top: 4px; }
.home__bell { position: relative; text-decoration: none; color: var(--ink); }
.dot { position: absolute; top: 9px; right: 10px; width: 9px; height: 9px; border-radius: 50%; background: #f97316; border: 2px solid var(--surface); }
.streak { margin-top: 22px; display: flex; justify-content: space-between; align-items: center; padding: 22px 24px; border-radius: var(--radius-l); background: linear-gradient(135deg, #e9d5ff, #c4b5fd); color: #3b2370; }
.streak__label { font: 700 12px/1 var(--font-ui); letter-spacing: .1em; text-transform: uppercase; opacity: .8; }
.streak__value { display: flex; align-items: baseline; gap: 10px; margin-top: 8px; font-weight: 600; }
.streak__num { font: 700 56px/1 var(--font-display); }
.streak__sub { font-size: 13px; opacity: .8; margin-top: 4px; }
.mates { list-style: none; margin: 16px -20px 0; padding: 0 20px 4px; display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; }
.mate { flex: 0 0 31%; min-width: 104px; scroll-snap-align: start; display: grid; justify-items: center; gap: 4px; padding: 14px 8px; border-radius: var(--radius-m); font-size: 13px; color: var(--ink-2); }
.mate strong { font-size: 15px; color: var(--ink); }
.banner { display: flex; gap: 8px; align-items: center; margin-top: 18px; padding: 14px 16px; border-radius: var(--radius-m); text-decoration: none; font-weight: 600; min-height: var(--tap); }
.banner--plan { background: var(--lav); color: var(--lav-ink); }
.banner--pool { background: #fff7ed; color: var(--heavy-ink); }
.next-up { margin-top: 18px; display: flex; gap: 12px; align-items: center; padding: 16px; border-radius: var(--radius-m); background: #fff7ed; }
```

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run src/features/home src/lib`
Expected: PASS (Home 6, plus Task 10 lib tests still passing after the `mutationFn` change).

- [ ] **Step 6: Commit**

```bash
git add src/features/home src/features/chores src/lib/state.ts
git commit -m "feat(home): today, household streak, roommates and explainable tasks"
```

---

### Task 14: Chores tab — today, the week, the claim pool, adding chores

**Files:**
- Create: `src/features/chores/AddChoreSheet.tsx`
- Modify (replace placeholder): `src/features/chores/Chores.tsx`
- Modify: `src/features/chores/chores.css` (append styles below)
- Test: `src/features/chores/Chores.test.tsx`

**Interfaces:**
- Consumes: `useChoreActions`, `WhySheet`, `Celebration` (Task 13); `useAction`, `planNow`, `rpc`, `STATE_KEY`, `useMe` (Task 10); selectors (Task 10); `pendingDraft` (Task 10); RPCs `add_chore`, `archive_chore`, `claim_assignment` (Task 8).
- Produces: `<AddChoreSheet open onClose />`.

- [ ] **Step 1: Write the failing tests `src/features/chores/Chores.test.tsx`**

```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import Chores from './Chores';

const db = vi.hoisted(() => ({
  rpc: vi.fn(async (fn: string) => ({ data: fn === 'add_chore' ? 'new-chore' : null, error: null })),
  functions: { invoke: vi.fn(async () => ({ data: null, error: null })) },
}));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

test('missed by roommates can be claimed, and moves into my tasks', async () => {
  renderWithState(<Chores />, { state: fixture(), route: '/chores' });
  const pool = screen.getByRole('region', { name: 'Missed by roommates' });
  await userEvent.click(within(pool).getByRole('button', { name: 'Claim Mop bathroom floor' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('claim_assignment', { p_id: 'a-missed' }));
  expect(within(screen.getByRole('region', { name: 'My tasks' })).getByText('Mop bathroom floor')).toBeInTheDocument();
});

test('this week lists my days with their chores', async () => {
  const s = fixture();
  s.assignments.push({ ...s.assignments[0], id: 'a-fri', day: '2026-10-02' });
  renderWithState(<Chores />, { state: s, route: '/chores' });
  await userEvent.click(screen.getByRole('tab', { name: 'This week' }));
  expect(screen.getByRole('heading', { name: /friday/i })).toBeInTheDocument();
});

test('adding a chore asks for effort first, then plans it into this week', async () => {
  renderWithState(<Chores />, { state: fixture(), route: '/chores' });
  await userEvent.click(screen.getByRole('button', { name: 'Add chore' }));
  const sheet = await screen.findByRole('dialog', { name: 'Add new chore' });
  await userEvent.click(within(sheet).getByRole('radio', { name: 'Heavy' }));
  await userEvent.type(within(sheet).getByLabelText('Chore name'), 'Deep clean fridge');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Add to rotation' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('add_chore', { p_name: 'Deep clean fridge', p_icon: '🧽', p_effort: 3, p_cadence: 'weekly' }));
  await waitFor(() => expect(db.functions.invoke).toHaveBeenCalledWith('tick', { body: { choreId: 'new-chore' } }));
});

test('all chores lists the household’s chores with effort', async () => {
  renderWithState(<Chores />, { state: fixture(), route: '/chores' });
  await userEvent.click(screen.getByRole('tab', { name: 'All chores' }));
  const list = screen.getByRole('list', { name: 'Household chores' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(3);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/chores`
Expected: FAIL — placeholder Chores.

- [ ] **Step 3: Implement `src/features/chores/AddChoreSheet.tsx`**

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { errorText } from '@domain/copy.ts';
import type { Cadence, Effort } from '@domain/types.ts';
import { planNow, rpc, RpcError, STATE_KEY } from '../../lib/state';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';

const ICONS = ['🧽', '🧹', '🪣', '🧺', '🗑️', '♻️', '🍽️', '🫙', '🚿', '🪴'];
const EFFORTS: { value: Effort; label: string }[] = [{ value: 1, label: 'Light' }, { value: 2, label: 'Medium' }, { value: 3, label: 'Heavy' }];
const CADENCES: { value: Cadence; label: string }[] = [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Bi-weekly' }];

export function AddChoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [effort, setEffort] = useState<Effort | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [cadence, setCadence] = useState<Cadence>('weekly');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!effort || !name.trim()) return;
    setBusy(true);
    try {
      const id = await rpc<string>('add_chore', { p_name: name.trim(), p_icon: icon, p_effort: effort, p_cadence: cadence });
      await planNow(id).catch(() => {});
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show('Added to the rotation.');
      setName(''); setEffort(null); onClose();
    } catch (err) {
      toast.show(errorText(err instanceof RpcError ? err.code : 'unknown'));
    } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add new chore">
      <form className="add-chore" onSubmit={submit}>
        <p className="eyebrow">Effort level</p>
        <div className="seg seg--effort" role="radiogroup" aria-label="Effort level">
          {EFFORTS.map((x) => (
            <button key={x.value} type="button" role="radio" aria-checked={effort === x.value}
              className={`chip chip--md chip--${x.label.toLowerCase()}${effort === x.value ? ' is-on' : ''}`} onClick={() => setEffort(x.value)}>
              {x.label}
            </button>
          ))}
        </div>
        <label className="field">
          <span className="field__label">Chore name</span>
          <span className="field__control"><input maxLength={40} placeholder="e.g., Vacuum rugs" value={name} onChange={(e) => setName(e.target.value)} aria-label="Chore name" /></span>
        </label>
        <p className="eyebrow">Choose icon</p>
        <div className="icons" role="radiogroup" aria-label="Icon">
          {ICONS.map((i) => (
            <button key={i} type="button" role="radio" aria-checked={icon === i} aria-label={`Icon ${i}`} className={`icon-pick${icon === i ? ' is-on' : ''}`} onClick={() => setIcon(i)}>{i}</button>
          ))}
        </div>
        <p className="eyebrow">Rotation</p>
        <div className="seg" role="radiogroup" aria-label="How often">
          {CADENCES.map((c) => (
            <button key={c.value} type="button" role="radio" aria-checked={cadence === c.value} className={`seg__opt${cadence === c.value ? ' is-on' : ''}`} onClick={() => setCadence(c.value)}>{c.label}</button>
          ))}
        </div>
        <p className="muted add-chore__note">Roomie assigns it fairly — heavy chores never land on someone's busy day.</p>
        <Button block type="submit" loading={busy} disabled={!effort || !name.trim()}>Add to rotation</Button>
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 4: Implement `src/features/chores/Chores.tsx`**

```tsx
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { DAY_NAMES, weekdayOf, weekStartOf } from '@domain/time.ts';
import { choreMap, myTasksOn, namesOf, pendingDraft, pool, weekDates } from '../../lib/selectors';
import { useAction, useMe } from '../../lib/state';
import type { Assignment, Chore } from '../../lib/types';
import { EffortChip } from '../../ui/EffortChip';
import { EmptyState } from '../../ui/EmptyState';
import { Sheet } from '../../ui/Sheet';
import { TaskRow } from '../../ui/TaskRow';
import { Button } from '../../ui/Button';
import { AddChoreSheet } from './AddChoreSheet';
import { Celebration } from './Celebration';
import { useChoreActions } from './useChoreActions';
import { WhySheet } from './WhySheet';
import './chores.css';

type Tab = 'today' | 'week' | 'all';
const CADENCE: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks' };

export default function Chores() {
  const { me, state } = useMe();
  const { complete, claim, celebration, closeCelebration } = useChoreActions();
  const [tab, setTab] = useState<Tab>('today');
  const [why, setWhy] = useState<Assignment | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Chore | null>(null);
  const archive = useAction<{ p_id: string }>('archive_chore', {
    optimistic: (s, { p_id }) => ({ ...s, chores: s.chores.filter((c) => c.id !== p_id) }),
  });
  const chores = choreMap(state);
  const names = namesOf(state);
  const draft = pendingDraft(state);
  const row = (a: Assignment, opts: { pool?: boolean } = {}) => {
    const chore = chores.get(a.chore_id);
    if (!chore) return null;
    if (opts.pool) {
      return (
        <div key={a.id} className="task--pool">
          <TaskRow chore={chore} assignment={a} note={`${DAY_NAMES[weekdayOf(a.day)].slice(0, 3)}`}
            action={<button className="claim-btn" onClick={() => claim(a)} aria-label={`Claim ${chore.name}`}>Claim</button>} />
        </div>
      );
    }
    return <TaskRow key={a.id} chore={chore} assignment={a} onComplete={() => complete(a)} onOpen={() => setWhy(a)}
      note={a.claimed_by === me && a.user_id !== me ? `Covering ${names[a.user_id] ?? ''}`.trim() : undefined} />;
  };

  return (
    <main className="screen chores">
      <h1>To-do</h1>
      <div className="seg seg--tabs" role="tablist" aria-label="Chores view">
        {([['today', 'Today'], ['week', 'This week'], ['all', 'All chores']] as const).map(([value, label]) => (
          <button key={value} role="tab" aria-selected={tab === value} className={`seg__opt${tab === value ? ' is-on' : ''}`} onClick={() => setTab(value)}>{label}</button>
        ))}
      </div>

      {draft && !draft.approved_by.includes(me) && (
        <Link to="/plan" className="banner banner--plan">Next week's plan is ready — review it</Link>
      )}

      {tab === 'today' && (
        <>
          <section className="section" aria-label="My tasks">
            <p className="eyebrow eyebrow--warm">My tasks</p>
            {myTasksOn(state, me, state.today).length === 0
              ? <EmptyState title="Nothing on your list today." body="Enjoy it — or grab one below." />
              : myTasksOn(state, me, state.today).map((a) => row(a))}
          </section>
          <section className="section" aria-label="Missed by roommates">
            <p className="eyebrow eyebrow--warm">Missed by roommates</p>
            {pool(state, me).length === 0
              ? <p className="muted">Nothing waiting. The house is on it.</p>
              : pool(state, me).map((a) => row(a, { pool: true }))}
          </section>
        </>
      )}

      {tab === 'week' && weekDates(weekStartOf(state.today)).filter((d) => d >= state.today).map((d) => {
        const list = myTasksOn(state, me, d);
        return (
          <section key={d} className="section" aria-label={DAY_NAMES[weekdayOf(d)]}>
            <h2 className="day-title">{d === state.today ? 'Today' : DAY_NAMES[weekdayOf(d)]}{d !== state.today && <span className="sr-only"> {d}</span>}</h2>
            {list.length === 0 ? <p className="muted">Free day.</p> : list.map((a) => row(a))}
          </section>
        );
      })}

      {tab === 'all' && (
        <ul className="chore-list" aria-label="Household chores">
          {state.chores.map((c) => (
            <li key={c.id}>
              <button className="chore-item" onClick={() => setEditing(c)}>
                <span className="task__icon" aria-hidden>{c.icon}</span>
                <span className="chore-item__name">{c.name}<small className="muted">{CADENCE[c.cadence]}</small></span>
                <EffortChip effort={c.effort} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="fab" onClick={() => setAdding(true)} aria-label="Add chore"><Plus size={26} aria-hidden /></button>
      <AddChoreSheet open={adding} onClose={() => setAdding(false)} />
      <Sheet open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.name ?? ''}>
        {editing && (
          <div className="why">
            <EffortChip effort={editing.effort} size="md" />
            <p className="muted">{CADENCE[editing.cadence]} · shared fairly by effort.</p>
            <Button variant="danger" block onClick={() => { archive.mutate({ p_id: editing.id }); setEditing(null); }}>Remove chore</Button>
          </div>
        )}
      </Sheet>
      <WhySheet assignment={why} onClose={() => setWhy(null)} />
      <Celebration kind={celebration} onClose={closeCelebration} />
    </main>
  );
}
```

Append to `src/features/chores/chores.css`:

```css
.chores h1 { font-size: 36px; }
.eyebrow--warm { color: var(--heavy-ink); }
.seg { display: flex; gap: 6px; padding: 4px; border-radius: var(--radius-pill); background: var(--surface); margin-top: 14px; }
.seg__opt { flex: 1; min-height: 40px; border: 0; border-radius: var(--radius-pill); background: transparent; font-weight: 600; color: var(--muted); cursor: pointer; }
.seg__opt.is-on { background: #fff; color: var(--ink); box-shadow: var(--shadow-card); }
.seg--effort { background: none; padding: 0; margin-top: 0; }
.seg--effort .chip { flex: 1; justify-content: center; border: 2px solid transparent; cursor: pointer; min-height: 44px; }
.seg--effort .chip.is-on { border-color: currentColor; }
.day-title { font-size: 20px; }
.chore-list { list-style: none; padding: 0; margin: 20px 0 0; display: grid; gap: 10px; }
.chore-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-m); border: 1px solid var(--line); background: #fff; text-align: left; cursor: pointer; }
.chore-item__name { flex: 1; display: grid; font-weight: 600; }
.chore-item__name small { font-weight: 400; }
.fab { position: fixed; right: max(20px, calc(50% - 240px)); bottom: calc(var(--safe-bottom) + 96px); width: 60px; height: 60px; border-radius: 50%; border: 0; background: var(--lav-2); color: var(--lav-ink); box-shadow: 0 12px 28px -10px rgba(92, 59, 155, .6); display: grid; place-items: center; cursor: pointer; z-index: 30; }
.add-chore { display: grid; gap: 12px; }
.add-chore__note { font-size: 13px; }
.icons { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.icon-pick { flex: none; width: 48px; height: 48px; border-radius: 50%; border: 2px solid transparent; background: var(--surface); font-size: 20px; cursor: pointer; }
.icon-pick.is-on { border-color: var(--lav-ink); background: var(--lav); }
```

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run src/features/chores`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/chores
git commit -m "feat(chores): today, week view, claim pool and add-chore sheet"
```

---
### Task 15: Weekly plan review and swaps

**Files:**
- Create: `src/features/plan/SwapSheet.tsx`, `src/features/plan/plan.css`
- Modify (replace placeholder): `src/features/plan/PlanReview.tsx`
- Test: `src/features/plan/plan.test.tsx`

**Interfaces:**
- Consumes: `useMe`, `useAction` (Task 10); selectors `namesOf`, `choreMap`, `pendingDraft`, `planForWeek`, `weekTotals`, `incomingSwaps` (Task 10); `swapDelta` (Task 4); `DAY_NAMES`, `weekdayOf`, `weekStartOf`, `addDays` (Task 2); RPCs `approve_plan`, `request_swap`, `respond_swap` (Task 8).
- Produces: `<SwapSheet open planId onClose />`.

- [ ] **Step 1: Write the failing tests `src/features/plan/plan.test.tsx`**

```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import type { AppState } from '../../lib/types';
import PlanReview from './PlanReview';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

const withDraft = (): AppState => {
  const s = fixture();
  s.plans.push({ id: 'plan-next', week_start: '2026-10-05', status: 'draft', lock_at: '2026-10-04T12:15:00Z', approved_by: ['p'] });
  const base = { plan_id: 'plan-next', status: 'todo' as const, claimed_by: null, done_at: null, reason: { code: 'credit' as const } };
  s.assignments.push(
    { ...base, id: 'n-mine', chore_id: 'c-trash', user_id: 'me', day: '2026-10-06', effort: 1 },
    { ...base, id: 'n-theirs', chore_id: 'c-bath', user_id: 'p', day: '2026-10-07', effort: 3 },
  );
  return s;
};

test('shows next week’s draft with each person’s points and approves it', async () => {
  renderWithState(<PlanReview />, { state: withDraft(), route: '/plan' });
  expect(screen.getByRole('heading', { name: 'Next week' })).toBeInTheDocument();
  expect(screen.getByText(/draft · locks sunday 6 pm/i)).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Priya' })).toHaveTextContent('3 pts');
  await userEvent.click(screen.getByRole('button', { name: 'Looks good' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('approve_plan', { p_plan: 'plan-next' }));
  expect(await screen.findByText(/you approved/i)).toBeInTheDocument();
});

test('incoming swap requests can be accepted', async () => {
  const s = withDraft();
  s.swaps = [{ id: 'sw1', from_assignment: 'n-theirs', to_assignment: 'n-mine', from_user: 'p', to_user: 'me', status: 'pending' }];
  renderWithState(<PlanReview />, { state: s, route: '/plan' });
  const card = screen.getByRole('region', { name: 'Swap request' });
  expect(card).toHaveTextContent('Priya wants to trade their Mop bathroom floor for your Take out trash');
  await userEvent.click(within(card).getByRole('button', { name: 'Accept' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('respond_swap', { p_swap: 'sw1', p_accept: true }));
});

test('requesting a swap shows the effort difference before sending', async () => {
  renderWithState(<PlanReview />, { state: withDraft(), route: '/plan' });
  await userEvent.click(screen.getByRole('button', { name: 'Request a swap' }));
  const sheet = await screen.findByRole('dialog', { name: 'Swap a chore' });
  await userEvent.click(within(sheet).getByRole('radio', { name: /take out trash · tue/i }));
  await userEvent.click(within(sheet).getByRole('radio', { name: /mop bathroom floor · wed · priya/i }));
  expect(within(sheet).getByText(/you'd take on 2 more points/i)).toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: 'Send request' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('request_swap', { p_from: 'n-mine', p_to: 'n-theirs' }));
});

test('with no draft it shows this week’s locked plan', () => {
  renderWithState(<PlanReview />, { state: fixture(), route: '/plan' });
  expect(screen.getByRole('heading', { name: 'This week' })).toBeInTheDocument();
  expect(screen.getByText('Locked')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/plan`
Expected: FAIL — placeholder.

- [ ] **Step 3: Implement `src/features/plan/SwapSheet.tsx`**

```tsx
import { useState } from 'react';
import { swapDelta } from '@domain/ledger.ts';
import { DAY_NAMES, weekdayOf } from '@domain/time.ts';
import { choreMap, namesOf } from '../../lib/selectors';
import { useAction, useMe } from '../../lib/state';
import type { Assignment } from '../../lib/types';
import { Button } from '../../ui/Button';
import { EffortChip } from '../../ui/EffortChip';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';

const short = (day: string) => DAY_NAMES[weekdayOf(day)].slice(0, 3);

export function SwapSheet({ open, planId, onClose }: { open: boolean; planId: string; onClose: () => void }) {
  const { me, state } = useMe();
  const toast = useToast();
  const chores = choreMap(state);
  const names = namesOf(state);
  const [give, setGive] = useState<Assignment | null>(null);
  const [take, setTake] = useState<Assignment | null>(null);
  const close = () => { setGive(null); setTake(null); onClose(); };
  const request = useAction<{ p_from: string; p_to: string }>('request_swap', {
    onSuccess: () => { toast.show('Swap request sent.'); close(); },
  });
  const open_ = (a: Assignment) => a.plan_id === planId && a.status === 'todo' && a.day >= state.today;
  const mine = state.assignments.filter((a) => open_(a) && a.user_id === me);
  const theirs = state.assignments.filter((a) => open_(a) && a.user_id !== me);
  const delta = give && take ? swapDelta(give.effort, take.effort) : null;
  const pts = (n: number) => `${n} more point${n === 1 ? '' : 's'}`;

  const option = (a: Assignment, selected: boolean, onPick: () => void, withName: boolean) => {
    const chore = chores.get(a.chore_id);
    const label = `${chore?.name} · ${short(a.day)}${withName ? ` · ${names[a.user_id]}` : ''}`;
    return (
      <button key={a.id} type="button" role="radio" aria-checked={selected} aria-label={label}
        className={`swap-opt${selected ? ' is-on' : ''}`} onClick={onPick}>
        <span aria-hidden>{chore?.icon}</span>
        <span className="swap-opt__name">{chore?.name}<small className="muted">{short(a.day)}{withName ? ` · ${names[a.user_id]}` : ''}</small></span>
        <EffortChip effort={a.effort} />
      </button>
    );
  };

  return (
    <Sheet open={open} onClose={close} title="Swap a chore">
      <div className="swap">
        <p className="eyebrow">1 · One of yours</p>
        <div role="radiogroup" aria-label="Your chore" className="swap__list">
          {mine.length === 0 ? <p className="muted">You have no upcoming chores to trade.</p> : mine.map((a) => option(a, give?.id === a.id, () => setGive(a), false))}
        </div>
        {give && (
          <>
            <p className="eyebrow">2 · Trade it for</p>
            <div role="radiogroup" aria-label="Their chore" className="swap__list">
              {theirs.map((a) => option(a, take?.id === a.id, () => setTake(a), true))}
            </div>
          </>
        )}
        {delta !== null && (
          <p className="swap__delta">
            {delta > 0 ? `You'd take on ${pts(delta)} — your balance gets the credit.`
              : delta < 0 ? `You'd hand off ${Math.abs(delta)} point${delta === -1 ? '' : 's'} — it evens out next week.`
              : 'An even trade.'}
          </p>
        )}
        <Button block disabled={!give || !take} loading={request.isPending}
          onClick={() => give && take && request.mutate({ p_from: give.id, p_to: take.id })}>Send request</Button>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 4: Implement `src/features/plan/PlanReview.tsx`**

```tsx
import { ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { addDays, DAY_NAMES, weekdayOf, weekStartOf } from '@domain/time.ts';
import { choreMap, incomingSwaps, namesOf, pendingDraft, planForWeek, weekTotals } from '../../lib/selectors';
import { useAction, useMe } from '../../lib/state';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { EffortChip } from '../../ui/EffortChip';
import { EmptyState } from '../../ui/EmptyState';
import { useToast } from '../../ui/Toast';
import { SwapSheet } from './SwapSheet';
import './plan.css';

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export default function PlanReview() {
  const { me, state } = useMe();
  const navigate = useNavigate();
  const toast = useToast();
  const [swapping, setSwapping] = useState(false);
  const names = namesOf(state);
  const chores = choreMap(state);
  const thisWeek = weekStartOf(state.today);
  const plan = pendingDraft(state) ?? planForWeek(state, thisWeek);

  const approve = useAction<{ p_plan: string; me: string }>('approve_plan', {
    optimistic: (s, { p_plan, me: who }) => ({ ...s, plans: s.plans.map((p) => (p.id === p_plan ? { ...p, approved_by: [...p.approved_by, who] } : p)) }),
    onSuccess: () => toast.show("Thanks — you're in."),
  });
  const respond = useAction<{ p_swap: string; p_accept: boolean }>('respond_swap', {
    optimistic: (s, { p_swap }) => ({ ...s, swaps: s.swaps.filter((w) => w.id !== p_swap) }),
  });

  if (!plan) {
    return (
      <main className="screen">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
        <EmptyState title="No plan yet." body="Your first plan arrives a few minutes after the home is set up." />
      </main>
    );
  }

  const isDraft = plan.status === 'draft';
  const approved = plan.approved_by.includes(me);
  const waiting = state.members.filter((m) => !plan.approved_by.includes(m.user_id) && m.user_id !== me).length;
  const totals = weekTotals(state, plan.week_start);
  const rows = state.assignments.filter((a) => a.plan_id === plan.id && a.status !== 'expired');
  const people = [...state.members].sort((a, b) => (a.user_id === me ? -1 : b.user_id === me ? 1 : a.name.localeCompare(b.name)));

  return (
    <main className="screen plan">
      <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
      <p className="eyebrow">{isDraft ? 'Draft · locks Sunday 6 pm' : 'Locked'}</p>
      <h1>{plan.week_start > thisWeek ? 'Next week' : 'This week'}</h1>
      <p className="muted">{fmt(plan.week_start)} – {fmt(addDays(plan.week_start, 6))} · balanced by effort, busy days respected</p>

      {incomingSwaps(state, me).map((w) => {
        const theirs = state.assignments.find((a) => a.id === w.from_assignment);
        const mine = state.assignments.find((a) => a.id === w.to_assignment);
        return (
          <section key={w.id} className="swap-card" aria-label="Swap request">
            <p>{names[w.from_user]} wants to trade their {chores.get(theirs?.chore_id ?? '')?.name} for your {chores.get(mine?.chore_id ?? '')?.name}</p>
            <div className="swap-card__actions">
              <Button variant="ghost" onClick={() => respond.mutate({ p_swap: w.id, p_accept: false })}>Decline</Button>
              <Button variant="secondary" onClick={() => respond.mutate({ p_swap: w.id, p_accept: true })}>Accept</Button>
            </div>
          </section>
        );
      })}

      {people.map((m) => (
        <section key={m.user_id} className="person" aria-label={m.user_id === me ? 'You' : m.name}>
          <header className="person__head">
            <Avatar name={m.name} color={m.color} size={36} />
            <strong>{m.user_id === me ? 'You' : m.name}</strong>
            <span className="person__pts">{totals[m.user_id] ?? 0} pts</span>
            {isDraft && plan.approved_by.includes(m.user_id) && <Check size={16} aria-label="approved" className="person__ok" />}
          </header>
          <ul className="person__list">
            {rows.filter((a) => a.user_id === m.user_id).sort((a, b) => a.day.localeCompare(b.day)).map((a) => (
              <li key={a.id}>
                <span className="person__day">{DAY_NAMES[weekdayOf(a.day)].slice(0, 3)}</span>
                <span aria-hidden>{chores.get(a.chore_id)?.icon}</span>
                <span className="person__chore">{chores.get(a.chore_id)?.name}</span>
                <EffortChip effort={a.effort} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="plan__footer">
        {isDraft && approved && <p className="plan__status">You approved{waiting ? ` · waiting for ${waiting} more` : ' · locking soon'}</p>}
        <div className="plan__buttons">
          <Button variant="secondary" onClick={() => setSwapping(true)}>{isDraft ? 'Request a swap' : 'Swap a chore'}</Button>
          {isDraft && !approved && <Button onClick={() => approve.mutate({ p_plan: plan.id, me })}>Looks good</Button>}
        </div>
      </div>
      <SwapSheet open={swapping} planId={plan.id} onClose={() => setSwapping(false)} />
    </main>
  );
}
```

`src/features/plan/plan.css`:

```css
.plan h1 { margin: 6px 0 4px; }
.person { margin-top: 22px; padding: 16px; border: 1px solid var(--line); border-radius: var(--radius-l); }
.person__head { display: flex; align-items: center; gap: 10px; }
.person__pts { margin-left: auto; font-weight: 600; color: var(--muted); }
.person__ok { color: var(--light-ink); }
.person__list { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 8px; }
.person__list li { display: grid; grid-template-columns: 36px 24px 1fr auto; align-items: center; gap: 8px; }
.person__day { font-size: 13px; font-weight: 600; color: var(--muted); }
.person__chore { font-weight: 500; }
.plan__footer { position: sticky; bottom: calc(var(--safe-bottom) + 12px); margin-top: 24px; padding: 12px; background: rgba(255, 255, 255, .92); backdrop-filter: blur(12px); border-radius: var(--radius-l); box-shadow: var(--shadow-card); display: grid; gap: 8px; }
.plan__buttons { display: grid; grid-auto-flow: column; gap: 8px; }
.plan__status { text-align: center; color: var(--light-ink); font-weight: 600; }
.swap-card { margin-top: 18px; padding: 16px; border-radius: var(--radius-l); background: var(--lav); color: var(--lav-ink); display: grid; gap: 12px; }
.swap-card__actions { display: flex; gap: 8px; justify-content: flex-end; }
.swap { display: grid; gap: 12px; }
.swap__list { display: grid; gap: 8px; }
.swap-opt { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-m); border: 1.5px solid var(--line); background: #fff; text-align: left; cursor: pointer; min-height: 56px; }
.swap-opt.is-on { border-color: var(--lav-ink); background: var(--lav); }
.swap-opt__name { flex: 1; display: grid; font-weight: 600; }
.swap-opt__name small { font-weight: 400; }
.swap__delta { padding: 12px 14px; border-radius: 14px; background: var(--surface); font-weight: 600; }
```

- [ ] **Step 5: Run to verify they pass**

Run: `npx vitest run src/features/plan`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/plan
git commit -m "feat(plan): review next week, approve, and swap with effort shown"
```

---

### Task 16: Profile and household settings

**Files:**
- Create: `src/features/profile/profile.css`, `src/features/primer/NotificationsRow.tsx` (placeholder returning `null`; filled in by Task 17)
- Modify (replace placeholders): `src/features/profile/Profile.tsx`, `src/features/profile/HouseholdSettings.tsx`
- Test: `src/features/profile/profile.test.tsx`

**Interfaces:**
- Consumes: `useMe`, `useAction`, `rpc`, `STATE_KEY` (Task 10); `signOut` (Task 10); `PASTELS`, `DAY_SHORT` (Task 12); `balanceSentence`, `nudge` (Task 5); `DAY_NAMES`, `Weekday` (Task 2); RPCs `update_profile`, `update_busy_days`, `remove_member`, `leave_household`, `update_household`, `rotate_invite_code` (Task 8).
- Produces: `<NotificationsRow />` slot (Task 17 replaces the file).

- [ ] **Step 1: Write the failing tests `src/features/profile/profile.test.tsx`**

```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import HouseholdSettings from './HouseholdSettings';
import Profile from './Profile';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })), auth: { signOut: vi.fn() } }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

test('shows my private balance in words, never a rank', () => {
  renderWithState(<Profile />, { state: fixture({ balance: 2 }), route: '/profile' });
  expect(screen.getByText("You'll pick up 2 extra points over the next week.")).toBeInTheDocument();
  expect(screen.getByText(/only you can see this/i)).toBeInTheDocument();
  expect(screen.queryByText(/rank|#1|leaderboard/i)).toBeNull();
});

test('changing nudge style saves immediately', async () => {
  renderWithState(<Profile />, { state: fixture(), route: '/profile' });
  await userEvent.click(screen.getByRole('radio', { name: /just the facts/i }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('update_profile', { p_nudge: 'facts' }));
  expect(screen.getByRole('radio', { name: /just the facts/i })).toHaveAttribute('aria-checked', 'true');
});

test('toggling a busy day saves the new set', async () => {
  renderWithState(<Profile />, { state: fixture(), route: '/profile' });
  await userEvent.click(screen.getByRole('checkbox', { name: 'Wednesday' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('update_busy_days', { p_days: [0] }));
});

test('the owner can remove a roommate after confirming', async () => {
  renderWithState(<Profile />, { state: fixture(), route: '/profile' });
  await userEvent.click(screen.getByRole('button', { name: 'Remove Priya' }));
  const sheet = await screen.findByRole('dialog', { name: 'Remove Priya?' });
  await userEvent.click(within(sheet).getByRole('button', { name: 'Remove' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('remove_member', { p_user: 'p' }));
});

test('leaving asks first, then leaves', async () => {
  renderWithState(<Profile />, { state: fixture(), route: '/profile' });
  await userEvent.click(screen.getByRole('button', { name: 'Leave household' }));
  const sheet = await screen.findByRole('dialog', { name: 'Leave Flat 4B?' });
  await userEvent.click(within(sheet).getByRole('button', { name: 'Leave' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('leave_household', undefined));
});

test('household settings: switch to automatic plans', async () => {
  renderWithState(<HouseholdSettings />, { state: fixture(), route: '/profile/household' });
  await userEvent.click(screen.getByRole('radio', { name: /apply automatically/i }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('update_household', { p_plan_mode: 'auto' }));
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/profile`
Expected: FAIL — placeholders.

- [ ] **Step 3: Implement**

`src/features/primer/NotificationsRow.tsx` (placeholder):

```tsx
export function NotificationsRow() {
  return null;
}
```

`src/features/profile/Profile.tsx`:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Lock } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { balanceSentence, errorText, nudge } from '@domain/copy.ts';
import { DAY_NAMES, type Weekday } from '@domain/time.ts';
import type { NudgeStyle } from '@domain/types.ts';
import { rpc, RpcError, STATE_KEY, useAction, useMe } from '../../lib/state';
import type { Member } from '../../lib/types';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';
import { signOut } from '../auth/AuthProvider';
import { DAY_SHORT, PASTELS } from '../onboarding/draft';
import { NotificationsRow } from '../primer/NotificationsRow';
import './profile.css';

const STYLES: { value: NudgeStyle; title: string; body: string }[] = [
  { value: 'motivate', title: 'Motivate me', body: 'Warm, with streaks and emoji.' },
  { value: 'facts', title: 'Just the facts', body: 'Quiet, text only.' },
];

export default function Profile() {
  const { me, state } = useMe();
  const qc = useQueryClient();
  const toast = useToast();
  const self = state.members.find((m) => m.user_id === me)!;
  const isOwner = self.role === 'owner';
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const [color, setColor] = useState(state.profile.color);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [leaving, setLeaving] = useState(false);

  const setNudge = useAction<{ p_nudge: NudgeStyle }>('update_profile', {
    optimistic: (s, { p_nudge }) => ({ ...s, profile: { ...s.profile, nudge_style: p_nudge } }),
  });
  const setBusy = useAction<{ p_days: Weekday[] }>('update_busy_days', {
    optimistic: (s, { p_days }) => ({ ...s, members: s.members.map((m) => (m.user_id === me ? { ...m, busy_days: p_days } : m)) }),
    onSuccess: () => toast.show("Saved — applies from next week's plan."),
  });
  const remove = useAction<{ p_user: string }>('remove_member', {
    optimistic: (s, { p_user }) => ({ ...s, members: s.members.filter((m) => m.user_id !== p_user) }),
  });
  const saveProfile = useAction<{ p_name: string; p_color: string }>('update_profile', {
    optimistic: (s, { p_name, p_color }) => ({ ...s, profile: { ...s.profile, name: p_name, color: p_color } }),
  });

  const toggleDay = (d: Weekday) => {
    const days = self.busy_days.includes(d) ? self.busy_days.filter((x) => x !== d) : [...self.busy_days, d].sort((a, b) => a - b);
    setBusy.mutate({ p_days: days });
  };
  const leave = async () => {
    try {
      await rpc('leave_household');
      setLeaving(false);
      await qc.invalidateQueries({ queryKey: STATE_KEY }); // the gate sends us to create/join
    } catch (err) { toast.show(errorText(err instanceof RpcError ? err.code : 'unknown')); }
  };

  return (
    <main className="screen profile">
      <header className="profile__head">
        <Avatar name={state.profile.name} color={state.profile.color} size={72} />
        <div>
          <h1>{state.profile.name}</h1>
          <p className="muted">{state.household!.name}</p>
        </div>
        <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
      </header>

      <section className="card card--private" aria-label="Your balance">
        <p className="eyebrow"><Lock size={12} aria-hidden /> Your balance</p>
        <p className="card__big">{balanceSentence(state.balance)}</p>
        <p className="muted small">Only you can see this. It evens out through the weekly plan.</p>
      </section>

      <section className="section" aria-label="Busy days">
        <h2>Busy days</h2>
        <p className="muted">We won't assign you heavy tasks on these days.</p>
        <div className="days">
          {DAY_SHORT.map((label, i) => {
            const d = i as Weekday;
            const on = self.busy_days.includes(d);
            return (
              <label key={label} className={`day-chip${on ? ' is-on' : ''}`}>
                <input type="checkbox" checked={on} onChange={() => toggleDay(d)} aria-label={DAY_NAMES[i]} />
                {label}
              </label>
            );
          })}
        </div>
      </section>

      <section className="section" aria-label="Nudge style">
        <h2>Nudge style</h2>
        <div role="radiogroup" aria-label="Nudge style" className="styles">
          {STYLES.map((s) => {
            const on = state.profile.nudge_style === s.value;
            return (
              <button key={s.value} type="button" role="radio" aria-checked={on} aria-label={`${s.title}: ${s.body}`}
                className={`style-card${on ? ' is-on' : ''}`} onClick={() => setNudge.mutate({ p_nudge: s.value })}>
                <strong>{s.title}</strong>
                <span className="muted">{s.body}</span>
                <span className="style-card__preview">“{nudge('pool', s.value, { chore: 'Bathroom' }).body}”</span>
              </button>
            );
          })}
        </div>
      </section>

      <NotificationsRow />

      <section className="section" aria-label="Roommates">
        <h2>Roommates</h2>
        <ul className="mates-list">
          {state.members.map((m) => (
            <li key={m.user_id}>
              <Avatar name={m.name} color={m.color} size={40} />
              <span className="mates-list__name">{m.user_id === me ? `${m.name} (you)` : m.name}{m.role === 'owner' && <small className="muted"> · set up the home</small>}</span>
              {isOwner && m.user_id !== me && (
                <Button variant="ghost" onClick={() => setRemoving(m)} aria-label={`Remove ${m.name}`}>Remove</Button>
              )}
            </li>
          ))}
        </ul>
        <Link to="/onboarding/invite" className="btn btn--secondary">Invite roommates</Link>
      </section>

      <nav className="section links" aria-label="More">
        <Link to="/profile/household" className="link-row">Household settings <ChevronRight size={18} aria-hidden /></Link>
        <Link to="/activity" className="link-row">Activity <ChevronRight size={18} aria-hidden /></Link>
      </nav>

      <div className="section">
        <Button variant="ghost" onClick={() => signOut()}>Sign out</Button>
        <Button variant="danger" onClick={() => setLeaving(true)}>Leave household</Button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit profile">
        <form className="add-chore" onSubmit={(e) => { e.preventDefault(); saveProfile.mutate({ p_name: name.trim(), p_color: color }); setEditing(false); }}>
          <label className="field"><span className="field__label">Name</span>
            <span className="field__control"><input maxLength={30} value={name} onChange={(e) => setName(e.target.value)} /></span></label>
          <div className="swatches" role="radiogroup" aria-label="Your colour">
            {PASTELS.map((c) => (
              <button type="button" key={c} role="radio" aria-checked={c === color} aria-label={`Colour ${c}`}
                className={`swatch${c === color ? ' is-on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
          <Button block type="submit" disabled={!name.trim()}>Save</Button>
        </form>
      </Sheet>

      <Sheet open={Boolean(removing)} onClose={() => setRemoving(null)} title={`Remove ${removing?.name}?`}>
        <p className="muted">Their upcoming chores go to “Missed by roommates” so anyone can claim them.</p>
        <div className="sheet-actions">
          <Button variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => { remove.mutate({ p_user: removing!.user_id }); setRemoving(null); }}>Remove</Button>
        </div>
      </Sheet>

      <Sheet open={leaving} onClose={() => setLeaving(false)} title={`Leave ${state.household!.name}?`}>
        <p className="muted">Your upcoming chores go to the claim pool. You can rejoin later with the code.</p>
        <div className="sheet-actions">
          <Button variant="ghost" onClick={() => setLeaving(false)}>Stay</Button>
          <Button variant="danger" onClick={leave}>Leave</Button>
        </div>
      </Sheet>
    </main>
  );
}
```

`src/features/profile/HouseholdSettings.tsx`:

```tsx
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { rpc, useAction, useMe } from '../../lib/state';
import { useQueryClient } from '@tanstack/react-query';
import { STATE_KEY } from '../../lib/state';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import './profile.css';

const MODES = [
  { value: 'review', title: 'Review first', body: "Everyone sees next week's plan on Saturday and can swap before it locks Sunday 6 pm." },
  { value: 'auto', title: 'Apply automatically', body: "The plan locks as soon as it's made. Swaps still work." },
] as const;
const ENDS = ['20:00', '21:00', '22:00', '23:00'];

export default function HouseholdSettings() {
  const { me, state } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const h = state.household!;
  const isOwner = state.members.find((m) => m.user_id === me)?.role === 'owner';
  const [name, setName] = useState(h.name);
  const update = useAction<{ p_name?: string; p_plan_mode?: 'review' | 'auto'; p_day_ends_at?: string }>('update_household', {
    optimistic: (s, a) => ({
      ...s,
      household: {
        ...s.household!,
        ...(a.p_name ? { name: a.p_name } : {}),
        ...(a.p_plan_mode ? { plan_mode: a.p_plan_mode } : {}),
        ...(a.p_day_ends_at ? { day_ends_at: `${a.p_day_ends_at}:00` } : {}),
      },
    }),
  });
  const rotate = async () => {
    await rpc('rotate_invite_code');
    await qc.invalidateQueries({ queryKey: STATE_KEY });
    toast.show('New code ready. The old one no longer works.');
  };

  return (
    <main className="screen profile">
      <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
      <h1>Household</h1>

      <form className="section" onSubmit={(e) => { e.preventDefault(); if (name.trim() && name !== h.name) update.mutate({ p_name: name.trim() }); }}>
        <label className="field"><span className="field__label">Home name</span>
          <span className="field__control"><input maxLength={40} value={name} onChange={(e) => setName(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} /></span></label>
      </form>

      <section className="section" aria-label="Weekly plan">
        <h2>Weekly plan</h2>
        <div role="radiogroup" aria-label="Weekly plan" className="styles">
          {MODES.map((m) => {
            const on = h.plan_mode === m.value;
            return (
              <button key={m.value} type="button" role="radio" aria-checked={on} aria-label={`${m.title}: ${m.body}`}
                className={`style-card${on ? ' is-on' : ''}`} onClick={() => update.mutate({ p_plan_mode: m.value })}>
                <strong>{m.title}</strong><span className="muted">{m.body}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section" aria-label="Day ends at">
        <h2>Day ends at</h2>
        <p className="muted">Unfinished chores move to “Missed by roommates” after this time.</p>
        <label className="field"><span className="sr-only">Day ends at</span>
          <span className="field__control">
            <select value={h.day_ends_at.slice(0, 5)} onChange={(e) => update.mutate({ p_day_ends_at: e.target.value })}>
              {ENDS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </span>
        </label>
      </section>

      <section className="section" aria-label="Invite code">
        <h2>Invite code</h2>
        <div className="code-big">{h.invite_code}</div>
        {isOwner && <Button variant="ghost" onClick={rotate}><RefreshCw size={16} aria-hidden /> Make a new code</Button>}
      </section>
    </main>
  );
}
```

`src/features/profile/profile.css`:

```css
.profile__head { display: flex; align-items: center; gap: 16px; }
.profile__head > div { flex: 1; }
.card { margin-top: 22px; padding: 18px; border-radius: var(--radius-l); }
.card--private { background: var(--surface); border: 1px dashed var(--line); display: grid; gap: 6px; }
.card--private .eyebrow { display: flex; align-items: center; gap: 6px; }
.card__big { font: 600 18px/1.35 var(--font-ui); }
.small { font-size: 13px; }
.days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.day-chip { position: relative; min-height: var(--tap); display: grid; place-items: center; border-radius: 14px; background: var(--surface); font-weight: 600; font-size: 13px; cursor: pointer; }
.day-chip.is-on { background: var(--lav); color: var(--lav-ink); box-shadow: inset 0 0 0 1.5px var(--lav-2); }
.day-chip input { position: absolute; opacity: 0; pointer-events: none; }
.day-chip:focus-within { outline: 3px solid var(--lav-3); outline-offset: 2px; }
.styles { display: grid; gap: 10px; }
.style-card { display: grid; gap: 4px; text-align: left; padding: 16px; border-radius: var(--radius-m); border: 1.5px solid var(--line); background: #fff; cursor: pointer; }
.style-card.is-on { border-color: var(--lav-ink); background: #faf5ff; }
.style-card__preview { font-size: 13px; color: var(--ink-2); margin-top: 6px; }
.mates-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.mates-list li { display: flex; align-items: center; gap: 12px; }
.mates-list__name { flex: 1; font-weight: 600; }
.links { gap: 0; }
.link-row { display: flex; justify-content: space-between; align-items: center; min-height: 54px; border-bottom: 1px solid var(--line); text-decoration: none; color: var(--ink); font-weight: 600; }
.sheet-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/features/profile`
Expected: PASS (6 tests). Note `rpc('leave_household')` passes `undefined` args — the test asserts exactly that.

- [ ] **Step 5: Commit**

```bash
git add src/features/profile src/features/primer
git commit -m "feat(profile): private balance, busy days, nudge style, roommates and household settings"
```

---
### Task 17: Activity feed, install & notification primer, Web Push on the device

**Files:**
- Create: `src/lib/platform.ts`, `src/lib/push.ts`, `src/features/activity/text.ts`, `src/features/activity/activity.css`, `src/features/primer/InstallPrimer.tsx`, `src/features/primer/primer.css`, `src/ui/OfflineBanner.tsx`
- Modify (replace placeholders): `src/features/activity/Activity.tsx`, `src/features/primer/NotificationsRow.tsx`
- Modify: `src/sw.ts` (push + notification click), `src/features/home/Home.tsx` (render `<InstallPrimer />` under the roommate cards), `src/App.tsx` (render `<OfflineBanner />` in `Root`), `src/ui/ui.css` (banner style)
- Test: `src/features/activity/activity.test.tsx`, `src/lib/push.test.ts`, `src/features/primer/primer.test.tsx`, `src/ui/OfflineBanner.test.tsx`

**Interfaces:**
- Consumes: push message JSON `{ title, body, url, tag }` (Task 9); RPCs `save_push_subscription`, `delete_push_subscription`, `mark_activity_seen` (Task 8); activity kinds (Tasks 8–9); `rpc`, `useMe`, `STATE_KEY` (Task 10); `namesOf` (Task 10).
- Produces: `isIOS()`, `isStandalone()`, `pushStatus(): 'unsupported' | 'needs_install' | 'default' | 'granted' | 'denied'`, `canInstall()`, `promptInstall()` (`platform.ts`); `urlBase64ToUint8Array()`, `enablePush()`, `disablePush()` (`push.ts`); `activityText(item, names, me)` (`text.ts`).

- [ ] **Step 1: Write the failing tests**

`src/features/activity/activity.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import Activity from './Activity';
import { activityText } from './text';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

const names = { me: 'Rahul', p: 'Priya' };
const item = (kind: string, actor: string | null, payload: Record<string, unknown> = {}) =>
  ({ id: 1, kind, actor, payload, created_at: '2026-10-01T05:00:00Z' });

test.each([
  [item('completed', 'p', { chore: 'Bathroom' }), 'Priya finished Bathroom'],
  [item('completed', 'me', { chore: 'Bathroom' }), 'You finished Bathroom'],
  [item('claimed', 'p', { chore: 'Mop floor' }), 'Priya grabbed Mop floor'],
  [item('covered', 'p', { chore: 'Mop floor' }), 'Priya covered Mop floor'],
  [item('joined', 'p'), 'Priya joined the home'],
  [item('left', 'p'), 'Priya left the home'],
  [item('chore_added', 'p', { chore: 'Plants' }), 'Priya added Plants'],
  [item('swapped', 'p', { with: 'Rahul' }), 'Priya swapped a chore with Rahul'],
  [item('pool', null), 'Some chores are up for grabs'],
  [item('plan_ready', null), "Next week's plan is ready to review"],
  [item('plan_locked', null), 'The weekly plan is locked in'],
  [item('day_kept', null, { streak: 4 }), '4-day streak — house peace secured'],
  [item('created', 'me'), 'You created the home'],
])('activityText %#', (i, text) => expect(activityText(i, names, 'me')).toBe(text));

test('activity screen lists events and marks them seen', async () => {
  const s = fixture({ activity: [item('completed', 'p', { chore: 'Bathroom' })] });
  renderWithState(<Activity />, { state: s, route: '/activity' });
  expect(screen.getByText('Priya finished Bathroom')).toBeInTheDocument();
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('mark_activity_seen', undefined));
});
```

`src/lib/push.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest';
import { urlBase64ToUint8Array } from './push';
import { pushStatus } from './platform';

afterEach(() => vi.unstubAllGlobals());

test('urlBase64ToUint8Array decodes URL-safe base64 without padding', () => {
  expect(Array.from(urlBase64ToUint8Array('AQID_-8'))).toEqual([1, 2, 3, 255, 239]);
});

test('iPhone in Safari needs the app installed before push can work', () => {
  vi.stubGlobal('navigator', { ...navigator, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)', maxTouchPoints: 5, standalone: false });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  expect(pushStatus()).toBe('needs_install');
});

test('a browser without the Push API is unsupported', () => {
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', maxTouchPoints: 0 });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  expect(pushStatus()).toBe('unsupported');
});
```

`src/features/primer/primer.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import { InstallPrimer } from './InstallPrimer';

const platform = vi.hoisted(() => ({ status: 'needs_install' as string }));
vi.mock('../../lib/platform', () => ({
  pushStatus: () => platform.status, canInstall: () => false, promptInstall: vi.fn(), isIOS: () => true, isStandalone: () => false,
}));
vi.mock('../../lib/push', () => ({ enablePush: vi.fn(async () => true), disablePush: vi.fn() }));
beforeEach(() => localStorage.clear());

test('on iPhone Safari it explains Add to Home Screen first', () => {
  renderWithState(<InstallPrimer />, { state: fixture() });
  expect(screen.getByRole('complementary', { name: 'Install Roomie' })).toBeInTheDocument();
  expect(screen.getByText(/add to home screen/i, { selector: 'li' })).toBeInTheDocument();
});

test('once installed it explains why before asking for permission', () => {
  platform.status = 'default';
  renderWithState(<InstallPrimer />, { state: fixture() });
  expect(screen.getByText(/so nobody has to ask/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Turn on reminders' })).toBeInTheDocument();
});

test('stays out of the way once reminders are on', () => {
  platform.status = 'granted';
  const { container } = renderWithState(<InstallPrimer />, { state: fixture() });
  expect(container.querySelector('.primer')).toBeNull();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/features/activity src/features/primer src/lib/push.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement platform and push helpers**

`src/lib/platform.ts`:

```ts
interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  Boolean(window.matchMedia?.('(display-mode: standalone)').matches) || (navigator as { standalone?: boolean }).standalone === true;

export type PushStatus = 'unsupported' | 'needs_install' | 'default' | 'granted' | 'denied';

export function pushStatus(): PushStatus {
  if (isIOS() && !isStandalone()) return 'needs_install'; // iOS only delivers web push to Home Screen apps
  if (!('serviceWorker' in navigator) || typeof window.PushManager === 'undefined' || typeof window.Notification === 'undefined') return 'unsupported';
  return Notification.permission as PushStatus;
}

let deferred: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BeforeInstallPromptEvent; });
}
export const canInstall = () => deferred !== null && !isStandalone();
export async function promptInstall() {
  if (!deferred) return;
  await deferred.prompt();
  deferred = null;
}
```

`src/lib/push.ts`:

```ts
import { rpc } from './state';

export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=').replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** Ask permission (only ever from a button tap), subscribe this device, and register it with the server. */
export async function enablePush(): Promise<boolean> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY) }));
  const { keys } = sub.toJSON() as { keys: { p256dh: string; auth: string } };
  await rpc('save_push_subscription', { p_endpoint: sub.endpoint, p_p256dh: keys.p256dh, p_auth: keys.auth });
  return true;
}

export async function disablePush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await rpc('delete_push_subscription', { p_endpoint: sub.endpoint });
  await sub.unsubscribe();
}
```

- [ ] **Step 4: Service worker push handling — append to `src/sw.ts`**

```ts
self.addEventListener('push', (event) => {
  const data = (() => { try { return event.data?.json() ?? {}; } catch { return {}; } })() as { title?: string; body?: string; url?: string; tag?: string };
  event.waitUntil(self.registration.showNotification(data.title ?? 'Roomie', {
    body: data.body ?? '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: data.tag,
    data: { url: data.url ?? '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data as { url?: string })?.url ?? '/', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find((w) => w.url.startsWith(self.location.origin));
    if (open) { await open.focus(); await (open as WindowClient).navigate(url); }
    else await self.clients.openWindow(url);
  })());
});
```

- [ ] **Step 5: Activity text and screen**

`src/features/activity/text.ts`:

```ts
import type { ActivityItem } from '../../lib/types';

export function activityText(item: ActivityItem, names: Record<string, string>, me: string): string {
  const p = item.payload as Record<string, string | number | undefined>;
  const who = item.actor === me ? 'You' : (item.actor && names[item.actor]) || (p.actor as string) || 'A roommate';
  switch (item.kind) {
    case 'created': return `${who} created the home`;
    case 'joined': return `${who} joined the home`;
    case 'left': return `${who} left the home`;
    case 'completed': return `${who} finished ${p.chore}`;
    case 'claimed': return `${who} grabbed ${p.chore}`;
    case 'covered': return `${who} covered ${p.chore}`;
    case 'chore_added': return `${who} added ${p.chore}`;
    case 'swapped': return `${who} swapped a chore with ${p.with}`;
    case 'pool': return 'Some chores are up for grabs';
    case 'plan_ready': return "Next week's plan is ready to review";
    case 'plan_locked': return 'The weekly plan is locked in';
    case 'day_kept': return `${p.streak}-day streak — house peace secured`;
    default: return 'Something happened at home';
  }
}
```

`src/features/activity/Activity.tsx`:

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { namesOf } from '../../lib/selectors';
import { rpc, STATE_KEY, useMe } from '../../lib/state';
import { EmptyState } from '../../ui/EmptyState';
import { activityText } from './text';
import './activity.css';

const dayLabel = (iso: string, tz: string, today: string) => {
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso));
  if (d === today) return 'Today';
  const y = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  if (d === y) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: tz });
};

export default function Activity() {
  const { me, state } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const names = namesOf(state);
  const tz = state.household!.tz;

  useEffect(() => {
    rpc('mark_activity_seen').then(() => qc.invalidateQueries({ queryKey: STATE_KEY })).catch(() => {});
  }, [qc]);

  const groups = new Map<string, typeof state.activity>();
  for (const item of state.activity) {
    const label = dayLabel(item.created_at, tz, state.today);
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }

  return (
    <main className="screen">
      <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
      <h1>Activity</h1>
      {state.activity.length === 0 && <EmptyState title="Quiet so far." body="Completed, claimed and planned chores show up here." />}
      {[...groups].map(([label, items]) => (
        <section key={label} className="feed" aria-label={label}>
          <p className="eyebrow">{label}</p>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <span>{activityText(item, names, me)}</span>
                <time className="muted" dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz })}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
```

`src/features/activity/activity.css`:

```css
.feed { margin-top: 22px; }
.feed ul { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 2px; }
.feed li { display: flex; justify-content: space-between; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--line); }
.feed time { font-size: 13px; white-space: nowrap; }
```

- [ ] **Step 6: Install primer and notifications row**

`src/features/primer/InstallPrimer.tsx`:

```tsx
import { Share, X } from 'lucide-react';
import { useState } from 'react';
import { canInstall, promptInstall, pushStatus, type PushStatus } from '../../lib/platform';
import { enablePush } from '../../lib/push';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import './primer.css';

const KEY = 'roomie-primer-snooze';
const snoozed = () => { try { return Number(localStorage.getItem(KEY) ?? 0) > Date.now(); } catch { return false; } };

export function InstallPrimer() {
  const toast = useToast();
  const [status, setStatus] = useState<PushStatus>(pushStatus);
  const [hidden, setHidden] = useState(snoozed);
  const dismiss = () => {
    try { localStorage.setItem(KEY, String(Date.now() + 7 * 86_400_000)); } catch { /* storage unavailable: just hide for now */ }
    setHidden(true);
  };
  if (hidden || status === 'granted' || status === 'denied') return null;

  if (status === 'needs_install') {
    return (
      <aside className="primer" aria-label="Install Roomie">
        <button className="primer__close" onClick={dismiss} aria-label="Not now"><X size={16} /></button>
        <strong>Add Roomie to your Home Screen</strong>
        <p>So the app can do the reminding — iPhone only allows reminders for installed apps.</p>
        <ol>
          <li>Tap <Share size={14} aria-label="Share" /> in Safari</li>
          <li>Choose “Add to Home Screen”</li>
          <li>Open Roomie from your Home Screen</li>
        </ol>
      </aside>
    );
  }

  if (status === 'unsupported') {
    return canInstall() ? (
      <aside className="primer" aria-label="Install Roomie">
        <button className="primer__close" onClick={dismiss} aria-label="Not now"><X size={16} /></button>
        <strong>Install Roomie</strong>
        <p>One tap from your home screen, works offline.</p>
        <Button variant="secondary" onClick={promptInstall}>Install</Button>
      </aside>
    ) : null;
  }

  return (
    <aside className="primer" aria-label="Turn on reminders">
      <button className="primer__close" onClick={dismiss} aria-label="Not now"><X size={16} /></button>
      <strong>Let Roomie do the reminding</strong>
      <p>A gentle nudge when it's your turn, so nobody has to ask. Never more than 3 a day, never at night.</p>
      <Button variant="secondary" onClick={async () => {
        const ok = await enablePush().catch(() => false);
        setStatus(pushStatus());
        toast.show(ok ? "Reminders on. We'll keep it gentle." : 'Reminders stay off — you can turn them on in Profile.');
      }}>Turn on reminders</Button>
      {canInstall() && <Button variant="ghost" onClick={promptInstall}>Install the app</Button>}
    </aside>
  );
}
```

`src/features/primer/NotificationsRow.tsx`:

```tsx
import { useState } from 'react';
import { pushStatus, type PushStatus } from '../../lib/platform';
import { disablePush, enablePush } from '../../lib/push';
import { Button } from '../../ui/Button';

const COPY: Record<PushStatus, string> = {
  granted: 'On for this device.',
  default: 'Off for this device.',
  denied: 'Blocked in your browser settings. Allow notifications for Roomie there to turn them on.',
  needs_install: 'On iPhone, add Roomie to your Home Screen first.',
  unsupported: "This browser can't show reminders — everything still appears in Activity.",
};

export function NotificationsRow() {
  const [status, setStatus] = useState<PushStatus>(pushStatus);
  return (
    <section className="section" aria-label="Reminders">
      <h2>Reminders</h2>
      <p className="muted">{COPY[status]}</p>
      {status === 'default' && <Button variant="secondary" onClick={async () => { await enablePush().catch(() => false); setStatus(pushStatus()); }}>Turn on</Button>}
      {status === 'granted' && <Button variant="ghost" onClick={async () => { await disablePush(); setStatus('default'); }}>Turn off on this device</Button>}
    </section>
  );
}
```

`src/features/primer/primer.css`:

```css
.primer { position: relative; margin-top: 18px; padding: 18px; border-radius: var(--radius-l); background: linear-gradient(135deg, #fff7ed, #fef3c7); display: grid; gap: 8px; }
.primer strong { font: 700 18px/1.2 var(--font-display); padding-right: 32px; }
.primer ol { margin: 0; padding-left: 20px; display: grid; gap: 4px; }
.primer__close { position: absolute; top: 10px; right: 10px; width: 36px; height: 36px; border-radius: 50%; border: 0; background: rgba(255, 255, 255, .7); display: grid; place-items: center; cursor: pointer; }
```

In `src/features/home/Home.tsx`, add the import and render it right after the `</ul>` that closes the roommate cards:

```tsx
import { InstallPrimer } from '../primer/InstallPrimer';
// …
      </ul>
      <InstallPrimer />
```

- [ ] **Step 7: Offline banner (test first)**

`src/ui/OfflineBanner.test.tsx`:

```tsx
import { act, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { OfflineBanner } from './OfflineBanner';

test('appears when the connection drops and leaves when it returns', () => {
  render(<OfflineBanner />);
  expect(screen.queryByRole('status')).toBeNull();
  act(() => { Object.defineProperty(navigator, 'onLine', { value: false, configurable: true }); window.dispatchEvent(new Event('offline')); });
  expect(screen.getByRole('status')).toHaveTextContent("You're offline — changes will sync");
  act(() => { Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }); window.dispatchEvent(new Event('online')); });
  expect(screen.queryByRole('status')).toBeNull();
});
```

Run: `npx vitest run src/ui/OfflineBanner.test.tsx` → FAIL (module missing).

`src/ui/OfflineBanner.tsx`:

```tsx
import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb); };
};

export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return <div className="offline" role="status">You're offline — changes will sync when you're back.</div>;
}
```

Append to `src/ui/ui.css`:

```css
.offline { position: fixed; top: calc(var(--safe-top) + 8px); left: 50%; transform: translateX(-50%); z-index: 70; padding: 8px 14px; border-radius: var(--radius-pill); background: var(--navy); color: #fff; font-size: 13px; font-weight: 600; box-shadow: var(--shadow-card); }
```

In `src/App.tsx`, import it and render it inside `Root`:

```tsx
import { OfflineBanner } from './ui/OfflineBanner';
// …
function Root() {
  const { data } = useAppState();
  useRealtime(data?.household?.id);
  return (<><OfflineBanner /><Outlet /></>);
}
```

Run: `npx vitest run src/ui/OfflineBanner.test.tsx` → PASS.

- [ ] **Step 8: Run all tests and build**

Run: `npm test && npm run build`
Expected: all suites pass (activity 14, push 3, primer 3, offline 1 added); build succeeds and `dist/sw.js` contains `showNotification`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(push): activity feed, install/permission primer, offline banner and web push"
```

---

### Task 18: Two-roommate end-to-end test, production deploy, README

> **ACCOUNT CHECKPOINT.** Ask Pema for: (1) a **Vercel token** (vercel.com → Account → Tokens); (2) a **Google OAuth client** (Google Cloud Console → APIs & Services → Credentials → OAuth client ID, type *Web*), with authorised redirect URI `https://<prod-ref>.supabase.co/auth/v1/callback`; (3) a **production Supabase project** `roomie` (separate from `roomie-dev`) — ref, db password, anon key; (4) optional: Twilio account SID, auth token, Verify service SID.

**Files:**
- Create: `playwright.config.ts`, `e2e/roommates.spec.ts`, `README.md`
- Modify: `package.json` (Playwright dev dependency, `e2e` script)

**Interfaces:**
- Consumes: everything above. E2E signs in with admin-generated magic links (no email sending, so Supabase's email rate limits never interfere); the OTP screen itself is covered by Task 11's tests.

- [ ] **Step 1: Install Playwright**

Run: `npm i -D @playwright/test@^1.56.0 && npx playwright install chromium`
Add to `package.json` scripts: `"e2e": "playwright test"`.

In the **dev** Supabase project → Authentication → URL Configuration: add `http://localhost:5173` to Redirect URLs.

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

Object.assign(process.env, loadEnv('test', process.cwd(), ''));

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  use: { baseURL: 'http://localhost:5173', ...devices['Pixel 7'], trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: true },
});
```

- [ ] **Step 3: Write `e2e/roommates.spec.ts`**

```ts
import { expect, type Page, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_SERVICE_KEY!, { auth: { persistSession: false } });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());

async function signIn(page: Page, email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: 'http://localhost:5173/' } });
  if (error) throw error;
  await page.goto(data.properties.action_link);
}

test('two roommates: create, join, miss, claim, cover — and the ledger stays private', async ({ browser }) => {
  const stamp = Date.now();
  const aarav = await (await browser.newContext()).newPage();
  const priya = await (await browser.newContext()).newPage();

  // Aarav creates the home
  const { data: aUser } = await admin.auth.admin.createUser({ email: `aarav-${stamp}@roomie.test`, email_confirm: true });
  await signIn(aarav, `aarav-${stamp}@roomie.test`);
  await aarav.getByLabel('Your name').fill('Aarav');
  await aarav.getByRole('button', { name: 'Continue' }).click();
  await aarav.getByRole('button', { name: /create a home/i }).click();
  await aarav.getByLabel('Home name').fill('E2E Flat');
  await aarav.getByRole('button', { name: 'Continue' }).click();
  await aarav.getByRole('button', { name: 'Continue' }).click(); // keep the suggested chores
  await aarav.getByRole('checkbox', { name: 'Monday' }).check({ force: true }); // the real input is visually hidden under the pill
  await aarav.getByRole('button', { name: 'Continue' }).click();
  const code = (await aarav.locator('.code-big').textContent())!.trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  await aarav.getByRole('button', { name: 'Done' }).click();
  await expect(aarav.getByRole('heading', { name: 'Hello, Aarav.' })).toBeVisible();

  // Priya joins with the code (typed messily on purpose)
  await admin.auth.admin.createUser({ email: `priya-${stamp}@roomie.test`, email_confirm: true });
  await signIn(priya, `priya-${stamp}@roomie.test`);
  await priya.getByLabel('Your name').fill('Priya');
  await priya.getByRole('button', { name: 'Continue' }).click();
  await priya.getByRole('button', { name: /join with a code/i }).click();
  await priya.getByLabel('Household code').fill(code.toLowerCase());
  await priya.getByRole('button', { name: 'Continue' }).click();
  await priya.getByRole('button', { name: 'Continue' }).click();
  await expect(priya.getByRole('heading', { name: 'Hello, Priya.' })).toBeVisible();

  // Simulate the day ending: one of Aarav's chores today becomes missed
  // Priya joined after this week's plan was made, so every chore this week is Aarav's — names are unique for her.
  const { data: hh } = await admin.from('households').select('id').eq('invite_code', code).single();
  const { data: missed } = await admin.from('assignments').select('id, chore_id, effort')
    .eq('household_id', hh!.id).eq('user_id', aUser.user!.id).eq('status', 'todo').limit(1).single();
  await admin.from('assignments').update({ status: 'missed', day: today() }).eq('id', missed!.id);
  const { data: chore } = await admin.from('chores').select('name').eq('id', missed!.chore_id).single();

  // Priya claims and covers it
  await priya.goto('/chores');
  await priya.getByRole('button', { name: `Claim ${chore!.name}` }).click();
  await priya.getByRole('region', { name: 'My tasks' }).getByRole('button', { name: `Mark ${chore!.name} done` }).click();
  await expect(priya.getByRole('dialog', { name: 'Thanks for covering.' })).toBeVisible();

  // Aarav sees his private balance; Priya sees hers — neither sees the other's
  await aarav.goto('/profile');
  await expect(aarav.getByText(new RegExp(`pick up ${missed!.effort} extra point`))).toBeVisible();
  await priya.goto('/profile');
  await expect(priya.getByText(/ahead — next week will be a little lighter/)).toBeVisible();
  await expect(priya.getByText(/pick up .* extra point/)).toHaveCount(0);
});
```

- [ ] **Step 4: Run it**

Run: `npm run e2e`
Expected: 1 passed. On failure, open the trace: `npx playwright show-trace test-results/**/trace.zip`.

- [ ] **Step 5: Configure the production Supabase project**

Run (from the repo, with the prod values):
```bash
npx supabase link --project-ref <prod-ref> --password "<prod-db-password>"
npx supabase db push --password "<prod-db-password>"
npx supabase secrets set VAPID_PUBLIC_KEY=<publicKey> VAPID_PRIVATE_KEY=<privateKey> VAPID_SUBJECT=mailto:pema.ghising133@gmail.com CRON_SECRET=<new-uuid>
npx supabase functions deploy tick --no-verify-jwt --use-api
npx supabase link --project-ref <dev-ref> --password "$SUPABASE_DB_PASSWORD"   # relink dev for daily work
```
Expected: migrations applied, function deployed.

In the **prod** dashboard:
1. SQL editor: `select vault.create_secret('https://<prod-ref>.supabase.co/functions/v1/tick', 'tick_url'); select vault.create_secret('<new-uuid>', 'cron_secret');`
2. Authentication → Providers: Email on, **password sign-in off**, "Confirm email" on; Google on (client ID + secret); Phone on with Twilio Verify only if Pema provided Twilio credentials.
3. Authentication → Email Templates → *Magic Link*: replace the body with:
   ```html
   <h2>Your Roomie code</h2>
   <p>Enter this code in the app: <strong style="font-size:24px;letter-spacing:4px">{{ .Token }}</strong></p>
   <p>It expires in 1 hour. If you didn't ask for it, ignore this email.</p>
   ```
4. Authentication → URL Configuration: Site URL = the Vercel production URL (from Step 6); add it to Redirect URLs.

- [ ] **Step 6: Deploy to Vercel**

Run:
```bash
export VERCEL_TOKEN=<token>
npx vercel link --yes --token $VERCEL_TOKEN
printf '%s' 'https://<prod-ref>.supabase.co' | npx vercel env add VITE_SUPABASE_URL production --token $VERCEL_TOKEN
printf '%s' '<prod-anon-key>' | npx vercel env add VITE_SUPABASE_ANON_KEY production --token $VERCEL_TOKEN
printf '%s' '<publicKey>' | npx vercel env add VITE_VAPID_PUBLIC_KEY production --token $VERCEL_TOKEN
printf '%s' 'off' | npx vercel env add VITE_PHONE_AUTH production --token $VERCEL_TOKEN
npx vercel deploy --prod --token $VERCEL_TOKEN
```
Expected: a `https://….vercel.app` production URL. Set `VITE_PHONE_AUTH` to `on` and redeploy once Twilio is configured.

- [ ] **Step 7: Device check (manual, record results in the README)**

1. iPhone (iOS 16.4+), Safari → open the URL → the "Add to Home Screen" primer appears → install → open from the Home Screen → sign in with an email code → "Turn on reminders" → allow.
2. Android Chrome → install prompt → sign in with Google → turn on reminders.
3. From the dev SQL editor, insert a test notification for your user: `insert into notifications (user_id, kind, payload) values ('<your-user-id>', 'pool', '{"chore":"Test chore"}');` → within 10 minutes the phone shows "Up for grabs: Test chore. Be a hero?"; tapping it opens Chores.
4. Turn on airplane mode, complete a chore → it shows done immediately and the offline banner appears; turn airplane mode off → it syncs and a roommate's phone updates within seconds.
5. Performance and accessibility: `npx lighthouse <production-url>/welcome --only-categories=performance,accessibility --form-factor=mobile --quiet --chrome-flags="--headless"` → performance ≥ 90 and accessibility ≥ 95 (spec quality bar). Record the scores in the README.

- [ ] **Step 8: Write `README.md`**

```markdown
# Roomie

The household app that does the asking. Roomie plans the week's chores by effort (not count), keeps heavy chores off your busy days, turns missed chores into a pool anyone can claim, and sends the reminders itself.

## Stack
React 19 + TypeScript PWA (Vite) · Supabase (Auth, Postgres + RLS, Realtime, Edge Functions, pg_cron) · Web Push · Vercel.

## How it fits together
- **The app** reads one snapshot (`get_state()`) and refreshes it on realtime changes. Every write is a Postgres RPC that checks who you are.
- **Fairness logic** lives in `supabase/functions/_shared/domain/` — pure TypeScript shared by the app and the server.
- **The `tick` function** runs every 10 minutes: drafts Saturday 18:00, locks Sunday 18:00, sweeps missed chores at day end, expires them 24 h later, settles the household streak, sends the morning digest and delivers push in each person's tone.
- **Privacy:** your effort balance is readable only by you (row-level security). There is no leaderboard anywhere.

## Run it locally
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in a Supabase dev project (see comments in the file).
3. `npm run dev`

## Tests
- `npm test` — domain logic, UI, and (when `SUPABASE_TEST_*` vars are set) database RLS/RPC/tick integration tests.
- `npm run e2e` — two roommates end to end against the dev project.

## Deploy
`npx supabase db push` · `npx supabase functions deploy tick --no-verify-jwt --use-api` · `npx vercel deploy --prod`.
One-time setup (Vault secrets, auth providers, the 6-digit email template) is listed in the implementation plan, Task 18.

## Device checks
| Date | Device | Install | Sign-in | Push | Offline |
|---|---|---|---|---|---|
| (fill in) | iPhone … | | | | |
| (fill in) | Android … | | | | |
```

- [ ] **Step 9: Final verification and commit**

Run: `npm test && npm run build && npm run e2e`
Expected: everything passes.

```bash
git add -A
git commit -m "chore: e2e journey, production deploy and README"
```
