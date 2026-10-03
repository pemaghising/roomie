# Roomie Milestone 2 (Pantry) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a household Pantry (shared and personal items with stock levels and sharing rules), restock requests that land in the Chores "Up for grabs" pool, and asks to use a roommate's item. All of it sits on the M1 stack and rules.

**Architecture:**
- **Database.** Three new tables are read-only to clients (RLS) and written only through security-definer RPCs scoped to `private.my_household()`. `get_state()` gains `pantry`, `restocks` and `asks`.
- **Domain.** Pure TypeScript lives in `supabase/functions/_shared/domain/`: `pantry.ts` holds icons, sorting, asks and labels; `restock.ts` holds the weekly totals; nudge copy moves to `nudge.ts`. The app and the `tick` Edge Function both import it.
- **App.** The Pantry screen is a lazy, prefetched tab chunk. The Chores pool renders restock rows. Tick adds stale-request digest lines and drains the new notification kinds.

**Tech Stack:**
- React 19, TypeScript 5 (strict), Vite 7, react-router 7, @tanstack/react-query 5, motion 13 (`m` + LazyMotion), lucide-react
- Supabase: Postgres + RLS, Realtime, Edge Functions on Deno
- Tests: Vitest + Testing Library + jsdom, Playwright

**Spec:** `docs/superpowers/specs/2026-10-03-roomie-pantry-design.md`. M1 spec: `docs/superpowers/specs/2026-10-01-roomie-app-design.md`.

## Global Constraints

**M1 rules and migrations**
- Every M1 rule still holds. The M1 plan's Global Constraints (`docs/superpowers/plans/2026-10-02-roomie-milestone-1.md`) apply unchanged.
- New migrations are `20261001000011_*` … `20261001000014_*`. Never edit `20261001000001`–`20261001000010`; they are pushed to dev and prod. Change an existing function with `create or replace` in a new migration.

**RPCs**
- Every new RPC:
  - is `language plpgsql security definer set search_path = public, private, pg_temp`;
  - resolves its household with `private.my_household()` and the caller with `private.me()`;
  - raises only M1 error codes plus `already_requested` and `duplicate_item`.
- Grants go per function: `revoke all on function public.<sig> from public, anon` then `grant execute on function public.<sig> to authenticated`.
  - **Never** use `grant execute on all functions in schema public`. It would re-grant every `srv_*` function to `authenticated`.
  - Any migration that `create or replace`s an `srv_*` function ends with the M1 `srv\_%` revoke loop.

**Tables and client writes**
- Clients never write tables. New tables get RLS plus `revoke insert, update, delete, truncate … from anon, authenticated`, re-asserted even though the M1 default-privilege revoke already covers them.
- Every RPC called through `useAction` is listed in `ACTION_RPCS` (`src/lib/state.ts`), so offline replay after a restart works.

**Bundle budget**
- The entry JS gzip (`dist/assets/index-*.js`) must stay **≤ 196.00 kB**. It measured **195.93 kB** before M2.
- Pantry is a lazy route chunk (`prefetchable(...)` in `App.tsx`).
- No entry-chunk module may value-import `@domain/pantry.ts` or `@domain/nudge.ts`. The entry-chunk modules are:
  - `main.tsx`, `App.tsx`;
  - `features/home/*`, `ui/*`;
  - `lib/state.ts`, `lib/selectors.ts`, `lib/types.ts`;
  - `@domain/copy.ts`, `@domain/time.ts`, `@domain/restock.ts`.
  `import type` is fine.
- Two measured offsets pay for the new entry code:
  - moving `nudge()` out of `copy.ts` saves −0.76 kB;
  - lazy-loading `InstallPrimer` on Home saves −0.61 kB.

**Motion**
- Reuse `SPRING` (`src/lib/motion.ts`), `haptic()` (`src/lib/haptics.ts`) and the global press system (`src/lib/press.ts`, automatic for `button`/`a`).
- Animate only `transform` and `opacity`. Never animate `filter`, `background-color` or `backdrop-filter` on large surfaces.
- Scrims are their own layer fading by opacity.

**Dependencies:** none new.

**Copy (verbatim from the spec)**
- Pantry screen:
  - tabs: "Shared", "My Items", "Roommates";
  - tags: "Running low", "Out", "Ask first", "Do not touch";
  - request sublines: "Requested · Priya's on it", "Requested";
  - empty states: "Nothing on the shelf yet", "Add the basics", "Your shelf is empty. Add things that are yours.", "No one has a personal shelf yet.".
- Add sheet:
  - placeholders: "e.g., Paper Towels", "e.g., Almond Milk";
  - buttons: "Add to Shared List", "Add to My Shelf";
  - duplicate error: "Already in the pantry".
- Restock sheet:
  - from an item: "We're out of {item}. Send this to the Chores pool so a roommate can pick it up.";
  - from the FAB: "This will create a task in the Chores pool for a roommate to pick up.";
  - button: "Send to Chores Pool".
- Request Sent:
  - title: "Request Sent!";
  - body: "{item} has been added to the Chores pool. A roommate will pick it up soon.";
  - pill: "Added to Shared Tasks";
  - button: "Back to Pantry".
- Asks:
  - button: "Ask {name}", disabled "Asked · waiting";
  - Do not touch label: "This is {name}'s. Do not touch.".
- Chores pool:
  - section: "Up for grabs";
  - rows: "Buy {item}", "Requested by {name}".
- Basics chips: Olive oil, Rice, Salt, Milk, Bread, Paper towels.

**Colours**
- Do not touch: pink `#fee2e2` / `#991b1b` (new tokens `--pink-bg` / `--pink-ink`).
- Ask first and Out: peach (`--heavy-bg` / `--heavy-ink`).
- Running low: butter (`--medium-bg` / `--medium-ink`).

**Accessibility:** 44 px minimum touch targets, WCAG AA contrast, visible focus rings, `prefers-reduced-motion` respected (MotionConfig `reducedMotion="user"` already does transforms).

**Domain code** is pure, has no dependencies, and imports siblings with explicit `.ts` extensions (Deno-compatible).

**Privacy**
- Asks are readable only by the asker and the owner. They never go into the household-wide `activity` table.
- No ranking anywhere.
- Pantry copy never mentions effort balances.
- Completing a restock never touches `effort_ledger`.

**Secrets and shell**
- Never print secrets.
- Read `.env.local` values only with `grep '^KEY=' .env.local | cut -d= -f2- | tr -d '\r'`. Never `source` it; the DB password has shell-special characters.
- Each Bash call is a fresh shell: export what a command needs in the same call.
- The worktree is linked to the **dev** project.
- Platform: Windows with Git Bash. Run commands from the repo root `motion-wt`.

**Commits:** a conventional subject, a blank line, then the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Use `git commit -F - <<'EOF' … EOF`.

## Review Focus

1. **The same name typed with different case or spacing** ("  paper   TOWELS ") must count as the existing "Paper towels". The client blocks it inline and the server refuses with `duplicate_item`. Tests: Task 4 `duplicates are refused per shelf, ignoring case and spacing`; Task 10 `a duplicate name is caught before sending`.
2. **An item named like a JavaScript object key** ("Constructor", "toString") must get the 🛒 fallback icon, never crash or render `[object Function]`. Test: Task 2 `iconFor ignores object-prototype names`.
3. **A solo household opening the Roommates tab** must show "No one has a personal shelf yet." and never leak shared items onto a "roommate" shelf. Test: Task 7 `a solo home never shows shared items on the Roommates tab`.
4. **Two roommates claim, or complete, the same restock at once.** Exactly one claim wins; the other gets `already_claimed`. Completing a request someone else claimed is refused. Tests: Task 4 `claim race` and `someone else's claimed request cannot be completed by you`.
5. **An offline tap replayed after reconnecting** (complete, answer) must succeed silently, with no duplicate notification or activity row. Tests: Task 4 `completing … is safe to replay` and `only the owner answers; the asker hears back` (replay line).

## Tasks

1. Nudge copy split, pantry nudge kinds and error codes
2. Pantry domain: icons, sorting, asks, labels and restock totals
3. Schema and RLS migration
4. Pantry RPC migration
5. `get_state` pantry fields, app types, state plumbing and weekTotals
6. Tick: stale-request digest lines, restock batching and cap exemption
7. Pantry screen shell: 4th tab, lazy route, underline tabs, shelves, empty states and Add the basics
8. Restock sheet and Request Sent
9. Item actions sheet, wired to restock
10. Add item sheet and FAB menu
11. Chores "Up for grabs" restock rows
12. Activity text, e2e extension, width sweep, Lighthouse and final budget

---

### Task 1: Nudge copy split, pantry nudge kinds and error codes

`nudge()` currently lives in `copy.ts`. `copy.ts` is in the entry chunk (via `errorText` in `lib/state.ts`), so every nudge string ships on first load. Moving `nudge()` to its own module takes 0.76 kB gzip out of the entry chunk; that headroom pays for M2's entry code. The new pantry kinds go into the new module. `copy.ts` keeps `reasonText`, `effortLabel`, `ERROR_CODES` and `errorText`, and gains the two pantry error codes.

**Files:**
- Create: `supabase/functions/_shared/domain/nudge.ts`
- Create: `supabase/functions/_shared/domain/nudge.test.ts`
- Modify (full rewrite): `supabase/functions/_shared/domain/copy.ts`
- Modify (full rewrite): `supabase/functions/_shared/domain/copy.test.ts`
- Modify: `supabase/functions/_shared/domain/tick.ts:2`
- Modify: `supabase/functions/tick/push.ts:1` and the `DEEP_LINK` map (lines 15-18)
- Modify: `src/features/profile/Profile.tsx:8`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `nudge(kind: NudgeKind, style: NudgeStyle, p: NudgePayload): { title: string; body: string }` from `@domain/nudge.ts`.
  - `NudgeKind` adds `'restock' | 'restock_done' | 'restock_closed' | 'ask' | 'ask_answer'`.
  - `NudgePayload` adds `item?: string; items?: string[]; stale?: string[]`.
  - `ERROR_CODES` (in `copy.ts`) adds `'already_requested'` and `'duplicate_item'`; `errorText('duplicate_item') === 'Already in the pantry.'` and `errorText('already_requested') === "Already requested — it's in the Chores pool."`.
  - `DEEP_LINK` in `tick/push.ts` covers the new kinds:
    - `restock` → `/chores`;
    - `restock_done` → `/pantry`;
    - `restock_closed` → `/chores`;
    - `ask` → `/pantry?tab=mine`;
    - `ask_answer` → `/pantry?tab=roommates`.

- [ ] **Step 1: Write the failing test** — create `supabase/functions/_shared/domain/nudge.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { nudge, type NudgeKind } from './nudge.ts';

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
  test('pool batches one sweep into one push', () => {
    expect(nudge('pool', 'motivate', { chores: ['Bins'] })).toEqual({ title: 'Up for grabs 🙌', body: 'Up for grabs: Bins. Be a hero?' });
    expect(nudge('pool', 'facts', { chores: ['Bins'] })).toEqual({ title: 'Unclaimed chore', body: 'Unclaimed: Bins.' });
    expect(nudge('pool', 'motivate', { chores: ['Bins', 'Dishes', 'Mop'] }))
      .toEqual({ title: 'Up for grabs 🙌', body: 'Up for grabs: Bins, Dishes and Mop. Grab one?' });
    expect(nudge('pool', 'facts', { chores: ['Bins', 'Dishes'] })).toEqual({ title: 'Unclaimed chores', body: 'Unclaimed: Bins and Dishes.' });
  });
  test('covered is private and kind', () => {
    expect(nudge('covered', 'motivate', { actor: 'Aarav', chore: 'Bathroom', effort: 3 }).body)
      .toBe("Aarav covered the Bathroom — you'll pick up a little extra next week (+3 pts).");
    expect(nudge('covered', 'facts', { actor: 'Aarav', chore: 'Bathroom', effort: 1 }).body)
      .toBe('Aarav covered Bathroom. +1 pt next week.');
  });
  test('every kind has copy in both tones', () => {
    const kinds: NudgeKind[] = [
      'digest', 'pool', 'plan_ready', 'plan_locked', 'covered', 'day_kept', 'swap_request', 'swap_answer', 'joined',
      'restock', 'restock_done', 'restock_closed', 'ask', 'ask_answer',
    ];
    for (const k of kinds) for (const s of ['motivate', 'facts'] as const) {
      const n = nudge(k, s, { chore: 'X', chores: ['X'], actor: 'A', streak: 2, effort: 1, accepted: true, offered: 'Y', item: 'Milk' });
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.body.length).toBeGreaterThan(0);
      expect(n.body).not.toContain('undefined');
      expect(n.body).not.toMatch(/you forgot|you failed|again\?/i);
    }
  });
});

describe('pantry nudges', () => {
  test('restock: one request names who asked; a drain batch lists the items', () => {
    expect(nudge('restock', 'motivate', { actor: 'Priya', item: 'Paper towels' }))
      .toEqual({ title: 'Shopping run? 🛒', body: 'Priya asked for Paper towels. Passing a shop?' });
    expect(nudge('restock', 'facts', { actor: 'Priya', item: 'Paper towels' }))
      .toEqual({ title: 'Restock request', body: 'Needed: Paper towels.' });
    expect(nudge('restock', 'motivate', { actor: 'Priya', items: ['Milk', 'Rice'] }))
      .toEqual({ title: 'Shopping run? 🛒', body: 'The house needs Milk and Rice. Grab one?' });
    expect(nudge('restock', 'facts', { items: ['Milk', 'Rice', 'Salt'] }))
      .toEqual({ title: 'Restock requests', body: 'Needed: Milk, Rice and Salt.' });
  });
  test('restock_done tells the requester who picked it up; restock_closed releases a claimer', () => {
    expect(nudge('restock_done', 'motivate', { actor: 'Aarav', item: 'Milk' }))
      .toEqual({ title: 'Restocked 🛒', body: 'Aarav picked up Milk. One less thing to think about.' });
    expect(nudge('restock_done', 'facts', { actor: 'Aarav', item: 'Milk' })).toEqual({ title: 'Restocked', body: 'Aarav picked up Milk.' });
    expect(nudge('restock_closed', 'motivate', { item: 'Tea' }))
      .toEqual({ title: 'No need to buy it', body: "Tea was restocked — you're off the hook." });
    expect(nudge('restock_closed', 'facts', { item: 'Tea' })).toEqual({ title: 'Restocked', body: 'Tea was restocked.' });
  });
  test('ask and its answer', () => {
    expect(nudge('ask', 'motivate', { actor: 'Aarav', item: 'Oat milk' }))
      .toEqual({ title: 'Quick ask 🙋', body: 'Aarav would like to use your Oat milk. Sure?' });
    expect(nudge('ask', 'facts', { actor: 'Aarav', item: 'Oat milk' })).toEqual({ title: 'Ask', body: 'Aarav asked to use your Oat milk.' });
    expect(nudge('ask_answer', 'motivate', { actor: 'Priya', item: 'Oat milk', accepted: true }))
      .toEqual({ title: 'Go ahead 👍', body: 'Priya said sure — the Oat milk is yours to use.' });
    expect(nudge('ask_answer', 'facts', { actor: 'Priya', item: 'Oat milk', accepted: true })).toEqual({ title: 'Answered', body: 'Priya: sure, Oat milk.' });
    expect(nudge('ask_answer', 'motivate', { actor: 'Priya', item: 'Oat milk', accepted: false }))
      .toEqual({ title: 'Not this time', body: 'Priya needs the Oat milk this time. No worries.' });
    expect(nudge('ask_answer', 'facts', { actor: 'Priya', item: 'Oat milk', accepted: false }))
      .toEqual({ title: 'Answered', body: 'Priya: not this time, Oat milk.' });
  });
  test('the digest adds requests open for 48 h, and can carry only those', () => {
    expect(nudge('digest', 'motivate', { chores: ['Bins'], stale: ['Paper towels'] }).body).toBe('1 task today — Bins. Still needed: Paper towels.');
    expect(nudge('digest', 'facts', { chores: ['Bins'], stale: ['Rice'] }).body).toBe('Bins. Still needed: Rice.');
    expect(nudge('digest', 'facts', { chores: [], stale: ['Paper towels', 'Rice'] })).toEqual({ title: 'Today', body: 'Still needed: Paper towels and Rice.' });
    expect(nudge('digest', 'motivate', { chores: [], stale: ['Rice'] })).toEqual({ title: 'Good morning 🌱', body: 'Still needed: Rice.' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run supabase/functions/_shared/domain/nudge.test.ts`
Expected: FAIL, with `Failed to resolve import "./nudge.ts"` (or "Cannot find module").

- [ ] **Step 3: Create `supabase/functions/_shared/domain/nudge.ts`**

```ts
import type { NudgeStyle } from './types.ts';

// Push copy lives here, apart from copy.ts: copy.ts ships in the app's entry chunk, this only in Profile's chunk and the tick.
const pts = (n: number) => `${n} pt${n === 1 ? '' : 's'}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export type NudgeKind =
  | 'digest' | 'pool' | 'plan_ready' | 'plan_locked' | 'covered' | 'day_kept' | 'swap_request' | 'swap_answer' | 'joined'
  | 'restock' | 'restock_done' | 'restock_closed' | 'ask' | 'ask_answer';

export interface NudgePayload {
  chore?: string; chores?: string[]; actor?: string; streak?: number; effort?: number; accepted?: boolean; offered?: string;
  /** pantry: one item, a drain-batched list of items, and the digest's "still needed" restock requests */
  item?: string; items?: string[]; stale?: string[];
}

type Copy = { title: string; body: string };

export function nudge(kind: NudgeKind, style: NudgeStyle, p: NudgePayload): Copy {
  const m = style === 'motivate';
  const chores = p.chores ?? [];
  switch (kind) {
    case 'digest': {
      const still = p.stale?.length ? `Still needed: ${list(p.stale)}.` : '';
      if (!chores.length) return m ? { title: 'Good morning 🌱', body: still } : { title: 'Today', body: still };
      const tail = still ? ` ${still}` : '';
      return m
        ? { title: 'Good morning 🌱', body: `${chores.length} task${chores.length === 1 ? '' : 's'} today — ${list(chores)}.${tail}` }
        : { title: 'Today', body: `${list(chores)}.${tail}` };
    }
    case 'pool': {
      const items = chores.length ? chores : p.chore ? [p.chore] : []; // `chore` is the pre-batch payload
      if (items.length <= 1) {
        return m ? { title: 'Up for grabs 🙌', body: `Up for grabs: ${items[0]}. Be a hero?` } : { title: 'Unclaimed chore', body: `Unclaimed: ${items[0]}.` };
      }
      return m
        ? { title: 'Up for grabs 🙌', body: `Up for grabs: ${list(items)}. Grab one?` }
        : { title: 'Unclaimed chores', body: `Unclaimed: ${list(items)}.` };
    }
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
    case 'restock': {
      const items = p.items?.length ? p.items : p.item ? [p.item] : [];
      if (items.length <= 1) {
        return m
          ? { title: 'Shopping run? 🛒', body: `${p.actor} asked for ${items[0]}. Passing a shop?` }
          : { title: 'Restock request', body: `Needed: ${items[0]}.` };
      }
      return m
        ? { title: 'Shopping run? 🛒', body: `The house needs ${list(items)}. Grab one?` }
        : { title: 'Restock requests', body: `Needed: ${list(items)}.` };
    }
    case 'restock_done':
      return m
        ? { title: 'Restocked 🛒', body: `${p.actor} picked up ${p.item}. One less thing to think about.` }
        : { title: 'Restocked', body: `${p.actor} picked up ${p.item}.` };
    case 'restock_closed':
      return m
        ? { title: 'No need to buy it', body: `${p.item} was restocked — you're off the hook.` }
        : { title: 'Restocked', body: `${p.item} was restocked.` };
    case 'ask':
      return m
        ? { title: 'Quick ask 🙋', body: `${p.actor} would like to use your ${p.item}. Sure?` }
        : { title: 'Ask', body: `${p.actor} asked to use your ${p.item}.` };
    case 'ask_answer':
      return p.accepted
        ? (m ? { title: 'Go ahead 👍', body: `${p.actor} said sure — the ${p.item} is yours to use.` } : { title: 'Answered', body: `${p.actor}: sure, ${p.item}.` })
        : (m ? { title: 'Not this time', body: `${p.actor} needs the ${p.item} this time. No worries.` } : { title: 'Answered', body: `${p.actor}: not this time, ${p.item}.` });
  }
}
```

- [ ] **Step 4: Rewrite `supabase/functions/_shared/domain/copy.ts`** (nudge removed, pantry error codes added):

```ts
import type { Reason } from './types.ts';
import { DAY_NAMES } from './time.ts';

// Push copy (nudge) lives in nudge.ts: this module ships in the app's entry chunk, so it holds only what first load needs.

export const effortLabel = (e: number) => (e >= 3 ? 'Heavy' : e === 2 ? 'Medium' : 'Light') as 'Light' | 'Medium' | 'Heavy';

const nameOf = (names: Record<string, string>, id?: string) => (id && names[id]) || 'a roommate';

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

export const ERROR_CODES = [
  'not_authenticated', 'not_member', 'already_member', 'invalid_code', 'household_full', 'rate_limited',
  'already_claimed', 'not_allowed', 'undo_expired', 'plan_locked', 'invalid_input', 'swap_unavailable',
  'already_requested', 'duplicate_item',
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
  already_requested: "Already requested — it's in the Chores pool.",
  duplicate_item: 'Already in the pantry.',
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

- [ ] **Step 5: Rewrite `supabase/functions/_shared/domain/copy.test.ts`.** The nudge tests moved to `nudge.test.ts`.

```ts
import { describe, expect, test } from 'vitest';
import { balanceSentence, effortLabel, ERROR_CODES, errorText, reasonText } from './copy.ts';

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

test('effortLabel', () => {
  expect([1, 2, 3].map(effortLabel)).toEqual(['Light', 'Medium', 'Heavy']);
});

test('errorText maps server codes and falls back', () => {
  expect(errorText('already_claimed')).toBe('Someone already grabbed this one.');
  expect(errorText('something_new')).toBe("Something went wrong. We'll keep trying.");
});

test('errorText covers the pantry refusals, and the client recognises their codes', () => {
  expect(errorText('duplicate_item')).toBe('Already in the pantry.');
  expect(errorText('already_requested')).toBe("Already requested — it's in the Chores pool.");
  expect(ERROR_CODES).toContain('duplicate_item');
  expect(ERROR_CODES).toContain('already_requested');
});

test('balanceSentence never ranks, only explains', () => {
  expect(balanceSentence(0)).toBe("You're all square with the house.");
  expect(balanceSentence(2)).toBe("You'll pick up 2 extra points over the next week.");
  expect(balanceSentence(-1)).toBe("You're 1 point ahead — next week will be a little lighter.");
});
```

- [ ] **Step 6: Point the importers at `nudge.ts`**

In `supabase/functions/_shared/domain/tick.ts`, replace

```ts
import type { NudgeKind } from './copy.ts';
```
with
```ts
import type { NudgeKind } from './nudge.ts';
```

In `supabase/functions/tick/push.ts`, replace

```ts
import { nudge, type NudgeKind, type NudgePayload } from '../_shared/domain/copy.ts';
```
with
```ts
import { nudge, type NudgeKind, type NudgePayload } from '../_shared/domain/nudge.ts';
```

In the same file, replace the `DEEP_LINK` map:

```ts
const DEEP_LINK: Record<NudgeKind, string> = {
  digest: '/chores', pool: '/chores', plan_ready: '/plan', plan_locked: '/plan', covered: '/profile',
  day_kept: '/', swap_request: '/plan', swap_answer: '/plan', joined: '/',
};
```
with
```ts
const DEEP_LINK: Record<NudgeKind, string> = {
  digest: '/chores', pool: '/chores', plan_ready: '/plan', plan_locked: '/plan', covered: '/profile',
  day_kept: '/', swap_request: '/plan', swap_answer: '/plan', joined: '/',
  // an ask goes to the owner (their shelf); the answer goes to the asker (the roommate's shelf)
  restock: '/chores', restock_done: '/pantry', restock_closed: '/chores', ask: '/pantry?tab=mine', ask_answer: '/pantry?tab=roommates',
};
```

In `src/features/profile/Profile.tsx`, replace

```ts
import { balanceSentence, errorText, nudge } from '@domain/copy.ts';
```
with
```ts
import { balanceSentence, errorText } from '@domain/copy.ts';
import { nudge } from '@domain/nudge.ts';
```

- [ ] **Step 7: Run the tests and the type check**

Run: `npx vitest run supabase/functions/_shared/domain supabase/functions/tick src/features/profile`
Expected: PASS. Every file passes, including `nudge.test.ts` and `copy.test.ts`.

Run: `npx tsc -b`
Expected: no output (exit 0).

Run: `npm run build 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E 'assets/index-.*\.js'`
Expected: the entry chunk at about `gzip: 195.17 kB`, i.e. at most 195.25 kB.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/_shared/domain/nudge.ts supabase/functions/_shared/domain/nudge.test.ts supabase/functions/_shared/domain/copy.ts supabase/functions/_shared/domain/copy.test.ts supabase/functions/_shared/domain/tick.ts supabase/functions/tick/push.ts src/features/profile/Profile.tsx
git commit -F - <<'EOF'
refactor(domain): move push copy to nudge.ts and add pantry kinds and error codes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 2: Pantry domain: icons, sorting, asks, labels and restock totals

All of this is pure logic. `restockTotals` lives in its own `restock.ts` because `lib/selectors.ts` (entry chunk) imports it for `weekTotals`. If it lived in `pantry.ts`, that import would drag the icon dictionary into the entry chunk.

**Files:**
- Create: `supabase/functions/_shared/domain/pantry.ts`
- Create: `supabase/functions/_shared/domain/pantry.test.ts`
- Create: `supabase/functions/_shared/domain/restock.ts`
- Create: `supabase/functions/_shared/domain/restock.test.ts`

**Interfaces:**
- Consumes: `Effort` from `./types.ts`, `addDays` from `./time.ts`.
- Produces (`@domain/pantry.ts`):
  - `type StockLevel = 'in_stock' | 'low' | 'out'`
  - `type PantryRule = 'ask_first' | 'do_not_touch'`
  - `type ShelfTab = 'shared' | 'mine' | 'roommates'`
  - `interface PantryItem { id; owner_id: string | null; name; rule: PantryRule | null; stock: StockLevel; created_at }`
  - `interface Restock { id; item_id: string | null; name; effort: Effort; requested_by; claimed_by: string | null; status: 'open' | 'done' | 'cancelled'; done_by: string | null; done_day: string | null; created_at }`
  - `interface PantryAsk { id; item_id; from_user; to_user; status: 'pending' | 'yes' | 'no'; created_at }`
  - `ICONS: Record<string, string>`, `iconFor(name: string): string`, `tintFor(icon: string): string`
  - `sortShelf<T extends { name: string; stock: StockLevel }>(items: T[], tab: ShelfTab): T[]`
  - `canAsk(item, me, asks): boolean`, `myAsk(asks, itemId, me): PantryAsk | undefined`
  - `openRestocks(restocks): Restock[]`, `openRestockFor(restocks, itemId): Restock | undefined`
  - `STOCK_LABEL`, `RULE_LABEL`, `requestedLine(r, names, me): string`
  - `BASICS`, `cleanName(s)`, `sameName(a, b)`
- Produces (`@domain/restock.ts`): `restockTotals(restocks, weekStart: string): Record<string, number>`

- [ ] **Step 1: Write the failing tests**

Create `supabase/functions/_shared/domain/pantry.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  BASICS, canAsk, cleanName, ICONS, iconFor, myAsk, openRestockFor, openRestocks, type PantryAsk, type PantryItem,
  requestedLine, type Restock, RULE_LABEL, sameName, sortShelf, STOCK_LABEL, tintFor,
} from './pantry.ts';

const item = (over: Partial<PantryItem>): PantryItem =>
  ({ id: 'i1', owner_id: null, name: 'Milk', rule: null, stock: 'in_stock', created_at: '2026-10-01T00:00:00Z', ...over });
const ask = (over: Partial<PantryAsk>): PantryAsk =>
  ({ id: 'k1', item_id: 'i1', from_user: 'me', to_user: 'p', status: 'pending', created_at: '2026-10-01T00:00:00Z', ...over });
const restock = (over: Partial<Restock>): Restock => ({
  id: 'r1', item_id: 'i1', name: 'Milk', effort: 1, requested_by: 'p', claimed_by: null, status: 'open',
  done_by: null, done_day: null, created_at: '2026-10-01T00:00:00Z', ...over,
});

describe('iconFor — a small local dictionary, case- and plural-insensitive', () => {
  test.each([
    ['Milk', '🥛'], ['EGGS', '🥚'], ['Paper Towels', '🧻'], ['Oat milk', '🥛'], ['  olive   OIL ', '🫒'],
    ['Tomatoes', '🍅'], ['Strawberries', '🍓'], ['Cookies', '🍪'], ['Rice', '🍚'], ['Energy Drinks', '⚡'],
    ['Whole milk (2L)', '🥛'], ['Eggs, free range', '🥚'], ['Chicken stock', '🍗'],
  ])('%s → %s', (name, icon) => expect(iconFor(name)).toBe(icon));

  test('unknown or empty names get a cart', () => {
    expect(iconFor('Zorblax')).toBe('🛒');
    expect(iconFor('')).toBe('🛒');
    expect(iconFor('123 !!')).toBe('🛒');
  });

  test('iconFor ignores object-prototype names', () => {
    for (const name of ['Constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) expect(iconFor(name)).toBe('🛒');
  });

  test('at least 40 entries', () => expect(Object.keys(ICONS).length).toBeGreaterThanOrEqual(40));

  test('the basics all have their own icon', () => {
    for (const b of BASICS) expect(iconFor(b)).not.toBe('🛒');
  });
});

test('tintFor is stable and always one of the pastel tokens', () => {
  const tints = new Set(['var(--light-bg)', 'var(--lav)', 'var(--peach-bg)', 'var(--pink-bg)', 'var(--medium-bg)', 'var(--sky-bg)']);
  for (const icon of ['🥛', '🍚', '🧻', '🛒', '🫒']) {
    expect(tints.has(tintFor(icon))).toBe(true);
    expect(tintFor(icon)).toBe(tintFor(icon));
  }
});

describe('sortShelf', () => {
  const shelf = [item({ name: 'salt' }), item({ name: 'Bread', stock: 'low' }), item({ name: 'Rice', stock: 'out' }),
    item({ name: 'apples' }), item({ name: 'Beans', stock: 'out' })];
  test('shared: out, then low, then in stock; alphabetical (ignoring case) inside each', () => {
    expect(sortShelf(shelf, 'shared').map((i) => i.name)).toEqual(['Beans', 'Rice', 'Bread', 'apples', 'salt']);
  });
  test('other tabs: alphabetical only', () => {
    expect(sortShelf(shelf, 'mine').map((i) => i.name)).toEqual(['apples', 'Beans', 'Bread', 'Rice', 'salt']);
    expect(sortShelf(shelf, 'roommates').map((i) => i.name)).toEqual(['apples', 'Beans', 'Bread', 'Rice', 'salt']);
  });
  test('does not mutate its input', () => {
    const before = shelf.map((i) => i.name);
    sortShelf(shelf, 'shared');
    expect(shelf.map((i) => i.name)).toEqual(before);
  });
});

describe('asks', () => {
  const oat = item({ owner_id: 'p', rule: 'ask_first' });
  test("canAsk only on another member's ask-first item with no pending ask from me", () => {
    expect(canAsk(oat, 'me', [])).toBe(true);
    expect(canAsk(oat, 'me', [ask({})])).toBe(false);
    expect(canAsk(oat, 'me', [ask({ status: 'no' })])).toBe(true); // answered: may ask again
    expect(canAsk(oat, 'me', [ask({ from_user: 'n' })])).toBe(true); // someone else's ask
    expect(canAsk(oat, 'p', [])).toBe(false); // own item
    expect(canAsk(item({ owner_id: 'p', rule: 'do_not_touch' }), 'me', [])).toBe(false);
    expect(canAsk(item({}), 'me', [])).toBe(false); // shared
  });
  test('myAsk is my latest ask on the item', () => {
    const asks = [ask({ id: 'old', status: 'no', created_at: '2026-09-30T00:00:00Z' }), ask({ id: 'new', status: 'yes' }), ask({ id: 'x', from_user: 'n' })];
    expect(myAsk(asks, 'i1', 'me')?.id).toBe('new');
    expect(myAsk(asks, 'i2', 'me')).toBeUndefined();
  });
});

describe('restocks and labels', () => {
  test('openRestocks: open only, oldest first; openRestockFor finds an item’s open request', () => {
    const rs = [restock({ id: 'b', created_at: '2026-10-02T00:00:00Z' }), restock({ id: 'a' }), restock({ id: 'd', status: 'done' })];
    expect(openRestocks(rs).map((r) => r.id)).toEqual(['a', 'b']);
    expect(openRestockFor([restock({ status: 'cancelled' }), restock({ id: 'live', item_id: 'i1' })], 'i1')?.id).toBe('live');
    expect(openRestockFor([restock({ status: 'done' })], 'i1')).toBeUndefined();
  });
  test('requestedLine says who is on it', () => {
    const names = { p: 'Priya' };
    expect(requestedLine(restock({}), names, 'me')).toBe('Requested');
    expect(requestedLine(restock({ claimed_by: 'p' }), names, 'me')).toBe("Requested · Priya's on it");
    expect(requestedLine(restock({ claimed_by: 'me' }), names, 'me')).toBe("Requested · You're on it");
    expect(requestedLine(restock({ claimed_by: 'zz' }), names, 'me')).toBe("Requested · A roommate's on it");
  });
  test('labels', () => {
    expect(STOCK_LABEL).toEqual({ in_stock: 'In stock', low: 'Running low', out: 'Out' });
    expect(RULE_LABEL).toEqual({ ask_first: 'Ask first', do_not_touch: 'Do not touch' });
    expect(BASICS).toEqual(['Olive oil', 'Rice', 'Salt', 'Milk', 'Bread', 'Paper towels']);
  });
  test('cleanName and sameName match the server (trim, collapse spaces, ignore case)', () => {
    expect(cleanName('  Paper   towels ')).toBe('Paper towels');
    expect(sameName('  paper   TOWELS ', 'Paper towels')).toBe(true);
    expect(sameName('Paper towel', 'Paper towels')).toBe(false);
  });
});
```

Create `supabase/functions/_shared/domain/restock.test.ts`:

```ts
import { expect, test } from 'vitest';
import type { Restock } from './pantry.ts';
import { restockTotals } from './restock.ts';

const r = (over: Partial<Restock>): Restock => ({
  id: crypto.randomUUID(), item_id: null, name: 'Rice', effort: 1, requested_by: 'p', claimed_by: null, status: 'done',
  done_by: 'a', done_day: '2026-10-01', created_at: '2026-10-01T00:00:00Z', ...over,
});

test('restockTotals counts restocks done inside the week, to whoever did them', () => {
  expect(restockTotals([
    r({ done_by: 'a', effort: 2, done_day: '2026-09-28' }), // Monday
    r({ done_by: 'a', effort: 1, done_day: '2026-10-04' }), // Sunday
    r({ done_by: 'b', effort: 3, done_day: '2026-10-05' }), // next week
    r({ done_by: 'b', effort: 3, done_day: '2026-09-27' }), // last week
    r({ status: 'open', done_by: null, done_day: null }),
    r({ status: 'cancelled', done_by: 'b', done_day: '2026-09-30' }),
  ], '2026-09-28')).toEqual({ a: 3 });
});

test('restockTotals of nothing is empty', () => expect(restockTotals([], '2026-09-28')).toEqual({}));
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run supabase/functions/_shared/domain/pantry.test.ts supabase/functions/_shared/domain/restock.test.ts`
Expected: FAIL, with `Failed to resolve import "./pantry.ts"` and `"./restock.ts"`.

- [ ] **Step 3: Create `supabase/functions/_shared/domain/pantry.ts`**

```ts
import type { Effort } from './types.ts';

export type StockLevel = 'in_stock' | 'low' | 'out';
export type PantryRule = 'ask_first' | 'do_not_touch';
export type ShelfTab = 'shared' | 'mine' | 'roommates';

/** owner_id null = shared (and rule null); otherwise personal with a rule. */
export interface PantryItem { id: string; owner_id: string | null; name: string; rule: PantryRule | null; stock: StockLevel; created_at: string }
export interface Restock {
  id: string; item_id: string | null; name: string; effort: Effort; requested_by: string; claimed_by: string | null;
  status: 'open' | 'done' | 'cancelled'; done_by: string | null;
  /** the household-local date it was done, for this week's totals */
  done_day: string | null; created_at: string;
}
export interface PantryAsk { id: string; item_id: string; from_user: string; to_user: string; status: 'pending' | 'yes' | 'no'; created_at: string }

/** Keys are lowercase, singular, letters and spaces only. Multi-word keys win over their last word ("olive oil" before "oil"). */
export const ICONS: Record<string, string> = {
  milk: '🥛', 'oat milk': '🥛', 'almond milk': '🥛', yogurt: '🥣', cereal: '🥣', butter: '🧈', cheese: '🧀', egg: '🥚',
  bread: '🍞', bagel: '🥯', rice: '🍚', pasta: '🍝', noodle: '🍜', flour: '🌾', sugar: '🍬', salt: '🧂',
  'olive oil': '🫒', olive: '🫒', oil: '🫗', pepper: '🌶️', chili: '🌶️', garlic: '🧄', onion: '🧅', ginger: '🫚',
  potato: '🥔', tomato: '🍅', carrot: '🥕', lettuce: '🥬', spinach: '🥬', broccoli: '🥦', cucumber: '🥒', corn: '🌽',
  mushroom: '🍄', avocado: '🥑', bean: '🫘', lentil: '🫘', apple: '🍎', banana: '🍌', orange: '🍊', lemon: '🍋',
  grape: '🍇', strawberry: '🍓', chicken: '🍗', meat: '🥩', fish: '🐟', coffee: '☕', tea: '🍵', juice: '🧃',
  water: '💧', soda: '🥤', 'protein shake': '🥤', 'energy drink': '⚡', beer: '🍺', wine: '🍷', honey: '🍯',
  'peanut butter': '🥜', nut: '🥜', jam: '🍓', ketchup: '🍅', chocolate: '🍫', cookie: '🍪', chip: '🥔', 'ice cream': '🍨',
  'paper towel': '🧻', 'toilet paper': '🧻', tissue: '🧻', soap: '🧼', 'dish soap': '🧼', sponge: '🧽',
  detergent: '🧴', shampoo: '🧴', toothpaste: '🪥', 'trash bag': '🗑️', 'bin bag': '🗑️',
};

const has = (key: string) => Object.hasOwn(ICONS, key); // never an inherited key like "constructor"
/** The word itself, then its singular guesses: berries → berry, tomatoes → tomato, towels → towel. */
const forms = (w: string) => [w, w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, '')];

export function iconFor(name: string): string {
  const words = name.toLowerCase().replace(/[^a-z ]/g, ' ').split(' ').filter(Boolean);
  if (!words.length) return '🛒';
  const last = words[words.length - 1];
  // longest tail first: "whole oat milk" tries "whole oat milk", then "oat milk", then "milk"
  for (let i = 0; i < words.length; i++) {
    const head = words.slice(i, -1).join(' ');
    for (const f of forms(last)) {
      const key = head ? `${head} ${f}` : f;
      if (has(key)) return ICONS[key];
    }
  }
  // then any single word, from the end: "milk (2l)", "eggs, free range", "chicken stock"
  for (const w of [...words].reverse()) for (const f of forms(w)) if (has(f)) return ICONS[f];
  return '🛒';
}

const TINTS = ['var(--light-bg)', 'var(--lav)', 'var(--peach-bg)', 'var(--pink-bg)', 'var(--medium-bg)', 'var(--sky-bg)'] as const;
/** The icon tile's pastel, derived from the icon so the same thing always gets the same colour. */
export function tintFor(icon: string): string {
  let h = 0;
  for (const ch of icon) h = (h * 31 + ch.codePointAt(0)!) % 9973;
  return TINTS[h % TINTS.length];
}

const RANK: Record<StockLevel, number> = { out: 0, low: 1, in_stock: 2 };
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });

/** Shared: out, then low, then in stock, alphabetical within each. Other tabs: alphabetical. */
export function sortShelf<T extends { name: string; stock: StockLevel }>(items: T[], tab: ShelfTab): T[] {
  return [...items].sort((a, b) => (tab === 'shared' ? RANK[a.stock] - RANK[b.stock] : 0) || byName(a, b));
}

/** Only on another member's ask-first item, and only when I have no pending ask on it. */
export function canAsk(
  item: Pick<PantryItem, 'id' | 'owner_id' | 'rule'>, me: string, asks: Pick<PantryAsk, 'item_id' | 'from_user' | 'status'>[],
): boolean {
  return item.owner_id !== null && item.owner_id !== me && item.rule === 'ask_first'
    && !asks.some((a) => a.item_id === item.id && a.from_user === me && a.status === 'pending');
}

/** My latest ask on an item (get_state sends pending asks and my asks answered in the last day). */
export const myAsk = (asks: PantryAsk[], itemId: string, me: string): PantryAsk | undefined =>
  asks.filter((a) => a.item_id === itemId && a.from_user === me).sort((x, y) => y.created_at.localeCompare(x.created_at))[0];

export const openRestocks = (restocks: Restock[]): Restock[] =>
  restocks.filter((r) => r.status === 'open').sort((x, y) => x.created_at.localeCompare(y.created_at));

export const openRestockFor = (restocks: Restock[], itemId: string): Restock | undefined =>
  restocks.find((r) => r.item_id === itemId && r.status === 'open');

export const STOCK_LABEL: Record<StockLevel, string> = { in_stock: 'In stock', low: 'Running low', out: 'Out' };
export const RULE_LABEL: Record<PantryRule, string> = { ask_first: 'Ask first', do_not_touch: 'Do not touch' };

export function requestedLine(r: Pick<Restock, 'claimed_by'>, names: Record<string, string>, me: string): string {
  if (!r.claimed_by) return 'Requested';
  return `Requested · ${r.claimed_by === me ? "You're" : `${names[r.claimed_by] ?? 'A roommate'}'s`} on it`;
}

export const BASICS = ['Olive oil', 'Rice', 'Salt', 'Milk', 'Bread', 'Paper towels'] as const;

/** The server stores names trimmed with inner spaces collapsed and compares them case-insensitively; so does the app. */
export const cleanName = (s: string) => s.trim().replace(/\s+/g, ' ');
export const sameName = (a: string, b: string) => cleanName(a).toLowerCase() === cleanName(b).toLowerCase();
```

- [ ] **Step 4: Create `supabase/functions/_shared/domain/restock.ts`**

```ts
import type { Restock } from './pantry.ts';
import { addDays } from './time.ts';

/**
 * Effort from restocks completed in a week, credited to whoever completed them (it counts toward the fair share;
 * nobody gets debt, since nobody missed anything). Kept apart from pantry.ts: weekTotals in the app's entry chunk
 * imports this, and must not pull in the icon dictionary.
 */
export function restockTotals(
  restocks: Pick<Restock, 'status' | 'done_by' | 'done_day' | 'effort'>[], weekStart: string,
): Record<string, number> {
  const end = addDays(weekStart, 6);
  const totals: Record<string, number> = {};
  for (const r of restocks) {
    if (r.status !== 'done' || !r.done_by || !r.done_day || r.done_day < weekStart || r.done_day > end) continue;
    totals[r.done_by] = (totals[r.done_by] ?? 0) + r.effort;
  }
  return totals;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run supabase/functions/_shared/domain/pantry.test.ts supabase/functions/_shared/domain/restock.test.ts`
Expected: PASS (2 files).

Run: `npx tsc -b`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/domain/pantry.ts supabase/functions/_shared/domain/pantry.test.ts supabase/functions/_shared/domain/restock.ts supabase/functions/_shared/domain/restock.test.ts
git commit -F - <<'EOF'
feat(domain): pantry icons, shelf sorting, ask rules and restock totals

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 3: Schema and RLS migration

**Files:**
- Create: `supabase/migrations/20261001000011_pantry_schema.sql`
- Create: `tests/db/pantry.test.ts`

**Interfaces:**
- Consumes: `private.is_member(uuid)` (M1), and `admin`, `cleanup`, `hasDb`, `makeUser`, `seedHousehold` from `tests/db/helpers.ts`.
- Produces:
  - Enums: `pantry_rule`, `stock_level`, `restock_status`, `ask_status`.
  - Tables:
    - `pantry_items(id, household_id, owner_id, name, rule, stock, archived_at, created_by, created_at, updated_at)`
    - `restock_requests(id, household_id, item_id, name, effort, requested_by, claimed_by, status, done_by, done_at, stale_noted_at, created_at)`
    - `pantry_asks(id, household_id, item_id, from_user, to_user, status, created_at, answered_at)`
  - Unique indexes:
    - `pantry_items_unique_name` on `(household_id, coalesce(owner_id, zero-uuid), lower(name)) where archived_at is null`;
    - `restock_one_open_per_item`;
    - `pantry_asks_one_pending`.
  - Realtime on `pantry_items` and `restock_requests`.
  - In `tests/db/pantry.test.ts`: the module-level `makeUser`/`seedHousehold` wrappers (auto-cleanup), `type U`, and `seedItem(h, by, over)`. Tasks 4–6 append `describe` blocks to this file.

Spec gap resolved here:
- **No `icon` column.** The icon is derived from the name at render time (`iconFor`), so no RPC needs an icon parameter and every client shows the same icon.
- **`stale_noted_at` is new.** It records that the morning digest has already mentioned a request open longer than 48 h ("mentioned once").

- [ ] **Step 1: Write the failing test** — create `tests/db/pantry.test.ts`:

```ts
// @vitest-environment node
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { admin, cleanup, hasDb, makeUser as mk, seedHousehold as seedH } from './helpers';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });
type U = Awaited<ReturnType<typeof mk>>;
const users: string[] = [];
const homes: string[] = [];
const makeUser: typeof mk = async (n) => { const u = await mk(n); users.push(u.id); return u; };
const seedHousehold: typeof seedH = async (...args) => { const h = await seedH(...args); homes.push(h); return h; };
afterAll(async () => { await cleanup({ householdIds: homes, userIds: users }); }, 60_000);

/** Inserts a pantry item directly (service role), bypassing the RPCs. */
async function seedItem(h: string, by: string, over: Record<string, unknown> = {}): Promise<string> {
  const { data, error } = await admin().from('pantry_items').insert({ household_id: h, name: 'Milk', created_by: by, ...over }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

describe.skipIf(!hasDb)('pantry row-level security', () => {
  let a: U; let b: U; let c: U; let x: U; let h: string;

  beforeAll(async () => {
    [a, b, c, x] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima'), makeUser('Xena')]);
    h = await seedHousehold(a.id, [b.id, c.id]);
    await seedHousehold(x.id);
    const oat = await seedItem(h, a.id, { owner_id: a.id, rule: 'ask_first', name: 'Oat milk' });
    const r = await admin().from('restock_requests').insert({ household_id: h, name: 'Rice', effort: 1, requested_by: b.id });
    if (r.error) throw r.error;
    const k = await admin().from('pantry_asks').insert({ household_id: h, item_id: oat, from_user: b.id, to_user: a.id });
    if (k.error) throw k.error;
  });

  test("members read their household's items and requests; other households read nothing", async () => {
    expect((await c.client.from('pantry_items').select('id')).data).toHaveLength(1);
    expect((await c.client.from('restock_requests').select('id')).data).toHaveLength(1);
    expect((await x.client.from('pantry_items').select('id')).data).toEqual([]);
    expect((await x.client.from('restock_requests').select('id')).data).toEqual([]);
  });

  test('asks are visible only to the two people involved', async () => {
    expect((await a.client.from('pantry_asks').select('id')).data).toHaveLength(1);
    expect((await b.client.from('pantry_asks').select('id')).data).toHaveLength(1);
    expect((await c.client.from('pantry_asks').select('id')).data).toEqual([]);
    expect((await x.client.from('pantry_asks').select('id')).data).toEqual([]);
  });

  test('clients cannot write pantry tables directly', async () => {
    expect((await a.client.from('pantry_items').insert({ household_id: h, name: 'Hack', created_by: a.id })).error?.code).toBe('42501');
    expect((await a.client.from('restock_requests').insert({ household_id: h, name: 'Hack', effort: 1, requested_by: a.id })).error?.code).toBe('42501');
    const { data: item } = await admin().from('pantry_items').select('id').eq('household_id', h).single();
    expect((await a.client.from('pantry_asks').insert({ household_id: h, item_id: item!.id, from_user: c.id, to_user: a.id })).error?.code).toBe('42501');
    await a.client.from('pantry_items').update({ stock: 'out' }).eq('household_id', h);
    expect((await admin().from('pantry_items').select('stock').eq('household_id', h).single()).data!.stock).toBe('in_stock');
    await b.client.from('restock_requests').delete().eq('household_id', h);
    expect((await admin().from('restock_requests').select('id').eq('household_id', h)).data).toHaveLength(1);
  });

  test('a shared item cannot carry a rule, and a personal item must have one', async () => {
    expect((await admin().from('pantry_items').insert({ household_id: h, name: 'Salt', created_by: a.id, rule: 'ask_first' })).error?.code).toBe('23514');
    expect((await admin().from('pantry_items').insert({ household_id: h, name: 'Salt', created_by: a.id, owner_id: a.id })).error?.code).toBe('23514');
  });

  test('names are unique per shelf, ignoring case, among active items only', async () => {
    await seedItem(h, a.id, { name: 'Bread' });
    expect((await admin().from('pantry_items').insert({ household_id: h, name: 'bread', created_by: a.id })).error?.code).toBe('23505');
    await seedItem(h, b.id, { name: 'Bread', owner_id: b.id, rule: 'do_not_touch' }); // a personal shelf is its own namespace
    await admin().from('pantry_items').update({ archived_at: new Date().toISOString() }).eq('household_id', h).is('owner_id', null).eq('name', 'Bread');
    await seedItem(h, a.id, { name: 'BREAD' }); // archived names are free again
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/db/pantry.test.ts`
Expected: FAIL in `beforeAll`, with an error like `Could not find the table 'public.pantry_items' in the schema cache`.

- [ ] **Step 3: Create `supabase/migrations/20261001000011_pantry_schema.sql`**

```sql
-- Milestone 2: the pantry. Items (shared or personal), restock requests (the chores pool) and asks.
-- Writes only through the security-definer RPCs in 20261001000012; clients get read-only RLS.

create type pantry_rule as enum ('ask_first', 'do_not_touch');
create type stock_level as enum ('in_stock', 'low', 'out');
create type restock_status as enum ('open', 'done', 'cancelled');
create type ask_status as enum ('pending', 'yes', 'no');

create table pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  owner_id uuid references profiles, -- null = shared
  name text not null check (char_length(name) between 1 and 40),
  rule pantry_rule,
  stock stock_level not null default 'in_stock',
  archived_at timestamptz,
  created_by uuid not null references profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((owner_id is null) = (rule is null))
);
-- one active "milk" per shelf: the shared shelf, or each person's own
create unique index pantry_items_unique_name on pantry_items
  (household_id, coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
  where archived_at is null;

create table restock_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  item_id uuid references pantry_items on delete set null, -- null = free text from the FAB
  name text not null check (char_length(name) between 1 and 40), -- snapshot of the item name
  effort smallint not null check (effort between 1 and 3),
  requested_by uuid not null references profiles,
  claimed_by uuid references profiles,
  status restock_status not null default 'open',
  done_by uuid references profiles,
  done_at timestamptz,
  stale_noted_at timestamptz, -- set when the morning digest has mentioned it (once, after 48 h open)
  created_at timestamptz not null default now()
);
create unique index restock_one_open_per_item on restock_requests (item_id) where status = 'open' and item_id is not null;
create index restock_requests_household on restock_requests (household_id, status);

create table pantry_asks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  item_id uuid not null references pantry_items on delete cascade,
  from_user uuid not null references profiles,
  to_user uuid not null references profiles, -- the item's owner
  status ask_status not null default 'pending',
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create unique index pantry_asks_one_pending on pantry_asks (item_id, from_user) where status = 'pending';

alter table pantry_items enable row level security;
alter table restock_requests enable row level security;
alter table pantry_asks enable row level security;

-- Read-only policies; there are deliberately no insert/update/delete policies.
create policy pantry_items_read on pantry_items for select using (private.is_member(household_id));
create policy restock_requests_read on restock_requests for select using (private.is_member(household_id));
-- asks are private to the two people involved
create policy pantry_asks_read_own on pantry_asks for select
  using (auth.uid() in (from_user, to_user) and private.is_member(household_id));

-- M1's default-privilege revoke already covers new tables; re-assert it for these three.
revoke insert, update, delete, truncate on pantry_items, restock_requests, pantry_asks from anon, authenticated;

-- realtime is only a "something changed" signal; asks are not broadcast (fetched via get_state)
alter publication supabase_realtime add table pantry_items, restock_requests;
```

- [ ] **Step 4: Push the migration to dev**

Run (one command, a fresh shell):

```bash
export SUPABASE_ACCESS_TOKEN="$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2- | tr -d '\r')"; P="$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2- | tr -d '\r')"; npx supabase db push --linked --password "$P"
```
Expected: `Applying migration 20261001000011_pantry_schema.sql...` then `Finished supabase db push.`

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/db/pantry.test.ts`
Expected: PASS (5 tests). PostgREST may cache the schema briefly; if the first run still says "schema cache", run it again once.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261001000011_pantry_schema.sql tests/db/pantry.test.ts
git commit -F - <<'EOF'
feat(db): pantry tables with read-only RLS and private asks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 4: Pantry RPC migration

**Files:**
- Create: `supabase/migrations/20261001000012_pantry_rpc.sql`
- Modify: `tests/db/pantry.test.ts` (add the `createClient` import at the top; append `describe` blocks)

**Interfaces:**
- Consumes: the Task 3 tables; `private.me()`, `private.my_household()`, `private.name(uuid)`, `private.log(h, kind, actor, payload)`, `private.notify(user, h, kind, payload)` and `private.notify_household(h, kind, payload, except_user)` (M1).
- Produces (all callable by `authenticated` only):
  - `add_pantry_item(p_name text, p_owner_personal boolean, p_rule pantry_rule default null) → uuid`. Raises `duplicate_item` or `invalid_input`. A personal item with no rule gets `ask_first`.
  - `add_pantry_basics(p_names text[]) → void`. Shared and in stock; already-present names are silently skipped.
  - `set_item_stock(p_id uuid, p_stock stock_level) → void`. `in_stock` cancels the open request and sends `restock_closed` to its claimer.
  - `set_item_rule(p_id uuid, p_rule pantry_rule) → void`. Owner only.
  - `remove_pantry_item(p_id uuid) → void`. Shared: anyone; personal: owner only. Archives the item and cancels its open request.
  - `request_restock(p_item uuid default null, p_name text default null, p_effort smallint default 1) → uuid`. Raises `already_requested`. Marks the item `out` unless it is `low`/`out`. Sends `restock` to the other members. Logs `restock_requested`.
  - `claim_restock(p_id) → void` (`already_claimed`), `unclaim_restock(p_id) → void` (claimer only).
  - `complete_restock(p_id) → void`. Idempotent for the same person. Sets the item `in_stock`, logs `restocked`, sends `restock_done` to the requester. No ledger change.
  - `cancel_restock(p_id) → void`. Requester only.
  - `ask_to_use(p_item uuid) → uuid`. Idempotent while pending; a pending ask older than 24 h is replaced. Sends `ask`.
  - `answer_ask(p_ask uuid, p_yes boolean) → void`. Owner only, within 24 h, idempotent. Sends `ask_answer` with `accepted`.
  - `private.depart(h, u)`, now also archiving the leaver's personal items and dropping their restock claims.
- Activity kinds: `restock_requested` and `restocked`, both with payload `{ actor, item }`.

Spec gaps resolved here:
- **`p_effort` defaults to 1.** In Postgres every parameter after a defaulted one needs a default, and Light is the spec's default effort.
- **Marking an item In stock tells the claimer "{item} was restocked".** That needs its own kind, `restock_closed`, so `restock_done` keeps meaning "your request was picked up".
- **Asks write no `activity` rows.** That table is household-wide, and the spec keeps asks between the two people. Their record is the `ask`/`ask_answer` notifications and the `asks` field of `get_state` (Task 5).

- [ ] **Step 1: Write the failing tests**

At the top of `tests/db/pantry.test.ts`, replace

```ts
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
```
with
```ts
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
```

Append to the end of `tests/db/pantry.test.ts`:

```ts
describe.skipIf(!hasDb)('pantry items', () => {
  let a: U; let b: U; let x: U; let h: string;
  beforeAll(async () => {
    [a, b, x] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Xena')]);
    h = await seedHousehold(a.id, [b.id]);
    await seedHousehold(x.id);
  });
  const row = async (id: string) => (await admin().from('pantry_items').select('*').eq('id', id).single()).data!;
  const idOf = async (name: string, owner: string | null) => {
    const q = admin().from('pantry_items').select('id').eq('household_id', h).eq('name', name).is('archived_at', null);
    return ((await (owner ? q.eq('owner_id', owner) : q.is('owner_id', null)).single()).data!.id) as string;
  };

  test('add_pantry_item: shared items have no owner or rule; personal ones default to ask first', async () => {
    const shared = await a.client.rpc('add_pantry_item', { p_name: '  Paper   towels ', p_owner_personal: false });
    expect(shared.error).toBeNull();
    expect(await row(shared.data)).toMatchObject({ household_id: h, owner_id: null, rule: null, stock: 'in_stock', name: 'Paper towels', created_by: a.id });
    const mine = await b.client.rpc('add_pantry_item', { p_name: 'Oat milk', p_owner_personal: true });
    expect(await row(mine.data)).toMatchObject({ owner_id: b.id, rule: 'ask_first' });
  });

  test('duplicates are refused per shelf, ignoring case and spacing', async () => {
    expect((await b.client.rpc('add_pantry_item', { p_name: ' PAPER  TOWELS', p_owner_personal: false })).error?.message).toContain('duplicate_item');
    expect((await b.client.rpc('add_pantry_item', { p_name: 'oat milk', p_owner_personal: true })).error?.message).toContain('duplicate_item');
    expect((await a.client.rpc('add_pantry_item', { p_name: 'Oat milk', p_owner_personal: true })).error).toBeNull(); // Aarav's own shelf
  });

  test('bad input is invalid_input', async () => {
    expect((await a.client.rpc('add_pantry_item', { p_name: '   ', p_owner_personal: false })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('add_pantry_item', { p_name: 'x'.repeat(41), p_owner_personal: false })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('add_pantry_item', { p_name: 'Salt', p_owner_personal: false, p_rule: 'ask_first' })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('add_pantry_basics', { p_names: ['Rice', ''] })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('request_restock', { p_name: 'Salt', p_effort: 4 })).error?.message).toContain('invalid_input');
  });

  test('add_pantry_basics adds the missing basics and skips what is there', async () => {
    const names = ['Olive oil', 'Rice', 'paper towels'];
    expect((await a.client.rpc('add_pantry_basics', { p_names: names })).error).toBeNull();
    expect((await b.client.rpc('add_pantry_basics', { p_names: names })).error).toBeNull();
    const { data } = await admin().from('pantry_items').select('name, stock').eq('household_id', h).is('owner_id', null).is('archived_at', null);
    expect(data!.map((r) => r.name).sort()).toEqual(['Olive oil', 'Paper towels', 'Rice']);
    expect(data!.every((r) => r.stock === 'in_stock')).toBe(true);
  });

  test("anyone sets a shared item's stock; only the owner changes a personal item", async () => {
    const rice = await idOf('Rice', null);
    const oat = await idOf('Oat milk', b.id);
    expect((await b.client.rpc('set_item_stock', { p_id: rice, p_stock: 'low' })).error).toBeNull();
    expect((await row(rice)).stock).toBe('low');
    expect((await a.client.rpc('set_item_stock', { p_id: oat, p_stock: 'out' })).error?.message).toContain('not_allowed');
    expect((await a.client.rpc('set_item_rule', { p_id: oat, p_rule: 'do_not_touch' })).error?.message).toContain('not_allowed');
    expect((await a.client.rpc('remove_pantry_item', { p_id: oat })).error?.message).toContain('not_allowed');
    expect((await b.client.rpc('set_item_rule', { p_id: oat, p_rule: 'do_not_touch' })).error).toBeNull();
    expect((await row(oat)).rule).toBe('do_not_touch');
    expect((await b.client.rpc('set_item_rule', { p_id: rice, p_rule: 'ask_first' })).error?.message).toContain('not_allowed'); // shared items have no rule
    expect((await x.client.rpc('set_item_stock', { p_id: rice, p_stock: 'out' })).error?.message).toContain('not_allowed'); // another household
  });

  test('removing archives the item and frees its name', async () => {
    const { data: id } = await a.client.rpc('add_pantry_item', { p_name: 'Ketchup', p_owner_personal: false });
    expect((await b.client.rpc('remove_pantry_item', { p_id: id })).error).toBeNull();
    expect((await row(id)).archived_at).not.toBeNull();
    expect((await a.client.rpc('add_pantry_item', { p_name: 'ketchup', p_owner_personal: false })).error).toBeNull();
  });
});

describe.skipIf(!hasDb)('restock requests', () => {
  let a: U; let b: U; let c: U; let h: string;
  const shared = (name: string, stock = 'in_stock') => seedItem(h, a.id, { name, stock });
  const req = async (id: string) => (await admin().from('restock_requests').select('*').eq('id', id).single()).data!;
  const stockOf = async (id: string) => (await admin().from('pantry_items').select('stock').eq('id', id).single()).data!.stock;
  beforeAll(async () => {
    [a, b, c] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima')]);
    h = await seedHousehold(a.id, [b.id, c.id]);
  });

  test('requesting from an item marks it out, tells everyone else, and logs it', async () => {
    const towels = await shared('Paper towels');
    const { data: rid, error } = await b.client.rpc('request_restock', { p_item: towels, p_effort: 2 });
    expect(error).toBeNull();
    expect(await req(rid)).toMatchObject({ item_id: towels, name: 'Paper towels', effort: 2, requested_by: b.id, status: 'open', claimed_by: null });
    expect(await stockOf(towels)).toBe('out');
    const { data: notes } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'restock');
    expect(notes!.map((n) => n.user_id).sort()).toEqual([a.id, c.id].sort());
    for (const n of notes!) expect(n.payload).toEqual({ actor: 'Priya', item: 'Paper towels' });
    const { data: log } = await admin().from('activity').select('kind, payload').eq('household_id', h).eq('kind', 'restock_requested');
    expect(log).toEqual([{ kind: 'restock_requested', payload: { actor: 'Priya', item: 'Paper towels' } }]);
  });

  test('one open request per item', async () => {
    const salt = await shared('Salt');
    expect((await a.client.rpc('request_restock', { p_item: salt, p_effort: 1 })).error).toBeNull();
    expect((await b.client.rpc('request_restock', { p_item: salt, p_effort: 1 })).error?.message).toContain('already_requested');
    expect((await b.client.rpc('request_restock', { p_name: ' SALT ', p_effort: 1 })).error?.message).toContain('already_requested');
  });

  test('a low item stays low; free text links to a matching shared item or stands alone', async () => {
    const rice = await shared('Rice', 'low');
    const { data: r1 } = await a.client.rpc('request_restock', { p_name: ' rice ', p_effort: 1 });
    expect((await req(r1)).item_id).toBe(rice);
    expect(await stockOf(rice)).toBe('low');
    const { data: r2 } = await a.client.rpc('request_restock', { p_name: 'Dish soap', p_effort: 1 });
    expect(await req(r2)).toMatchObject({ item_id: null, name: 'Dish soap' });
  });

  test('personal items cannot be restock-requested', async () => {
    const { data: mine } = await b.client.rpc('add_pantry_item', { p_name: 'Protein shake', p_owner_personal: true, p_rule: 'do_not_touch' });
    expect((await b.client.rpc('request_restock', { p_item: mine, p_effort: 1 })).error?.message).toContain('not_allowed');
  });

  test('claim race: exactly one roommate wins; only the claimer can unclaim', async () => {
    const { data: rid } = await a.client.rpc('request_restock', { p_name: 'Bin bags', p_effort: 1 });
    const results = await Promise.all([b.client.rpc('claim_restock', { p_id: rid }), c.client.rpc('claim_restock', { p_id: rid })]);
    const errors = results.filter((r) => r.error);
    expect(errors).toHaveLength(1);
    expect(errors[0].error!.message).toContain('already_claimed');
    const winner = (await req(rid)).claimed_by === b.id ? b : c;
    const loser = winner === b ? c : b;
    expect((await loser.client.rpc('unclaim_restock', { p_id: rid })).error?.message).toContain('not_allowed');
    expect((await winner.client.rpc('unclaim_restock', { p_id: rid })).error).toBeNull();
    expect((await req(rid)).claimed_by).toBeNull();
  });

  test("completing sets the item in stock, tells the requester, touches no ledger, and is safe to replay", async () => {
    const milk = await shared('Milk');
    const { data: rid } = await b.client.rpc('request_restock', { p_item: milk, p_effort: 3 });
    expect((await c.client.rpc('complete_restock', { p_id: rid })).error).toBeNull();
    expect((await c.client.rpc('complete_restock', { p_id: rid })).error).toBeNull(); // offline replay
    expect(await req(rid)).toMatchObject({ status: 'done', done_by: c.id, claimed_by: c.id });
    expect(await stockOf(milk)).toBe('in_stock');
    const { data: notes } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'restock_done');
    expect(notes).toEqual([{ user_id: b.id, payload: { actor: 'Nima', item: 'Milk' } }]);
    const { data: ledger } = await admin().from('effort_ledger').select('balance').eq('household_id', h);
    expect(ledger!.every((l) => l.balance === 0)).toBe(true);
    const { data: log } = await admin().from('activity').select('payload').eq('household_id', h).eq('kind', 'restocked');
    expect(log).toEqual([{ payload: { actor: 'Nima', item: 'Milk' } }]);
  });

  test("someone else's claimed request cannot be completed by you", async () => {
    const { data: rid } = await a.client.rpc('request_restock', { p_name: 'Coffee', p_effort: 1 });
    await b.client.rpc('claim_restock', { p_id: rid });
    expect((await c.client.rpc('complete_restock', { p_id: rid })).error?.message).toContain('already_claimed');
  });

  test('only the requester cancels; marking the item in stock closes the request and tells the claimer', async () => {
    const tea = await shared('Tea');
    const { data: rid } = await a.client.rpc('request_restock', { p_item: tea, p_effort: 1 });
    expect((await b.client.rpc('cancel_restock', { p_id: rid })).error?.message).toContain('not_allowed');
    await b.client.rpc('claim_restock', { p_id: rid });
    expect((await c.client.rpc('set_item_stock', { p_id: tea, p_stock: 'in_stock' })).error).toBeNull();
    expect((await req(rid)).status).toBe('cancelled');
    const { data: notes } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'restock_closed');
    expect(notes).toEqual([{ user_id: b.id, payload: { item: 'Tea' } }]);
    const { data: own } = await a.client.rpc('request_restock', { p_name: 'Sponges', p_effort: 1 });
    expect((await a.client.rpc('cancel_restock', { p_id: own })).error).toBeNull();
    expect((await req(own)).status).toBe('cancelled');
  });

  test('removing an item cancels its open request', async () => {
    const jam = await shared('Jam');
    const { data: rid } = await a.client.rpc('request_restock', { p_item: jam, p_effort: 1 });
    expect((await b.client.rpc('remove_pantry_item', { p_id: jam })).error).toBeNull();
    expect((await req(rid)).status).toBe('cancelled');
  });
});

describe.skipIf(!hasDb)('asks', () => {
  let a: U; let b: U; let c: U; let h: string; let oat: string; let shake: string;
  beforeAll(async () => {
    [a, b, c] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima')]);
    h = await seedHousehold(a.id, [b.id, c.id]);
    oat = (await b.client.rpc('add_pantry_item', { p_name: 'Oat milk', p_owner_personal: true })).data;
    shake = (await b.client.rpc('add_pantry_item', { p_name: 'Protein shake', p_owner_personal: true, p_rule: 'do_not_touch' })).data;
  });

  test("you can only ask about a roommate's ask-first item", async () => {
    expect((await b.client.rpc('ask_to_use', { p_item: oat })).error?.message).toContain('not_allowed'); // own item
    expect((await a.client.rpc('ask_to_use', { p_item: shake })).error?.message).toContain('not_allowed'); // do not touch
    const { data: bread } = await a.client.rpc('add_pantry_item', { p_name: 'Bread', p_owner_personal: false });
    expect((await a.client.rpc('ask_to_use', { p_item: bread })).error?.message).toContain('not_allowed'); // shared
  });

  test('an ask notifies the owner once; asking again while pending returns the same ask', async () => {
    const first = await a.client.rpc('ask_to_use', { p_item: oat });
    expect(first.error).toBeNull();
    expect((await a.client.rpc('ask_to_use', { p_item: oat })).data).toBe(first.data);
    const { data: notes } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'ask');
    expect(notes).toEqual([{ user_id: b.id, payload: { actor: 'Aarav', item: 'Oat milk' } }]);
    expect((await admin().from('activity').select('id').eq('household_id', h)).data).toEqual([]); // never in the household feed
  });

  test('only the owner answers; the asker hears back', async () => {
    const { data: ask } = await admin().from('pantry_asks').select('id').eq('item_id', oat).eq('status', 'pending').single();
    expect((await c.client.rpc('answer_ask', { p_ask: ask!.id, p_yes: true })).error?.message).toContain('not_allowed');
    expect((await a.client.rpc('answer_ask', { p_ask: ask!.id, p_yes: true })).error?.message).toContain('not_allowed');
    expect((await b.client.rpc('answer_ask', { p_ask: ask!.id, p_yes: true })).error).toBeNull();
    expect((await b.client.rpc('answer_ask', { p_ask: ask!.id, p_yes: true })).error).toBeNull(); // offline replay
    const { data: notes } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'ask_answer');
    expect(notes).toEqual([{ user_id: a.id, payload: { actor: 'Priya', item: 'Oat milk', accepted: true } }]);
  });

  test('an unanswered ask lapses after 24 h and can be asked again', async () => {
    const { data: id } = await c.client.rpc('ask_to_use', { p_item: oat });
    await admin().from('pantry_asks').update({ created_at: new Date(Date.now() - 25 * 3_600_000).toISOString() }).eq('id', id);
    expect((await b.client.rpc('answer_ask', { p_ask: id, p_yes: true })).error?.message).toContain('not_allowed');
    const { data: fresh } = await c.client.rpc('ask_to_use', { p_item: oat });
    expect(fresh).toBeTruthy();
    expect(fresh).not.toBe(id);
  });
});

describe.skipIf(!hasDb)('pantry and membership', () => {
  test('a member who leaves takes their shelf with them and drops their claims', async () => {
    const [a, b] = await Promise.all([makeUser('Aarav'), makeUser('Priya')]);
    await seedHousehold(a.id, [b.id]);
    const { data: mine } = await b.client.rpc('add_pantry_item', { p_name: 'Hot sauce', p_owner_personal: true, p_rule: 'do_not_touch' });
    const { data: rid } = await a.client.rpc('request_restock', { p_name: 'Rice', p_effort: 1 });
    await b.client.rpc('claim_restock', { p_id: rid });
    expect((await b.client.rpc('leave_household')).error).toBeNull();
    expect((await admin().from('pantry_items').select('archived_at').eq('id', mine).single()).data!.archived_at).not.toBeNull();
    expect((await admin().from('restock_requests').select('claimed_by, status').eq('id', rid).single()).data).toEqual({ claimed_by: null, status: 'open' });
  });

  test('pantry RPCs are for signed-in members only', async () => {
    const anon = createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    expect((await anon.rpc('add_pantry_item', { p_name: 'X', p_owner_personal: false })).error).not.toBeNull();
    const lone = await makeUser('Lone');
    expect((await lone.client.rpc('add_pantry_item', { p_name: 'X', p_owner_personal: false })).error?.message).toContain('not_member');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/db/pantry.test.ts`
Expected: the RLS block still passes; the new blocks FAIL, with `Could not find the function public.add_pantry_item(...)` in the schema cache.

- [ ] **Step 3: Create `supabase/migrations/20261001000012_pantry_rpc.sql`**

```sql
-- Milestone 2: pantry RPCs. Every write is a security-definer RPC scoped to the caller's household.

-- Item and request names: trimmed, inner whitespace collapsed, 1-40 characters.
create function private.clean_name(p text) returns text
language plpgsql immutable set search_path = public, pg_temp as $$
declare n text := regexp_replace(trim(coalesce(p, '')), '\s+', ' ', 'g');
begin
  if char_length(n) not between 1 and 40 then raise exception 'invalid_input'; end if;
  return n;
end $$;

create function add_pantry_item(p_name text, p_owner_personal boolean, p_rule pantry_rule default null)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  n text := private.clean_name(p_name);
  personal boolean := coalesce(p_owner_personal, false);
  iid uuid;
begin
  if not personal and p_rule is not null then raise exception 'invalid_input'; end if;
  insert into pantry_items (household_id, owner_id, name, rule, created_by)
  values (h, case when personal then me end, n, case when personal then coalesce(p_rule, 'ask_first'::pantry_rule) end, me)
  returning id into iid;
  return iid;
exception when unique_violation then
  raise exception 'duplicate_item';
end $$;

create function add_pantry_basics(p_names text[])
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  n text;
begin
  if p_names is null or cardinality(p_names) > 12 then raise exception 'invalid_input'; end if;
  foreach n in array p_names loop
    -- already on the shelf (or a concurrent tap won): skip quietly
    insert into pantry_items (household_id, name, created_by) values (h, private.clean_name(n), me) on conflict do nothing;
  end loop;
end $$;

create function set_item_stock(p_id uuid, p_stock stock_level)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  it pantry_items;
  r restock_requests;
begin
  if p_stock is null then raise exception 'invalid_input'; end if;
  select * into it from pantry_items where id = p_id and household_id = h and archived_at is null for update;
  if not found or (it.owner_id is not null and it.owner_id <> me) then raise exception 'not_allowed'; end if;
  update pantry_items set stock = p_stock, updated_at = now() where id = it.id;
  if p_stock = 'in_stock' then
    -- it's back: anyone's open request on it is no longer needed
    update restock_requests set status = 'cancelled' where item_id = it.id and status = 'open' returning * into r;
    if r.claimed_by is not null and r.claimed_by <> me then
      perform private.notify(r.claimed_by, h, 'restock_closed', jsonb_build_object('item', it.name));
    end if;
  end if;
end $$;

create function set_item_rule(p_id uuid, p_rule pantry_rule)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
begin
  if p_rule is null then raise exception 'invalid_input'; end if;
  update pantry_items set rule = p_rule, updated_at = now()
  where id = p_id and household_id = h and owner_id = me and archived_at is null;
  if not found then raise exception 'not_allowed'; end if;
end $$;

create function remove_pantry_item(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  it pantry_items;
begin
  select * into it from pantry_items where id = p_id and household_id = h and archived_at is null for update;
  if not found or (it.owner_id is not null and it.owner_id <> me) then raise exception 'not_allowed'; end if;
  update pantry_items set archived_at = now(), updated_at = now() where id = it.id;
  update restock_requests set status = 'cancelled' where item_id = it.id and status = 'open';
end $$;

create function request_restock(p_item uuid default null, p_name text default null, p_effort smallint default 1)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  it pantry_items;
  n text;
  rid uuid;
begin
  if p_effort is null or p_effort not between 1 and 3 then raise exception 'invalid_input'; end if;
  if p_item is not null then
    select * into it from pantry_items where id = p_item and household_id = h and archived_at is null for update;
    if not found or it.owner_id is not null then raise exception 'not_allowed'; end if; -- shared items only
  else
    n := private.clean_name(p_name);
    -- free text that names a shared item links to it
    select * into it from pantry_items
    where household_id = h and owner_id is null and archived_at is null and lower(name) = lower(n) for update;
  end if;
  if it.id is not null and exists (select 1 from restock_requests where item_id = it.id and status = 'open') then
    raise exception 'already_requested';
  end if;
  n := coalesce(it.name, n);
  insert into restock_requests (household_id, item_id, name, effort, requested_by)
  values (h, it.id, n, p_effort, me) returning id into rid;
  if it.id is not null and it.stock = 'in_stock' then
    update pantry_items set stock = 'out', updated_at = now() where id = it.id;
  end if;
  perform private.log(h, 'restock_requested', me, jsonb_build_object('actor', private.name(me), 'item', n));
  perform private.notify_household(h, 'restock', jsonb_build_object('actor', private.name(me), 'item', n), me);
  return rid;
exception when unique_violation then
  raise exception 'already_requested'; -- a concurrent request on the same item won
end $$;

create function claim_restock(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  r restock_requests;
begin
  select * into r from restock_requests where id = p_id and household_id = h for update;
  if not found or r.status <> 'open' then raise exception 'not_allowed'; end if;
  if r.claimed_by = me then return; end if; -- replay
  if r.claimed_by is not null then raise exception 'already_claimed'; end if;
  update restock_requests set claimed_by = me where id = r.id;
end $$;

create function unclaim_restock(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  r restock_requests;
begin
  select * into r from restock_requests where id = p_id and household_id = h for update;
  if not found or r.status <> 'open' then raise exception 'not_allowed'; end if;
  if r.claimed_by is null then return; end if; -- replay
  if r.claimed_by <> me then raise exception 'not_allowed'; end if;
  update restock_requests set claimed_by = null where id = r.id;
end $$;

-- Effort counts toward the completer's fair share for the week (get_state / weekTotals); no ledger change for anyone.
create function complete_restock(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  r restock_requests;
begin
  select * into r from restock_requests where id = p_id and household_id = h for update;
  if not found then raise exception 'not_allowed'; end if;
  if r.status = 'done' and r.done_by = me then return; end if; -- replay
  if r.status <> 'open' then raise exception 'not_allowed'; end if;
  if r.claimed_by is not null and r.claimed_by <> me then raise exception 'already_claimed'; end if;
  update restock_requests set status = 'done', done_by = me, done_at = now(), claimed_by = me where id = r.id;
  if r.item_id is not null then
    update pantry_items set stock = 'in_stock', updated_at = now() where id = r.item_id and archived_at is null;
  end if;
  perform private.log(h, 'restocked', me, jsonb_build_object('actor', private.name(me), 'item', r.name));
  if r.requested_by <> me then
    perform private.notify(r.requested_by, h, 'restock_done', jsonb_build_object('actor', private.name(me), 'item', r.name));
  end if;
end $$;

create function cancel_restock(p_id uuid)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  r restock_requests;
begin
  select * into r from restock_requests where id = p_id and household_id = h for update;
  if not found or r.requested_by <> me then raise exception 'not_allowed'; end if;
  if r.status = 'cancelled' then return; end if; -- replay
  if r.status <> 'open' then raise exception 'not_allowed'; end if;
  update restock_requests set status = 'cancelled' where id = r.id;
  if r.claimed_by is not null and r.claimed_by <> me then
    perform private.notify(r.claimed_by, h, 'restock_closed', jsonb_build_object('item', r.name));
  end if;
end $$;

create function ask_to_use(p_item uuid)
returns uuid language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  it pantry_items;
  aid uuid;
begin
  select * into it from pantry_items where id = p_item and household_id = h and archived_at is null;
  if not found or it.owner_id is null or it.owner_id = me or it.rule <> 'ask_first' then raise exception 'not_allowed'; end if;
  -- an ask nobody answered within 24 h has quietly lapsed (no notification)
  delete from pantry_asks where item_id = it.id and from_user = me and status = 'pending' and created_at <= now() - interval '24 hours';
  select id into aid from pantry_asks where item_id = it.id and from_user = me and status = 'pending';
  if aid is not null then return aid; end if; -- already waiting (double tap, replay)
  insert into pantry_asks (household_id, item_id, from_user, to_user) values (h, it.id, me, it.owner_id) returning id into aid;
  perform private.notify(it.owner_id, h, 'ask', jsonb_build_object('actor', private.name(me), 'item', it.name));
  return aid;
end $$;

create function answer_ask(p_ask uuid, p_yes boolean)
returns void language plpgsql security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := private.me();
  h uuid := private.my_household();
  a pantry_asks;
  answer ask_status := case when p_yes then 'yes'::ask_status else 'no'::ask_status end;
begin
  select * into a from pantry_asks where id = p_ask and household_id = h for update;
  if not found or a.to_user <> me or p_yes is null then raise exception 'not_allowed'; end if;
  if a.status = answer then return; end if; -- replay
  if a.status <> 'pending' or a.created_at <= now() - interval '24 hours' then raise exception 'not_allowed'; end if;
  update pantry_asks set status = answer, answered_at = now() where id = a.id;
  perform private.notify(a.from_user, h, 'ask_answer', jsonb_build_object(
    'actor', private.name(me), 'item', (select name from pantry_items where id = a.item_id), 'accepted', p_yes));
end $$;

-- Leaving also takes your shelf with you and frees anything you claimed from the pool.
create or replace function private.depart(h uuid, u uuid) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare was_owner boolean; code text;
begin
  select role = 'owner' into was_owner from members where household_id = h and user_id = u and left_at is null;
  update members set left_at = now(), role = 'member' where household_id = h and user_id = u and left_at is null;
  update assignments set status = 'missed'
    where household_id = h and user_id = u and status = 'todo' and day >= private.today(h);
  update swap_requests set status = 'declined'
    where household_id = h and status = 'pending' and (from_user = u or to_user = u);
  update pantry_items set archived_at = now(), updated_at = now()
    where household_id = h and owner_id = u and archived_at is null;
  update restock_requests set claimed_by = null
    where household_id = h and status = 'open' and claimed_by = u;
  if was_owner then
    update members set role = 'owner'
    where household_id = h and user_id = (
      select user_id from members where household_id = h and left_at is null order by joined_at limit 1);
  end if;
  if not exists (select 1 from members where household_id = h and left_at is null) then
    -- empty household: the old invite code must stop working
    loop
      code := private.gen_code();
      exit when not exists (select 1 from households where invite_code = code);
    end loop;
    update households set invite_code = code where id = h;
  end if;
  perform private.log(h, 'left', u, jsonb_build_object('actor', private.name(u)));
end $$;

-- Signed-in users only. Granted one by one: "grant ... on all functions" would also re-grant every srv_* function.
do $$
declare f text;
begin
  foreach f in array array[
    'add_pantry_item(text, boolean, pantry_rule)', 'add_pantry_basics(text[])', 'set_item_stock(uuid, stock_level)',
    'set_item_rule(uuid, pantry_rule)', 'remove_pantry_item(uuid)', 'request_restock(uuid, text, smallint)',
    'claim_restock(uuid)', 'unclaim_restock(uuid)', 'complete_restock(uuid)', 'cancel_restock(uuid)',
    'ask_to_use(uuid)', 'answer_ask(uuid, boolean)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
```

- [ ] **Step 4: Push the migration to dev**

```bash
export SUPABASE_ACCESS_TOKEN="$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2- | tr -d '\r')"; P="$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2- | tr -d '\r')"; npx supabase db push --linked --password "$P"
```
Expected: `Applying migration 20261001000012_pantry_rpc.sql...` then `Finished supabase db push.`

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/db/pantry.test.ts tests/db/rpc.test.ts`
Expected: PASS. All pantry blocks pass, and the M1 `rpc.test.ts` still passes, including `leaving cancels pending swaps` (the rewritten `depart`).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261001000012_pantry_rpc.sql tests/db/pantry.test.ts
git commit -F - <<'EOF'
feat(db): pantry RPCs for items, restock requests and asks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 5: `get_state` pantry fields, app types, state plumbing and weekTotals

**Files:**
- Create: `supabase/migrations/20261001000013_pantry_state.sql`
- Modify: `tests/db/pantry.test.ts` (append)
- Modify: `src/lib/types.ts`
- Modify: `src/lib/state.ts` (`fetchState` defaults, `ACTION_RPCS`, realtime `TABLES`)
- Modify: `src/lib/selectors.ts` (`weekTotals`)
- Modify: `src/lib/selectors.test.ts`, `src/lib/state.test.ts`, `src/lib/gate.test.ts`, `src/test-utils.tsx`

**Interfaces:**
- Consumes: `PantryItem`, `Restock`, `PantryAsk` (Task 2, `@domain/pantry.ts`); `restockTotals` (Task 2, `@domain/restock.ts`); the Task 4 RPC names.
- Produces:
  - `get_state()` gains three fields:
    - `pantry: PantryItem[]`: active items, by name.
    - `restocks: Restock[]`: open requests, plus requests done since this week's Monday. `done_day` is the household-local date.
    - `asks: PantryAsk[]`: the caller's pending asks (either direction, under 24 h old, on active items), plus the caller's own asks answered within 24 h. This way the asker sees "Priya said sure".
  - `AppState` gains `pantry`, `restocks` and `asks`; `src/lib/types.ts` re-exports `PantryItem`, `Restock` and `PantryAsk`.
  - `ACTION_RPCS` gains all 12 pantry RPC names.
  - `fixture()` in `src/test-utils.tsx` defaults the three fields to `[]`.
  - `weekTotals(s, weekStart)` adds `restockTotals(s.restocks, weekStart)`.

Spec gap resolved here: the spec's `asks` field holds "only the caller's own pending asks". Once the owner answered, the asker would then see nothing in the app, and without push they would never learn the answer. So the asker also gets their own asks answered in the last 24 h. Those are still only visible to the two people involved.

- [ ] **Step 1: Write the failing tests**

Append to `tests/db/pantry.test.ts`:

```ts
const todayKtm = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());

describe.skipIf(!hasDb)('get_state pantry', () => {
  test("active items, open and this week's done requests, and only my own asks", async () => {
    const [a, b, c] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima')]);
    await seedHousehold(a.id, [b.id, c.id]);
    const { data: oat } = await b.client.rpc('add_pantry_item', { p_name: 'Oat milk', p_owner_personal: true });
    const { data: gone } = await a.client.rpc('add_pantry_item', { p_name: 'Old jam', p_owner_personal: false });
    await a.client.rpc('remove_pantry_item', { p_id: gone });
    const { data: open } = await a.client.rpc('request_restock', { p_name: 'Rice', p_effort: 1 });
    const { data: done } = await a.client.rpc('request_restock', { p_name: 'Salt', p_effort: 3 });
    await c.client.rpc('complete_restock', { p_id: done });
    const { data: cancelled } = await a.client.rpc('request_restock', { p_name: 'Tea', p_effort: 1 });
    await a.client.rpc('cancel_restock', { p_id: cancelled });
    const { data: ask } = await a.client.rpc('ask_to_use', { p_item: oat });

    const asA = (await a.client.rpc('get_state')).data;
    expect(asA.pantry.map((i: { name: string }) => i.name)).toEqual(['Oat milk']);
    expect(asA.pantry[0]).toMatchObject({ id: oat, owner_id: b.id, rule: 'ask_first', stock: 'in_stock' });
    expect(asA.restocks.map((r: { id: string }) => r.id).sort()).toEqual([open, done].sort());
    expect(asA.restocks.find((r: { id: string }) => r.id === done)).toMatchObject({ status: 'done', done_by: c.id, done_day: todayKtm(), effort: 3 });
    expect(asA.asks.map((x: { id: string }) => x.id)).toEqual([ask]);
    expect((await b.client.rpc('get_state')).data.asks.map((x: { id: string }) => x.id)).toEqual([ask]);
    expect((await c.client.rpc('get_state')).data.asks).toEqual([]);

    // answered: the asker still sees the answer for a day; the owner no longer has anything to do
    await b.client.rpc('answer_ask', { p_ask: ask, p_yes: false });
    expect((await a.client.rpc('get_state')).data.asks).toMatchObject([{ id: ask, status: 'no' }]);
    expect((await b.client.rpc('get_state')).data.asks).toEqual([]);
  });
});
```

In `src/lib/selectors.test.ts`, replace the import lines

```ts
import { myTasksOn, nextUp, pendingDraft, pool, roommates, unreadCount, weekDates, weekTotals } from './selectors';
import type { AppState, Assignment } from './types';
```
with
```ts
import { myTasksOn, nextUp, pendingDraft, pool, roommates, unreadCount, weekDates, weekTotals } from './selectors';
import type { AppState, Assignment, Restock } from './types';
```

In the same file, replace

```ts
  assignments, swaps: [], streak: null, balance: 0, activity: [], today: '2026-10-01', ...over,
```
with
```ts
  assignments, swaps: [], streak: null, balance: 0, activity: [], pantry: [], restocks: [], asks: [], today: '2026-10-01', ...over,
```

and add this test directly after the existing `weekTotals sums planned points per person, ignoring expired` test (inside the `describe`):

```ts
  test('weekTotals adds restocks done that week to whoever did them', () => {
    const r = (over: Partial<Restock>): Restock => ({
      id: crypto.randomUUID(), item_id: null, name: 'Rice', effort: 2, requested_by: 'p', claimed_by: null, status: 'done',
      done_by: 'me', done_day: '2026-10-01', created_at: '2026-10-01T00:00:00Z', ...over,
    });
    const s = state([a({ effort: 1, user_id: 'p' })], {
      restocks: [r({}), r({ done_by: 'p', effort: 3, done_day: '2026-09-27' }), r({ status: 'open', done_by: null, done_day: null })],
    });
    expect(weekTotals(s, '2026-09-28')).toEqual({ me: 2, p: 1 });
  });
```

In `src/lib/state.test.ts`, append:

```ts
test('every pantry RPC is an action, so an offline tap replays after a restart', () => {
  expect(ACTION_RPCS).toEqual(expect.arrayContaining([
    'add_pantry_item', 'add_pantry_basics', 'set_item_stock', 'set_item_rule', 'remove_pantry_item', 'request_restock',
    'claim_restock', 'unclaim_restock', 'complete_restock', 'cancel_restock', 'ask_to_use', 'answer_ask',
  ]));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/selectors.test.ts src/lib/state.test.ts tests/db/pantry.test.ts`
Expected: FAIL. `weekTotals adds restocks…` gets `{ me: 0… }` / `{ p: 1 }` without `me`; the `ACTION_RPCS` test is missing names; `get_state pantry` reads `undefined` for `asA.pantry`.

- [ ] **Step 3: Create `supabase/migrations/20261001000013_pantry_state.sql`**

```sql
-- get_state gains the pantry: active items, open + this week's done restock requests, and the caller's own asks.
create or replace function get_state() returns jsonb
language plpgsql stable security definer set search_path = public, private, pg_temp as $$
declare
  me uuid := auth.uid();
  h uuid;
  today date;
  zone text;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  select household_id into h from members where user_id = me and left_at is null;
  if h is null then
    return jsonb_build_object('profile', (select to_jsonb(p) from profiles p where p.id = me), 'household', null);
  end if;
  select (now() at time zone x.tz)::date, x.tz into today, zone from households x where x.id = h;
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
    'assignments', (select coalesce(jsonb_agg(
        case when a.user_id <> me and a.reason->>'code' in ('debt', 'credit')
             then to_jsonb(a) || jsonb_build_object('reason', null)
             else to_jsonb(a) end
        order by a.day), '[]'::jsonb)
      from assignments a where a.household_id = h and a.day between today - 7 and today + 13),
    'swaps', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
      from swap_requests s where s.household_id = h and s.status = 'pending'),
    'streak', (select to_jsonb(s) from streaks s where s.household_id = h),
    'balance', coalesce((select l.balance from effort_ledger l where l.household_id = h and l.user_id = me), 0),
    'activity', (select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (select * from activity where household_id = h order by created_at desc limit 50) x),
    'pantry', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id, 'owner_id', i.owner_id, 'name', i.name, 'rule', i.rule, 'stock', i.stock, 'created_at', i.created_at)
        order by lower(i.name)), '[]'::jsonb)
      from pantry_items i where i.household_id = h and i.archived_at is null),
    -- open requests, plus this week's completed ones (their effort counts toward the completer's fair share)
    'restocks', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', r.id, 'item_id', r.item_id, 'name', r.name, 'effort', r.effort, 'requested_by', r.requested_by,
        'claimed_by', r.claimed_by, 'status', r.status, 'done_by', r.done_by,
        'done_day', (r.done_at at time zone zone)::date, 'created_at', r.created_at)
        order by r.created_at), '[]'::jsonb)
      from restock_requests r
      where r.household_id = h and (r.status = 'open'
        or (r.status = 'done' and (r.done_at at time zone zone)::date >= date_trunc('week', today)::date))),
    -- private to the two people: my live asks either way, and my own asks answered in the last day
    'asks', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', k.id, 'item_id', k.item_id, 'from_user', k.from_user, 'to_user', k.to_user, 'status', k.status, 'created_at', k.created_at)
        order by k.created_at), '[]'::jsonb)
      from pantry_asks k join pantry_items i on i.id = k.item_id and i.archived_at is null
      where k.household_id = h and (
        (k.status = 'pending' and k.created_at > now() - interval '24 hours' and me in (k.from_user, k.to_user))
        or (k.status <> 'pending' and k.from_user = me and k.answered_at > now() - interval '24 hours'))),
    'today', today
  );
end $$;
revoke execute on function get_state() from public, anon;
grant execute on function get_state() to authenticated;
```

- [ ] **Step 4: Push the migration to dev**

```bash
export SUPABASE_ACCESS_TOKEN="$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2- | tr -d '\r')"; P="$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2- | tr -d '\r')"; npx supabase db push --linked --password "$P"
```
Expected: `Applying migration 20261001000013_pantry_state.sql...` then `Finished supabase db push.`

- [ ] **Step 5: Update the app types** — in `src/lib/types.ts`, replace

```ts
import type { AssignmentStatus, Cadence, Effort, NudgeStyle, Reason } from '@domain/types.ts';
import type { Weekday } from '@domain/time.ts';
```
with
```ts
import type { AssignmentStatus, Cadence, Effort, NudgeStyle, Reason } from '@domain/types.ts';
import type { Weekday } from '@domain/time.ts';
import type { PantryAsk, PantryItem, Restock } from '@domain/pantry.ts';

// type-only: the pantry module itself never enters the entry chunk
export type { PantryAsk, PantryItem, Restock };
```

and replace

```ts
  activity: ActivityItem[];
  today: string;
}
```
with
```ts
  activity: ActivityItem[];
  pantry: PantryItem[];
  restocks: Restock[];
  asks: PantryAsk[];
  today: string;
}
```

- [ ] **Step 6: Update `src/lib/state.ts`**

Replace

```ts
  return { members: [], chores: [], plans: [], assignments: [], swaps: [], streak: null, balance: 0, activity: [], today: localToday(), ...data } as AppState;
```
with
```ts
  return {
    members: [], chores: [], plans: [], assignments: [], swaps: [], streak: null, balance: 0, activity: [],
    pantry: [], restocks: [], asks: [], today: localToday(), ...data,
  } as AppState;
```

Replace

```ts
export const ACTION_RPCS = [
  'archive_chore', 'undo_complete', 'complete_assignment', 'claim_assignment', 'approve_plan', 'respond_swap',
  'request_swap', 'update_household', 'update_profile', 'update_busy_days', 'remove_member',
] as const;
```
with
```ts
export const ACTION_RPCS = [
  'archive_chore', 'undo_complete', 'complete_assignment', 'claim_assignment', 'approve_plan', 'respond_swap',
  'request_swap', 'update_household', 'update_profile', 'update_busy_days', 'remove_member',
  'add_pantry_item', 'add_pantry_basics', 'set_item_stock', 'set_item_rule', 'remove_pantry_item', 'request_restock',
  'claim_restock', 'unclaim_restock', 'complete_restock', 'cancel_restock', 'ask_to_use', 'answer_ask',
] as const;
```

Replace

```ts
const TABLES = ['assignments', 'plans', 'swap_requests', 'members', 'chores', 'streaks', 'activity'] as const;
```
with
```ts
// pantry_asks is deliberately absent: asks are private and arrive with the next get_state
const TABLES = ['assignments', 'plans', 'swap_requests', 'members', 'chores', 'streaks', 'activity', 'pantry_items', 'restock_requests'] as const;
```

- [ ] **Step 7: Update `weekTotals` in `src/lib/selectors.ts`**

Replace

```ts
import { addDays } from '@domain/time.ts';
```
with
```ts
import { restockTotals } from '@domain/restock.ts';
import { addDays } from '@domain/time.ts';
```

Replace

```ts
export function weekTotals(s: AppState, weekStart: string): Record<string, number> {
  const plan = planForWeek(s, weekStart);
  const totals: Record<string, number> = {};
  for (const a of s.assignments) {
    if (!plan || a.plan_id !== plan.id || a.status === 'expired') continue;
    totals[a.user_id] = (totals[a.user_id] ?? 0) + a.effort;
  }
  return totals;
}
```
with
```ts
export function weekTotals(s: AppState, weekStart: string): Record<string, number> {
  const plan = planForWeek(s, weekStart);
  const totals: Record<string, number> = {};
  for (const a of s.assignments) {
    if (!plan || a.plan_id !== plan.id || a.status === 'expired') continue;
    totals[a.user_id] = (totals[a.user_id] ?? 0) + a.effort;
  }
  // a restock someone did this week counts toward their fair share (and creates no debt for anyone)
  for (const [user, pts] of Object.entries(restockTotals(s.restocks, weekStart))) totals[user] = (totals[user] ?? 0) + pts;
  return totals;
}
```

- [ ] **Step 8: Default the new fields in the test helpers**

In `src/test-utils.tsx`, replace

```ts
    activity: [],
    today,
    ...over,
```
with
```ts
    activity: [],
    pantry: [],
    restocks: [],
    asks: [],
    today,
    ...over,
```

In `src/lib/gate.test.ts`, replace

```ts
  members: [], chores: [], plans: [], assignments: [], swaps: [], streak: null, balance: 0, activity: [], today: '2026-10-01',
```
with
```ts
  members: [], chores: [], plans: [], assignments: [], swaps: [], streak: null, balance: 0, activity: [], pantry: [], restocks: [], asks: [], today: '2026-10-01',
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx vitest run src tests/db/pantry.test.ts tests/db/rls.test.ts`
Expected: PASS. All `src` tests pass, as do the `get_state pantry` block and the M1 RLS tests (`get_state returns the household…`, `a member cannot see another member's debt or credit reason`).

Run: `npx tsc -b`
Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add supabase/migrations/20261001000013_pantry_state.sql tests/db/pantry.test.ts src/lib/types.ts src/lib/state.ts src/lib/selectors.ts src/lib/selectors.test.ts src/lib/state.test.ts src/lib/gate.test.ts src/test-utils.tsx
git commit -F - <<'EOF'
feat(state): pantry, restocks and asks in get_state; restocks count toward weekly totals

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 6: Tick: stale-request digest lines, restock batching and cap exemption

**Files:**
- Create: `supabase/migrations/20261001000014_pantry_tick.sql`
- Modify (full rewrite): `supabase/functions/tick/push.ts`
- Modify: `supabase/functions/_shared/domain/tick.ts` (`pushDecision`)
- Modify: `supabase/functions/tick/push.test.ts` (append), `supabase/functions/_shared/domain/tick.test.ts` (append to `describe('pushDecision')`)
- Modify: `tests/db/pantry.test.ts` (append)

**Interfaces:**
- Consumes: `nudge`, `NudgeKind`, `NudgePayload` (Task 1); the `restock_requests.stale_noted_at` column (Task 3); `restock` notifications (Task 4).
- Produces:
  - `srv_queue_digest(p_household, p_day)`:
    - payload `{ chores: string[] }`, plus `stale: string[]` when any request has been open for more than 48 h and was not yet mentioned;
    - sent to every active member who has chores today **or** when there are stale lines;
    - marks the requests mentioned (`stale_noted_at`), so they are never repeated.
  - `srv_pending_notifications()`: `sentToday` excludes `pool` and `restock`.
  - `pushDecision`: `restock` is exempt from the 3-a-day cap (like `pool`).
  - `drainNotifications`:
    - folds every pending `restock` row for one person into one push (`payload.items`) and marks them all;
    - never counts `restock` toward the cap;
    - sends a digest that carries only stale lines.

No new cron work: the existing `*/10` tick already runs the digest and the drain.

- [ ] **Step 1: Write the failing tests**

In `supabase/functions/_shared/domain/tick.test.ts`, replace

```ts
    expect(pushDecision(12, 3, 'pool')).toBe('send'); // one batched push per sweep; its chores are still claimable
  });
});
```
with
```ts
    expect(pushDecision(12, 3, 'pool')).toBe('send'); // one batched push per sweep; its chores are still claimable
  });
  test('restock requests are exempt from the cap like pool, but still wait out quiet hours', () => {
    expect(pushDecision(12, 3, 'restock')).toBe('send');
    expect(pushDecision(12, 3, 'ask')).toBe('skip');
    expect(pushDecision(23, 0, 'restock')).toBe('defer');
  });
});
```

Append to `supabase/functions/tick/push.test.ts`:

```ts
test('restock requests waiting in one drain become one push per person, and every row is marked', async () => {
  const r = (id: number, userId: string, item: string) => note(id, { userId, kind: 'restock', payload: { actor: 'Priya', item } });
  const { client, calls } = db([r(1, 'u1', 'Milk'), r(2, 'u1', 'Rice'), r(3, 'u2', 'Milk')]);
  const send = vi.fn(async (_s: PushSub, _m: string) => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send).toHaveBeenCalledTimes(2);
  expect(JSON.parse(send.mock.calls[0][1])).toEqual({ title: 'Shopping run? 🛒', body: 'The house needs Milk and Rice. Grab one?', url: '/chores', tag: 'restock-1' });
  expect(JSON.parse(send.mock.calls[1][1]).body).toBe('Priya asked for Milk. Passing a shop?');
  expect(calls.filter((c) => c.fn === 'srv_mark_notification').map((c) => c.args))
    .toEqual([{ p_id: 1, p_skipped: false }, { p_id: 2, p_skipped: false }, { p_id: 3, p_skipped: false }]);
});

test('restock neither uses up nor is blocked by the daily cap', async () => {
  const digest = { kind: 'digest', payload: { chores: ['Bins'] } };
  const { client } = db([note(1, { sentToday: 3, kind: 'restock', payload: { actor: 'P', item: 'Milk' } }), note(2, { sentToday: 2, ...digest })]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send).toHaveBeenCalledTimes(2);
});

test('quiet hours leave batched restock rows queued', async () => {
  const { client, calls } = db([note(1, { kind: 'restock', payload: { actor: 'P', item: 'Milk' } }), note(2, { kind: 'restock', payload: { actor: 'P', item: 'Rice' } })]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, LATE);
  expect(send).not.toHaveBeenCalled();
  expect(calls.some((c) => c.fn === 'srv_mark_notification')).toBe(false);
});

test('a digest carrying only stale requests is sent', async () => {
  const { client } = db([note(1, { kind: 'digest', payload: { chores: [], stale: ['Paper towels'] } })]);
  const send = vi.fn(async (_s: PushSub, _m: string) => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(JSON.parse(send.mock.calls[0][1]).body).toBe('Still needed: Paper towels.');
});

test('pantry pushes deep-link to the right place', async () => {
  const { client } = db([
    note(1, { kind: 'ask', payload: { actor: 'Aarav', item: 'Oat milk' } }),
    note(2, { kind: 'ask_answer', payload: { actor: 'Priya', item: 'Oat milk', accepted: true } }),
    note(3, { kind: 'restock_done', payload: { actor: 'Aarav', item: 'Milk' } }),
    note(4, { userId: 'u2', kind: 'restock_closed', payload: { item: 'Tea' } }), // another person: u1 is at the cap by now
  ]);
  const send = vi.fn(async (_s: PushSub, _m: string) => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send.mock.calls.map((c) => JSON.parse(c[1]).url)).toEqual(['/pantry?tab=mine', '/pantry?tab=roommates', '/pantry', '/chores']);
});
```

Append to `tests/db/pantry.test.ts`:

```ts
describe.skipIf(!hasDb)('pantry in the tick', () => {
  test('the morning digest mentions a request open over 48 h once, to everyone, even with no chores', async () => {
    const [a, b] = await Promise.all([makeUser('StaleA'), makeUser('StaleB')]);
    const h = await seedHousehold(a.id, [b.id]);
    const ins = await admin().from('restock_requests').insert([
      { household_id: h, name: 'Paper towels', effort: 1, requested_by: a.id, created_at: new Date(Date.now() - 49 * 3_600_000).toISOString() },
      { household_id: h, name: 'Rice', effort: 1, requested_by: a.id },
    ]);
    if (ins.error) throw ins.error;
    expect((await admin().rpc('srv_queue_digest', { p_household: h, p_day: todayKtm() })).error).toBeNull();
    const { data } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'digest');
    expect(data!.map((n) => n.user_id).sort()).toEqual([a.id, b.id].sort());
    for (const n of data!) expect(n.payload).toEqual({ chores: [], stale: ['Paper towels'] });
    // the next morning it is not mentioned again (and nobody has chores, so nothing is queued)
    await admin().from('households').update({ digest_sent_for: null }).eq('id', h);
    expect((await admin().rpc('srv_queue_digest', { p_household: h, p_day: todayKtm() })).error).toBeNull();
    expect((await admin().from('notifications').select('id').eq('household_id', h).eq('kind', 'digest')).data).toHaveLength(2);
  });

  test('restock pushes do not count toward the daily cap', async () => {
    const u = await makeUser('CapR');
    const h = await seedHousehold(u.id);
    const now = new Date().toISOString();
    const ins = await admin().from('notifications').insert([
      ...[1, 2, 3].map(() => ({ user_id: u.id, household_id: h, kind: 'restock', payload: { item: 'Milk' }, sent_at: now })),
      { user_id: u.id, household_id: h, kind: 'digest', payload: { chores: ['Bins'] }, sent_at: now },
      { user_id: u.id, household_id: h, kind: 'plan_ready', payload: {} },
    ]);
    if (ins.error) throw ins.error;
    const { data } = await admin().rpc('srv_pending_notifications');
    expect((data as { userId: string; sentToday: number }[]).find((n) => n.userId === u.id)!.sentToday).toBe(1);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run supabase/functions/_shared/domain/tick.test.ts supabase/functions/tick/push.test.ts tests/db/pantry.test.ts`
Expected: FAIL.
- `pushDecision(12, 3, 'restock')` returns `'skip'`.
- The batching test sees 3 sends.
- The stale-only digest is skipped.
- The DB digest has no `stale` key, and members without chores get nothing.
- `sentToday` is 4.

- [ ] **Step 3: Create `supabase/migrations/20261001000014_pantry_tick.sql`**

```sql
-- Tick for the pantry: stale restock requests in the morning digest; restock pushes are exempt from the daily cap.

create or replace function srv_queue_digest(p_household uuid, p_day date) returns void
language plpgsql security definer set search_path = public, private, pg_temp as $$
declare r record; stale jsonb;
begin
  -- claim the day first; a concurrent run that lost the race queues nothing
  update households set digest_sent_for = p_day where id = p_household and digest_sent_for is distinct from p_day;
  if not found then return; end if;
  -- restock requests open for more than 48 h are mentioned in one morning digest, then never again
  with noted as (
    update restock_requests set stale_noted_at = now()
    where household_id = p_household and status = 'open' and stale_noted_at is null and created_at < now() - interval '48 hours'
    returning name
  )
  select coalesce(jsonb_agg(name order by name), '[]'::jsonb) into stale from noted;
  for r in
    select m.user_id, coalesce((
      select jsonb_agg(c.name order by a.effort desc)
      from assignments a join chores c on c.id = a.chore_id
      where a.household_id = p_household and a.user_id = m.user_id and a.day = p_day and a.status = 'todo'), '[]'::jsonb) as chores
    from members m where m.household_id = p_household and m.left_at is null
  loop
    continue when jsonb_array_length(r.chores) = 0 and jsonb_array_length(stale) = 0;
    perform private.notify(r.user_id, p_household, 'digest', jsonb_build_object('chores', r.chores)
      || case when jsonb_array_length(stale) > 0 then jsonb_build_object('stale', stale) else '{}'::jsonb end);
  end loop;
end $$;

-- pool and restock pushes don't count toward the 3-a-day cap (tick/push.ts exempts them on the way out too).
create or replace function srv_pending_notifications() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id, 'userId', n.user_id, 'kind', n.kind, 'payload', n.payload, 'style', p.nudge_style,
    'tz', coalesce(h.tz, 'Asia/Kathmandu'),
    'sentToday', (select count(*) from notifications n2
                  where n2.user_id = n.user_id and not n2.skipped and n2.kind not in ('pool', 'restock')
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

-- create or replace keeps existing grants; re-assert them anyway.
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

- [ ] **Step 4: Exempt `restock` in `pushDecision`** — in `supabase/functions/_shared/domain/tick.ts`, replace

```ts
  // pool is exempt (and not counted): one per member per sweep, and its chores stay claimable after quiet hours
  if (sentToday >= PUSH_DAILY_CAP && kind !== 'covered' && kind !== 'pool') return 'skip';
```
with
```ts
  // pool and restock are exempt (and not counted): batched per person, and the pool stays claimable after quiet hours
  if (sentToday >= PUSH_DAILY_CAP && kind !== 'covered' && kind !== 'pool' && kind !== 'restock') return 'skip';
```

- [ ] **Step 5: Rewrite `supabase/functions/tick/push.ts`**

```ts
import { nudge, type NudgeKind, type NudgePayload } from '../_shared/domain/nudge.ts';
import { localParts } from '../_shared/domain/time.ts';
import { pushDecision } from '../_shared/domain/tick.ts';
import type { NudgeStyle } from '../_shared/domain/types.ts';
import { call, type RpcClient } from './actions.ts';

export interface PushSub { endpoint: string; keys: { p256dh: string; auth: string } }
export type SendPush = (sub: PushSub, message: string) => Promise<{ gone: boolean }>;

interface PendingNotification {
  id: number; userId: string; kind: NudgeKind; payload: NudgePayload; style: NudgeStyle; tz: string;
  sentToday: number; subscriptions: PushSub[];
  /** ids of further restock rows folded into this one push */
  merged?: number[];
}

const DEEP_LINK: Record<NudgeKind, string> = {
  digest: '/chores', pool: '/chores', plan_ready: '/plan', plan_locked: '/plan', covered: '/profile',
  day_kept: '/', swap_request: '/plan', swap_answer: '/plan', joined: '/',
  // an ask goes to the owner (their shelf); the answer goes to the asker (the roommate's shelf)
  restock: '/chores', restock_done: '/pantry', restock_closed: '/chores', ask: '/pantry?tab=mine', ask_answer: '/pantry?tab=roommates',
};

/** Pool and restock pushes are batched per person, so they neither use up nor respect the daily cap. */
const uncounted = (kind: NudgeKind) => kind === 'pool' || kind === 'restock';

/** SSRF guard: subscriptions are user-supplied URLs, so only ever POST to the real push services. */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let u: URL;
  try { u = new URL(endpoint); } catch { return false; }
  if (u.protocol !== 'https:' || u.port) return false;
  const h = u.hostname.toLowerCase();
  return h === 'fcm.googleapis.com' || h === 'web.push.apple.com' ||
    h.endsWith('.push.services.mozilla.com') || h.endsWith('.notify.windows.com');
}

/** A restock request is queued as one row per member; each person gets one push listing every item waiting in this drain. */
function batchRestocks(pending: PendingNotification[]): PendingNotification[] {
  const heads = new Map<string, PendingNotification>();
  const out: PendingNotification[] = [];
  for (const n of pending) {
    if (n.kind !== 'restock') { out.push(n); continue; }
    const head = heads.get(n.userId);
    if (head) {
      head.payload.items!.push(n.payload.item ?? '');
      head.merged!.push(n.id);
      continue;
    }
    const first = { ...n, payload: { ...n.payload, items: [n.payload.item ?? ''] }, merged: [] };
    heads.set(n.userId, first);
    out.push(first);
  }
  return out;
}

export async function drainNotifications(db: RpcClient, send: SendPush, now = new Date()) {
  const pending = await call<PendingNotification[]>(db, 'srv_pending_notifications');
  const sent = new Map<string, number>();
  const mark = async (n: PendingNotification, skipped: boolean) => {
    for (const id of [n.id, ...(n.merged ?? [])]) await call(db, 'srv_mark_notification', { p_id: id, p_skipped: skipped });
  };
  for (const n of batchRestocks(pending ?? [])) {
    // Never push an empty digest (no chores today and nothing still needed).
    if (n.kind === 'digest' && !(n.payload.chores?.length) && !(n.payload.stale?.length)) {
      await mark(n, true);
      continue;
    }
    const sentToday = sent.get(n.userId) ?? n.sentToday;
    const decision = pushDecision(localParts(now, n.tz).hour, sentToday, n.kind);
    if (decision === 'defer') continue;
    if (decision === 'skip') {
      await mark(n, true);
      continue;
    }
    const { title, body } = nudge(n.kind, n.style, n.payload);
    const message = JSON.stringify({ title, body, url: DEEP_LINK[n.kind] ?? '/', tag: `${n.kind}-${n.id}` });
    let delivered = 0;
    for (const sub of n.subscriptions) {
      if (!isAllowedPushEndpoint(sub.endpoint)) {
        await call(db, 'srv_delete_subscription', { p_endpoint: sub.endpoint }); // treated as gone, never contacted
        continue;
      }
      const { gone } = await send(sub, message);
      if (gone) await call(db, 'srv_delete_subscription', { p_endpoint: sub.endpoint });
      else delivered++;
    }
    // Only skipped when every subscription was rejected by the allow-list (nothing user-visible happened).
    const blocked = n.subscriptions.length > 0 && n.subscriptions.every((s) => !isAllowedPushEndpoint(s.endpoint));
    await mark(n, blocked);
    if (delivered > 0 && !uncounted(n.kind)) sent.set(n.userId, sentToday + 1);
  }
}
```

- [ ] **Step 6: Push the migration to dev**

```bash
export SUPABASE_ACCESS_TOKEN="$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2- | tr -d '\r')"; P="$(grep '^SUPABASE_DB_PASSWORD=' .env.local | cut -d= -f2- | tr -d '\r')"; npx supabase db push --linked --password "$P"
```
Expected: `Applying migration 20261001000014_pantry_tick.sql...` then `Finished supabase db push.`

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run supabase/functions/_shared/domain/tick.test.ts supabase/functions/tick tests/db/pantry.test.ts tests/db/tick.test.ts`
Expected: PASS. The M1 tick tests (`srv_queue_digest twice for one day queues each member once`, `pool pushes do not count toward the daily cap`, and `an authenticated (non-service) client cannot call srv_queue_digest`) still pass.

Run: `npx tsc -b`
Expected: no output.

- [ ] **Step 8: Deploy the tick function to dev**

```bash
export SUPABASE_ACCESS_TOKEN="$(grep '^SUPABASE_ACCESS_TOKEN=' .env.local | cut -d= -f2- | tr -d '\r')"; npx supabase functions deploy tick --no-verify-jwt --use-api
```
Expected: `Deployed Functions on project <dev ref>: tick`.

- [ ] **Step 9: Commit**

```bash
git add supabase/migrations/20261001000014_pantry_tick.sql supabase/functions/tick/push.ts supabase/functions/tick/push.test.ts supabase/functions/_shared/domain/tick.ts supabase/functions/_shared/domain/tick.test.ts tests/db/pantry.test.ts
git commit -F - <<'EOF'
feat(tick): stale restock lines in the digest, one restock push per person, cap exemption

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 7: Pantry screen shell: 4th tab, lazy route, underline tabs, shelves, empty states and Add the basics

**Files:**
- Create: `src/features/pantry/Pantry.tsx`
- Create: `src/features/pantry/usePantryActions.ts`
- Create: `src/features/pantry/pantry.css` (the whole feature's styles, including the sheets and the FAB menu of Tasks 8–10)
- Create: `src/features/pantry/Pantry.test.tsx`
- Create: `src/ui/TabBar.test.tsx`
- Modify: `src/ui/TabBar.tsx`, `src/ui/ui.css` (`.tabbar__item` min-width), `src/styles/tokens.css` (pink tokens)
- Modify: `src/lib/stack.ts`, `src/lib/stack.test.ts`
- Modify: `src/App.tsx` (lazy prefetchable route)
- Modify: `src/features/home/Home.tsx` (lazy `InstallPrimer`: the bundle offset)

**Interfaces:**
- Consumes:
  - From Task 2: `BASICS`, `iconFor`, `tintFor`, `sortShelf`, `openRestockFor`, `requestedLine`, `RULE_LABEL`, `STOCK_LABEL`, `cleanName`, `sameName`, `ShelfTab`, `PantryRule`, `StockLevel`.
  - From Task 5: `AppState.pantry/restocks/asks`, `useAction` and `useMe`.
- Produces:
  - Route `/pantry`, with an optional `?tab=mine|roommates` (default shared) and an idle prefetch. `DEPTH['/pantry'] = 0`.
  - `src/features/pantry/Pantry.tsx` default export `Pantry`. Exports `rowKey(owner: string | null, name: string): string`.
  - `usePantryActions()` returns `{ add, addBasics, setStock, setRule, remove, request, ask, answer }`, each a `useAction` mutation with an optimistic update. Arguments:
    - `add`: `{ p_name, p_owner_personal, p_rule: PantryRule | null, me }`
    - `addBasics`: `{ p_names: string[], me }`
    - `setStock`: `{ p_id, p_stock }`
    - `setRule`: `{ p_id, p_rule }`
    - `remove`: `{ p_id }`
    - `request`: `{ p_item?, p_name?, p_effort: Effort, me }`
    - `ask`: `{ p_item, me, owner }`
    - `answer`: `{ p_ask, p_yes }`
  - CSS classes for Tasks 8–10:
    - `.seg--underline`, `.seg__line`, `.seg--ink`;
    - `.item-sheet*`, `.ask-card*`;
    - `.rules`, `.rule-opt*`;
    - `.sent*`;
    - `.fab-scrim`, `.fab-menu`, `.fab-pill*`.

Rows are plain `<div>`s in this task. Task 9 passes `onOpen` to turn them into buttons.

Spec gap resolved here: "Add the basics" shows on an empty Shared shelf. Its chips "animate into the list", so a tapped chip must stay on screen next to the row it became. Rule: the basics section stays while the shared shelf holds nothing but basics and at least one is missing. It goes away once a non-basic item is added or every basic is present.

- [ ] **Step 1: Write the failing tests**

Create `src/ui/TabBar.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect, test } from 'vitest';
import { TabBar } from './TabBar';

test('four tabs, Pantry third, and the current one marked', () => {
  render(<MemoryRouter initialEntries={['/pantry']}><TabBar /></MemoryRouter>);
  expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(['Home', 'Chores', 'Pantry', 'Profile']);
  const pantry = screen.getByRole('link', { name: 'Pantry' });
  expect(pantry).toHaveAttribute('href', '/pantry');
  expect(pantry).toHaveAttribute('aria-current', 'page');
});
```

In `src/lib/stack.test.ts`, replace

```ts
test('every tab shares one stack entry', () => {
  expect(stackKey('/')).toBe('tabs');
  expect(stackKey('/profile')).toBe('tabs');
```
with
```ts
test('every tab shares one stack entry', () => {
  expect(stackKey('/')).toBe('tabs');
  expect(stackKey('/profile')).toBe('tabs');
  expect(stackKey('/pantry')).toBe('tabs');
  expect(navDirection('/pantry', '/chores', 'PUSH')).toBe('none');
  expect(navDirection('/pantry', '/activity', 'PUSH')).toBe('push');
```

Create `src/features/pantry/Pantry.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import type { AppState, PantryAsk, PantryItem, Restock } from '../../lib/types';
import Pantry from './Pantry';

const db = vi.hoisted(() => ({
  rpc: vi.fn(async () => ({ data: null, error: null })),
  functions: { invoke: vi.fn(async () => ({ data: null, error: null })) },
}));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

let n = 0;
const item = (over: Partial<PantryItem>): PantryItem =>
  ({ id: `i${++n}`, owner_id: null, name: 'Milk', rule: null, stock: 'in_stock', created_at: '2026-10-01T00:00:00Z', ...over });
const restock = (over: Partial<Restock>): Restock => ({
  id: `r${++n}`, item_id: null, name: 'Rice', effort: 1, requested_by: 'p', claimed_by: null, status: 'open',
  done_by: null, done_day: null, created_at: '2026-10-01T00:00:00Z', ...over,
});
const ask = (over: Partial<PantryAsk>): PantryAsk =>
  ({ id: `k${++n}`, item_id: '', from_user: 'p', to_user: 'me', status: 'pending', created_at: '2026-10-01T00:00:00Z', ...over });
const house = (over: Partial<AppState> = {}) => fixture({
  members: [
    { user_id: 'me', name: 'Rahul', color: '#d1fae5', role: 'owner', busy_days: [] },
    { user_id: 'p', name: 'Priya', color: '#dbeafe', role: 'member', busy_days: [] },
    { user_id: 'n', name: 'Nima', color: '#ffedd5', role: 'member', busy_days: [] },
  ],
  ...over,
});
const open = (state: AppState, route = '/pantry') => renderWithState(<Pantry />, { state, route, path: '/pantry' });
/** Row names in order (the icon and the tag are separate elements). */
const shelfNames = (list: HTMLElement) => [...list.querySelectorAll('.pantry-row__name')].map((e) => e.firstChild?.textContent);

test('the shared shelf lists out, then low, then in stock, alphabetically, with stock tags only when not in stock', () => {
  open(house({ pantry: [item({ name: 'salt' }), item({ name: 'Bread', stock: 'low' }), item({ name: 'Rice', stock: 'out' }),
    item({ name: 'Apples' }), item({ name: 'Oat milk', owner_id: 'me', rule: 'ask_first' })] }));
  const list = screen.getByRole('list', { name: 'Shared items' });
  expect(shelfNames(list)).toEqual(['Rice', 'Bread', 'Apples', 'salt']);
  expect(within(list).getByText('Out')).toBeInTheDocument();
  expect(within(list).getByText('Running low')).toBeInTheDocument();
  expect(within(list).queryByText('In stock')).toBeNull();
});

test('a requested item says who is on it', () => {
  const rice = item({ name: 'Rice', stock: 'out' });
  const salt = item({ name: 'Salt', stock: 'out' });
  open(house({ pantry: [rice, salt], restocks: [restock({ item_id: rice.id, claimed_by: 'p' }), restock({ item_id: salt.id, name: 'Salt' })] }));
  expect(screen.getByText("Requested · Priya's on it")).toBeInTheDocument();
  expect(screen.getByText('Requested')).toBeInTheDocument();
});

test('tabs switch shelves, with rule tags on personal items', async () => {
  open(house({ pantry: [item({ name: 'Rice' }), item({ name: 'Oat milk', owner_id: 'me', rule: 'ask_first' }),
    item({ name: 'Protein shake', owner_id: 'p', rule: 'do_not_touch' })] }));
  await userEvent.click(screen.getByRole('tab', { name: 'My Items' }));
  expect(screen.getByRole('tab', { name: 'My Items' })).toHaveAttribute('aria-selected', 'true');
  const mine = screen.getByRole('list', { name: 'My items' });
  expect(shelfNames(mine)).toEqual(['Oat milk']);
  expect(within(mine).getByText('Ask first')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Roommates' }));
  expect(within(screen.getByRole('list', { name: "Priya's items" })).getByText('Do not touch')).toBeInTheDocument();
});

test('a deep link opens on its tab, and roommate chips switch shelves', async () => {
  open(house({ pantry: [item({ name: 'Protein shake', owner_id: 'p', rule: 'do_not_touch' }),
    item({ name: 'Energy drinks', owner_id: 'n', rule: 'ask_first' })] }), '/pantry?tab=roommates');
  expect(screen.getByRole('tab', { name: 'Roommates' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('radio', { name: 'Priya' })).toHaveAttribute('aria-checked', 'true');
  await userEvent.click(screen.getByRole('radio', { name: 'Nima' }));
  expect(shelfNames(screen.getByRole('list', { name: "Nima's items" }))).toEqual(['Energy drinks']);
});

test('my items shows who asked to use something', () => {
  const oat = item({ name: 'Oat milk', owner_id: 'me', rule: 'ask_first' });
  open(house({ pantry: [oat], asks: [ask({ item_id: oat.id })] }), '/pantry?tab=mine');
  expect(screen.getByText('Priya asked to use this')).toBeInTheDocument();
});

test('an empty shared shelf says so and offers the basics', () => {
  open(house());
  expect(screen.getByText('Nothing on the shelf yet')).toBeInTheDocument();
  const basics = screen.getByRole('region', { name: 'Add the basics' });
  for (const b of ['Olive oil', 'Rice', 'Salt', 'Milk', 'Bread', 'Paper towels']) {
    expect(within(basics).getByRole('button', { name: b })).toBeInTheDocument();
  }
});

test('tapping a basic adds it to the shared shelf at once, and its chip goes', async () => {
  open(house({ pantry: [item({ name: 'Milk' })] }));
  const basics = screen.getByRole('region', { name: 'Add the basics' });
  expect(within(basics).queryByRole('button', { name: 'Milk' })).toBeNull();
  await userEvent.click(within(basics).getByRole('button', { name: 'Rice' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('add_pantry_basics', { p_names: ['Rice'] }));
  expect(shelfNames(screen.getByRole('list', { name: 'Shared items' }))).toEqual(['Milk', 'Rice']);
  expect(within(screen.getByRole('region', { name: 'Add the basics' })).queryByRole('button', { name: 'Rice' })).toBeNull();
});

test('once the shelf holds more than basics, the basics stop being offered', () => {
  open(house({ pantry: [item({ name: 'Hummus' })] }));
  expect(screen.queryByRole('region', { name: 'Add the basics' })).toBeNull();
});

test('my items and roommates have their own empty states', async () => {
  open(house({ pantry: [item({ name: 'Rice' })] }), '/pantry?tab=mine');
  expect(screen.getByText('Your shelf is empty.')).toBeInTheDocument();
  expect(screen.getByText('Add things that are yours.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Roommates' }));
  expect(screen.getByText('No one has a personal shelf yet.')).toBeInTheDocument();
});

test('a solo home never shows shared items on the Roommates tab', () => {
  open(fixture({ members: [{ user_id: 'me', name: 'Rahul', color: '#d1fae5', role: 'owner', busy_days: [] }], pantry: [item({ name: 'Rice' })] }),
    '/pantry?tab=roommates');
  expect(screen.getByText('No one has a personal shelf yet.')).toBeInTheDocument();
  expect(screen.queryByText('Rice')).toBeNull();
  expect(screen.queryByRole('radiogroup', { name: 'Whose shelf' })).toBeNull();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/ui/TabBar.test.tsx src/lib/stack.test.ts src/features/pantry`
Expected: FAIL.
- TabBar: the links are `['Home', 'Chores', 'Profile']`.
- stack: `stackKey('/pantry')` returns `'/pantry'`.
- Pantry: `Failed to resolve import "./Pantry"`.

- [ ] **Step 3: Add the tab, the stack depth, the colour tokens and the route**

In `src/ui/TabBar.tsx`, replace

```ts
import { ClipboardList, Home, User } from 'lucide-react';
```
with
```ts
import { ClipboardList, Home, ShoppingBag, User } from 'lucide-react';
```

and replace

```ts
  { to: '/chores', label: 'Chores', Icon: ClipboardList },
  { to: '/profile', label: 'Profile', Icon: User },
```
with
```ts
  { to: '/chores', label: 'Chores', Icon: ClipboardList },
  { to: '/pantry', label: 'Pantry', Icon: ShoppingBag },
  { to: '/profile', label: 'Profile', Icon: User },
```

In `src/ui/ui.css`, replace

```css
.tabbar__item { position: relative; min-width: 84px;
```
with
```css
.tabbar__item { position: relative; min-width: 70px;
```
(Four tabs: 4 × 70 + gaps + padding = 304 px, so the bar fits a 320 px screen.)

In `src/styles/tokens.css`, replace

```css
  --peach-bg: #ffedd5;  --peach-ink: #7c2d12; --peach-ink-2: #9a3412;
```
with
```css
  --peach-bg: #ffedd5;  --peach-ink: #7c2d12; --peach-ink-2: #9a3412;
  --pink-bg: #fee2e2;   --pink-ink: #991b1b; /* pantry "Do not touch" */
```

In `src/lib/stack.ts`, replace

```ts
const DEPTH: Record<string, number> = { '/': 0, '/chores': 0, '/profile': 0, '/plan': 1, '/activity': 1, '/profile/household': 1 };
```
with
```ts
const DEPTH: Record<string, number> = { '/': 0, '/chores': 0, '/pantry': 0, '/profile': 0, '/plan': 1, '/activity': 1, '/profile/household': 1 };
```

In `src/App.tsx`, replace

```ts
const { Screen: Chores, prefetch: loadChores } = prefetchable(() => import('./features/chores/Chores'));
```
with
```ts
const { Screen: Chores, prefetch: loadChores } = prefetchable(() => import('./features/chores/Chores'));
const { Screen: Pantry, prefetch: loadPantry } = prefetchable(() => import('./features/pantry/Pantry'));
```

replace

```ts
    idle(() => { for (const load of [loadChores, loadProfile, loadActivity, loadPlan, loadHousehold]) void load(); });
```
with
```ts
    idle(() => { for (const load of [loadChores, loadPantry, loadProfile, loadActivity, loadPlan, loadHousehold]) void load(); });
```

and replace

```ts
          { path: '/chores', element: <Chores /> },
```
with
```ts
          { path: '/chores', element: <Chores /> },
          { path: '/pantry', element: <Pantry /> },
```

- [ ] **Step 4: Move `InstallPrimer` out of the entry chunk** — in `src/features/home/Home.tsx`, delete the line

```ts
import { InstallPrimer } from '../primer/InstallPrimer';
```

replace

```ts
const WhySheet = lazy(() => import('../chores/WhySheet').then((m) => ({ default: m.WhySheet })));
```
with
```ts
const WhySheet = lazy(() => import('../chores/WhySheet').then((m) => ({ default: m.WhySheet })));
// renders nothing until its async push-status check resolves anyway, so loading it on demand changes nothing visible
const InstallPrimer = lazy(() => import('../primer/InstallPrimer').then((m) => ({ default: m.InstallPrimer })));
```

and replace

```tsx
      <InstallPrimer />
```
with
```tsx
      <Suspense fallback={null}><InstallPrimer /></Suspense>
```

- [ ] **Step 5: Create `src/features/pantry/usePantryActions.ts`**

```ts
import { cleanName, type PantryRule, sameName, type StockLevel } from '@domain/pantry.ts';
import type { Effort } from '@domain/types.ts';
import { useAction } from '../../lib/state';
import type { AppState, PantryAsk, PantryItem, Restock } from '../../lib/types';
import { useToast } from '../../ui/Toast';

// Optimistic rows get a temporary id until the refetch brings the real one; their rows can't be opened meanwhile.
const tmp = () => `tmp-${crypto.randomUUID()}`;
const newItem = (name: string, owner: string | null, rule: PantryRule | null): PantryItem =>
  ({ id: tmp(), owner_id: owner, name: cleanName(name), rule, stock: 'in_stock', created_at: new Date().toISOString() });
const withoutOpenRequest = (s: AppState, itemId: string): Restock[] =>
  s.restocks.filter((r) => !(r.item_id === itemId && r.status === 'open'));

/** Every pantry write: instant on screen, rolled back with a toast if the server refuses (useAction). */
export function usePantryActions() {
  const toast = useToast();
  const add = useAction<{ p_name: string; p_owner_personal: boolean; p_rule: PantryRule | null; me: string }>('add_pantry_item', {
    optimistic: (s, a) => ({
      ...s,
      pantry: [...s.pantry, newItem(a.p_name, a.p_owner_personal ? a.me : null, a.p_owner_personal ? a.p_rule ?? 'ask_first' : null)],
    }),
  });
  const addBasics = useAction<{ p_names: string[]; me: string }>('add_pantry_basics', {
    optimistic: (s, a) => ({
      ...s,
      pantry: [...s.pantry, ...a.p_names.filter((n) => !s.pantry.some((i) => i.owner_id === null && sameName(i.name, n))).map((n) => newItem(n, null, null))],
    }),
  });
  const setStock = useAction<{ p_id: string; p_stock: StockLevel }>('set_item_stock', {
    optimistic: (s, a) => ({
      ...s,
      pantry: s.pantry.map((i) => (i.id === a.p_id ? { ...i, stock: a.p_stock } : i)),
      restocks: a.p_stock === 'in_stock' ? withoutOpenRequest(s, a.p_id) : s.restocks,
    }),
  });
  const setRule = useAction<{ p_id: string; p_rule: PantryRule }>('set_item_rule', {
    optimistic: (s, a) => ({ ...s, pantry: s.pantry.map((i) => (i.id === a.p_id ? { ...i, rule: a.p_rule } : i)) }),
  });
  const remove = useAction<{ p_id: string }>('remove_pantry_item', {
    optimistic: (s, a) => ({ ...s, pantry: s.pantry.filter((i) => i.id !== a.p_id), restocks: withoutOpenRequest(s, a.p_id) }),
  });
  const request = useAction<{ p_item?: string; p_name?: string; p_effort: Effort; me: string }>('request_restock', {
    optimistic: (s, a) => {
      const linked = a.p_item
        ? s.pantry.find((i) => i.id === a.p_item)
        : s.pantry.find((i) => i.owner_id === null && sameName(i.name, a.p_name ?? ''));
      const r: Restock = {
        id: tmp(), item_id: linked?.id ?? null, name: linked?.name ?? cleanName(a.p_name ?? ''), effort: a.p_effort,
        requested_by: a.me, claimed_by: null, status: 'open', done_by: null, done_day: null, created_at: new Date().toISOString(),
      };
      return {
        ...s,
        pantry: s.pantry.map((i): PantryItem => (i.id === linked?.id && i.stock === 'in_stock' ? { ...i, stock: 'out' } : i)),
        restocks: [...s.restocks, r],
      };
    },
  });
  const ask = useAction<{ p_item: string; me: string; owner: string }>('ask_to_use', {
    optimistic: (s, a) => {
      const k: PantryAsk = { id: tmp(), item_id: a.p_item, from_user: a.me, to_user: a.owner, status: 'pending', created_at: new Date().toISOString() };
      return { ...s, asks: [...s.asks, k] };
    },
    onSuccess: () => toast.show("Asked. We'll let you know."),
  });
  const answer = useAction<{ p_ask: string; p_yes: boolean }>('answer_ask', {
    optimistic: (s, a) => ({ ...s, asks: s.asks.filter((k) => k.id !== a.p_ask) }),
  });
  return { add, addBasics, setStock, setRule, remove, request, ask, answer };
}
```

- [ ] **Step 6: Create `src/features/pantry/Pantry.tsx`**

```tsx
import { LayoutGroup, m } from 'motion/react';
import { type CSSProperties, type ReactNode, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  BASICS, iconFor, openRestockFor, requestedLine, RULE_LABEL, sameName, type ShelfTab, sortShelf, STOCK_LABEL, tintFor,
} from '@domain/pantry.ts';
import { haptic } from '../../lib/haptics';
import { SPRING, useFirstMount } from '../../lib/motion';
import { namesOf } from '../../lib/selectors';
import { useMe } from '../../lib/state';
import type { PantryItem } from '../../lib/types';
import { EmptyState } from '../../ui/EmptyState';
import { usePantryActions } from './usePantryActions';
import '../chores/chores.css'; // .seg and .fab
import './pantry.css';

const TABS: [ShelfTab, string][] = [['shared', 'Shared'], ['mine', 'My Items'], ['roommates', 'Roommates']];
const asTab = (t: string | null): ShelfTab => (t === 'mine' || t === 'roommates' ? t : 'shared');

/**
 * Rows are keyed by shelf + name (unique among active items), so an optimistic row and the saved one are the same row,
 * and a basics chip can fly into the list as that row (shared layoutId).
 */
export const rowKey = (owner: string | null, name: string) => `pantry-${owner ?? 'shared'}-${name.toLowerCase()}`;

function ItemRow({ item, tag, sub, onOpen, enter }: { item: PantryItem; tag?: ReactNode; sub?: string; onOpen?: () => void; enter?: number }) {
  const icon = iconFor(item.name);
  const body = (
    <>
      <span className="pantry-row__icon" style={{ background: tintFor(icon) }} aria-hidden>{icon}</span>
      <span className="pantry-row__name">{item.name}{sub && <small className="muted">{sub}</small>}</span>
      {tag}
    </>
  );
  return (
    // layout="position": rows glide when a stock change moves them between groups
    <m.li layoutId={rowKey(item.owner_id, item.name)} layout="position" transition={{ layout: SPRING.smooth }}
      className={enter !== undefined ? 'stagger' : undefined} style={enter !== undefined ? ({ '--i': enter } as CSSProperties) : undefined}>
      {onOpen
        ? <button type="button" className="pantry-row" onClick={onOpen} disabled={item.id.startsWith('tmp-')}>{body}</button>
        : <div className="pantry-row">{body}</div>}
    </m.li>
  );
}

export default function Pantry() {
  const { me, state } = useMe();
  const [params, setParams] = useSearchParams();
  const tab = asTab(params.get('tab'));
  const setTab = (t: ShelfTab) => setParams(t === 'shared' ? {} : { tab: t }, { replace: true });
  const [mate, setMate] = useState<string | null>(null);
  const { addBasics } = usePantryActions();
  const stagger = useFirstMount('pantry');
  const names = namesOf(state);

  const others = state.members.filter((x) => x.user_id !== me);
  const owners = new Set(state.pantry.map((i) => i.owner_id));
  // the chosen roommate, else the first one who has a shelf, else the first one
  const shownMate = (others.find((o) => o.user_id === mate) ?? others.find((o) => owners.has(o.user_id)) ?? others[0])?.user_id ?? null;
  const shared = state.pantry.filter((i) => i.owner_id === null);
  const shelf = tab === 'shared' ? shared
    : tab === 'mine' ? state.pantry.filter((i) => i.owner_id === me)
    : shownMate ? state.pantry.filter((i) => i.owner_id === shownMate) : []; // never fall through to shared items
  const items = sortShelf(shelf, tab);
  const missing = BASICS.filter((b) => !shared.some((i) => sameName(i.name, b)));
  // offered while the shared shelf holds nothing but basics, so tapped chips land in a list right above the rest
  const offerBasics = tab === 'shared' && missing.length > 0 && shared.every((i) => BASICS.some((b) => sameName(i.name, b)));
  const mateName = shownMate ? names[shownMate] ?? 'Roommate' : '';
  const listLabel = tab === 'shared' ? 'Shared items' : tab === 'mine' ? 'My items' : `${mateName}'s items`;

  const tagFor = (item: PantryItem) => {
    if (tab === 'shared') return item.stock === 'in_stock' ? undefined : <span className={`tag tag--${item.stock}`}>{STOCK_LABEL[item.stock]}</span>;
    return item.rule ? <span className={`tag tag--${item.rule}`}>{RULE_LABEL[item.rule]}</span> : undefined;
  };
  const subFor = (item: PantryItem) => {
    if (tab === 'shared') {
      const r = openRestockFor(state.restocks, item.id);
      return r ? requestedLine(r, names, me) : undefined;
    }
    if (tab === 'mine') {
      const k = state.asks.find((x) => x.item_id === item.id && x.to_user === me && x.status === 'pending');
      return k ? `${names[k.from_user] ?? 'A roommate'} asked to use this` : undefined;
    }
    return undefined;
  };

  return (
    <main className="screen pantry">
      <h1>Pantry</h1>
      <div className="seg seg--underline" role="tablist" aria-label="Pantry view">
        {TABS.map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} className={`seg__opt${tab === value ? ' is-on' : ''}`} onClick={() => setTab(value)}>
            {label}{tab === value && <m.span layoutId="pantry-underline" className="seg__line" transition={SPRING.snappy} aria-hidden />}
          </button>
        ))}
      </div>

      {tab === 'roommates' && others.length > 0 && (
        <div className="mate-chips" role="radiogroup" aria-label="Whose shelf">
          {others.map((o) => (
            <button key={o.user_id} type="button" role="radio" aria-checked={shownMate === o.user_id}
              className={`mate-chip${shownMate === o.user_id ? ' is-on' : ''}`} onClick={() => setMate(o.user_id)}>{o.name || 'Roommate'}</button>
          ))}
        </div>
      )}

      <LayoutGroup id="pantry">
        {items.length > 0 && (
          <ul className="pantry-list" aria-label={listLabel}>
            {items.map((item, i) => (
              <ItemRow key={rowKey(item.owner_id, item.name)} item={item} tag={tagFor(item)} sub={subFor(item)} enter={stagger ? i : undefined} />
            ))}
          </ul>
        )}
        {items.length === 0 && (tab === 'shared'
          ? <EmptyState title="Nothing on the shelf yet" />
          : tab === 'mine'
            ? <EmptyState title="Your shelf is empty." body="Add things that are yours." />
            : <EmptyState title={others.some((o) => owners.has(o.user_id)) ? `${mateName} hasn't added anything yet.` : 'No one has a personal shelf yet.'} />)}
        {offerBasics && (
          <section className="basics" aria-label="Add the basics">
            <p className="eyebrow">Add the basics</p>
            <div className="basics__chips">
              {missing.map((b) => (
                <m.button key={b} type="button" className="basic-chip" layoutId={rowKey(null, b)} layout="position" transition={{ layout: SPRING.smooth }}
                  onClick={() => { haptic(); addBasics.mutate({ p_names: [b], me }); }}>
                  <span aria-hidden>{iconFor(b)}</span> {b}
                </m.button>
              ))}
            </div>
          </section>
        )}
      </LayoutGroup>
    </main>
  );
}
```

- [ ] **Step 7: Create `src/features/pantry/pantry.css`**

```css
.pantry h1 { font-size: 36px; }

/* underline tabs: the segmented control's underline variant; the bar slides between labels (layoutId, snappy spring) */
.seg--underline { background: none; padding: 0; gap: 24px; border-radius: 0; }
.seg--underline .seg__opt { flex: none; padding: 0; border-radius: 0; font-size: 16px; }
.seg__line { position: absolute; left: 50%; bottom: 4px; width: 22px; margin-left: -11px; height: 3px; border-radius: 3px; background: var(--ink); }
/* the dark variant: Shared / Personal in the add sheet */
.seg--ink .seg__pill { background: var(--navy); box-shadow: none; }
.seg--ink .seg__opt.is-on { color: #fff; }

/* shelves */
.pantry-list { list-style: none; margin: 20px 0 0; padding: 0; display: grid; gap: 12px; }
.pantry-row { width: 100%; min-height: 72px; display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: var(--radius-m); border: 1px solid var(--line); background: #fff; color: var(--ink); text-align: left; font: inherit; }
button.pantry-row { cursor: pointer; }
button.pantry-row:disabled { cursor: progress; }
.pantry-row__icon { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: 50%; font-size: 20px; }
.pantry-row__name { flex: 1; min-width: 0; display: grid; gap: 2px; font-weight: 500; overflow-wrap: anywhere; }
.pantry-row__name small { font-size: 13px; font-weight: 400; }
.tag { flex: none; font: 600 12px/1 var(--font-ui); padding: 6px 10px; border-radius: var(--radius-xs); white-space: nowrap; }
.tag--low { background: var(--medium-bg); color: var(--medium-ink); }
.tag--out, .tag--ask_first { background: var(--heavy-bg); color: var(--heavy-ink); }
.tag--do_not_touch { background: var(--pink-bg); color: var(--pink-ink); }

.mate-chips { display: flex; gap: 8px; margin-top: 16px; overflow-x: auto; padding-bottom: 2px; }
.mate-chip { flex: none; min-height: 44px; padding: 0 16px; border-radius: var(--radius-pill); border: 1px solid var(--line); background: #fff; color: var(--muted); font-weight: 600; cursor: pointer; }
.mate-chip.is-on { background: var(--lav); border-color: transparent; color: var(--lav-ink); }

.basics { display: grid; justify-items: center; gap: 12px; margin-top: 20px; }
.basics__chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.basic-chip { min-height: 44px; display: inline-flex; align-items: center; gap: 6px; padding: 0 16px; border-radius: var(--radius-pill); border: 1.5px dashed var(--lav-3); background: #fff; color: var(--ink); font-weight: 600; cursor: pointer; }

/* sheets (Tasks 8–10) */
.item-sheet, .add-item, .restock-form { display: grid; gap: 12px; }
.item-sheet .seg, .add-item .seg { margin-top: 0; }
.item-sheet__note { font: 600 17px/1.4 var(--font-ui); padding: 14px 16px; border-radius: var(--radius-s); background: var(--pink-bg); color: var(--pink-ink); }
.item-sheet__requested { font-weight: 600; padding: 12px 16px; border-radius: var(--radius-s); background: var(--light-bg); color: var(--light-ink); }
.ask-card { display: grid; gap: 10px; padding: 14px 16px; border-radius: var(--radius-s); background: var(--lav); color: var(--lav-ink-deep); }
.ask-card__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.rules { display: grid; gap: 10px; }
.rule-opt { min-height: 48px; border-radius: var(--radius-pill); border: 1.5px solid transparent; font-weight: 600; cursor: pointer; }
.rule-opt--do_not_touch { background: var(--pink-bg); color: var(--pink-ink); }
.rule-opt--ask_first { background: var(--heavy-bg); color: var(--heavy-ink); }
.rule-opt.is-on { border-color: currentColor; }

/* Request Sent (Task 8) */
.sent { display: grid; align-content: center; justify-items: center; gap: 18px; text-align: center; }
.sent__art { width: 112px; height: 112px; border-radius: 50%; background: var(--light-bg); display: grid; place-items: center; font-size: 52px; }
.sent h1 { outline: none; }
.sent__pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: var(--radius-pill); background: var(--lav); color: var(--lav-ink); font-weight: 600; font-size: 14px; }
.sent .btn { width: 100%; max-width: 340px; }

/* FAB menu (Task 10): the page fades behind a white scrim (opacity only); pills spring up from the + */
.fab-scrim { position: fixed; inset: 0; z-index: 29; background: rgba(255, 255, 255, .72); will-change: opacity; }
.fab-menu { position: fixed; z-index: 31; right: max(20px, calc(50% - 240px)); bottom: calc(var(--safe-bottom) + 170px); display: grid; gap: 12px; justify-items: end; pointer-events: none; }
.fab-pill { pointer-events: auto; display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 22px 8px 8px; border: 0; border-radius: var(--radius-pill); background: #fff; color: var(--ink); box-shadow: var(--shadow-float); font-weight: 600; font-size: 16px; white-space: nowrap; cursor: pointer; }
.fab-pill__icon { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: 50%; font-size: 18px; }
.pantry .fab { z-index: 32; }
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run src/ui/TabBar.test.tsx src/lib/stack.test.ts src/features/pantry src/features/home`
Expected: PASS. The Home tests still pass, so the lazy InstallPrimer doesn't break them.

Run: `npx tsc -b`
Expected: no output.

- [ ] **Step 9: Check the bundle budget**

Run: `npm run build 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E 'assets/(index|Pantry|InstallPrimer)-.*\.js'`
Expected:
- `assets/index-*.js` at `gzip:` **≤ 196.00 kB** (about 195.0).
- A separate `assets/Pantry-*.js` and `assets/InstallPrimer-*.js` chunk.

If the entry is above 196.00 kB, stop and find which pantry module leaked into it. Run `grep -l "Nothing on the shelf" dist/assets/index-*.js`, which must print nothing.

- [ ] **Step 10: Commit**

```bash
git add src/features/pantry src/ui/TabBar.tsx src/ui/TabBar.test.tsx src/ui/ui.css src/styles/tokens.css src/lib/stack.ts src/lib/stack.test.ts src/App.tsx src/features/home/Home.tsx
git commit -F - <<'EOF'
feat(pantry): Pantry tab with shared, personal and roommate shelves and Add the basics

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 8: Restock sheet and Request Sent

Two standalone components, tested on their own. Task 9 wires them from an item and Task 10 from the FAB.

**Files:**
- Create: `src/features/pantry/RestockSheet.tsx`
- Create: `src/features/pantry/RequestSent.tsx`
- Create: `src/features/pantry/RestockSheet.test.tsx`

**Interfaces:**
- Consumes:
  - `usePantryActions().request` (Task 7);
  - `cleanName`, `sameName` and `openRestockFor` (Task 2);
  - `Sheet`, `Button`, `haptic` and `SPRING` (M1).
- Produces:
  - `RestockSheet({ open: boolean; item: PantryItem | null; onClose: () => void; onSent: (name: string) => void })`.
    - `item` set means "from an item"; `null` means free text.
    - `onSent` fires only once the server accepted the request, so offline it waits, like M1's celebration.
  - `RequestSent({ name: string; onBack: () => void })`, the full-screen confirmation.

- [ ] **Step 1: Write the failing test** — create `src/features/pantry/RestockSheet.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import type { PantryItem, Restock } from '../../lib/types';
import { RequestSent } from './RequestSent';
import { RestockSheet } from './RestockSheet';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: 'new-id', error: null })) }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

const towels: PantryItem = { id: 'towels', owner_id: null, name: 'Paper towels', rule: null, stock: 'in_stock', created_at: '2026-10-01T00:00:00Z' };
const rice: PantryItem = { id: 'rice', owner_id: null, name: 'Rice', rule: null, stock: 'out', created_at: '2026-10-01T00:00:00Z' };
const riceRequest: Restock = {
  id: 'r1', item_id: 'rice', name: 'Rice', effort: 1, requested_by: 'p', claimed_by: null, status: 'open',
  done_by: null, done_day: null, created_at: '2026-10-01T00:00:00Z',
};

test('from an item: explains, defaults to Light, sends, and reports the item once the server took it', async () => {
  const onSent = vi.fn();
  renderWithState(<RestockSheet open item={towels} onClose={() => {}} onSent={onSent} />, { state: fixture({ pantry: [towels] }) });
  const sheet = await screen.findByRole('dialog', { name: 'Request Restock' });
  expect(within(sheet).getByText("We're out of Paper towels. Send this to the Chores pool so a roommate can pick it up.")).toBeInTheDocument();
  expect(within(sheet).queryByLabelText("What's needed")).toBeNull();
  expect(within(sheet).getByRole('radio', { name: 'Light' })).toHaveAttribute('aria-checked', 'true');
  await userEvent.click(within(sheet).getByRole('radio', { name: 'Heavy' }));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Send to Chores Pool' }));
  await waitFor(() => expect(onSent).toHaveBeenCalledWith('Paper towels'));
  expect(db.rpc).toHaveBeenCalledWith('request_restock', { p_item: 'towels', p_effort: 3 });
});

test('free text: explains, needs a name, and sends it', async () => {
  const onSent = vi.fn();
  renderWithState(<RestockSheet open item={null} onClose={() => {}} onSent={onSent} />, { state: fixture() });
  const sheet = await screen.findByRole('dialog', { name: 'Request Restock' });
  expect(within(sheet).getByText('This will create a task in the Chores pool for a roommate to pick up.')).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Send to Chores Pool' })).toBeDisabled();
  await userEvent.type(within(sheet).getByLabelText("What's needed"), '  Dish   soap ');
  await userEvent.click(within(sheet).getByRole('radio', { name: 'Medium' }));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Send to Chores Pool' }));
  await waitFor(() => expect(onSent).toHaveBeenCalledWith('Dish soap'));
  expect(db.rpc).toHaveBeenCalledWith('request_restock', { p_name: 'Dish soap', p_effort: 2 });
});

test('free text naming an already-requested shared item is caught before sending', async () => {
  renderWithState(<RestockSheet open item={null} onClose={() => {}} onSent={() => {}} />, { state: fixture({ pantry: [rice], restocks: [riceRequest] }) });
  const sheet = await screen.findByRole('dialog', { name: 'Request Restock' });
  await userEvent.type(within(sheet).getByLabelText("What's needed"), ' RICE');
  expect(within(sheet).getByRole('alert')).toHaveTextContent("Already requested — it's in the Chores pool.");
  expect(within(sheet).getByRole('button', { name: 'Send to Chores Pool' })).toBeDisabled();
});

test('Request Sent confirms what was sent and goes back', async () => {
  const onBack = vi.fn();
  renderWithState(<RequestSent name="Paper towels" onBack={onBack} />, { state: fixture() });
  expect(screen.getByRole('heading', { name: 'Request Sent!' })).toHaveFocus();
  expect(screen.getByText('Paper towels has been added to the Chores pool. A roommate will pick it up soon.')).toBeInTheDocument();
  expect(screen.getByText(/Added to Shared Tasks/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Back to Pantry' }));
  expect(onBack).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/pantry/RestockSheet.test.tsx`
Expected: FAIL, with `Failed to resolve import "./RequestSent"`.

- [ ] **Step 3: Create `src/features/pantry/RestockSheet.tsx`**

```tsx
import { type FormEvent, useState } from 'react';
import { cleanName, openRestockFor, sameName } from '@domain/pantry.ts';
import type { Effort } from '@domain/types.ts';
import { haptic } from '../../lib/haptics';
import { useMe } from '../../lib/state';
import type { PantryItem } from '../../lib/types';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { usePantryActions } from './usePantryActions';

const EFFORTS: { value: Effort; label: string }[] = [{ value: 1, label: 'Light' }, { value: 2, label: 'Medium' }, { value: 3, label: 'Heavy' }];

/**
 * Sends a restock request to the Chores pool: from an item (item set) or as free text from the FAB (item null).
 * onSent fires once the server accepted it; offline, the request waits and replays like every other action.
 */
export function RestockSheet({ open, item, onClose, onSent }: { open: boolean; item: PantryItem | null; onClose: () => void; onSent: (name: string) => void }) {
  const { me, state } = useMe();
  const { request } = usePantryActions();
  const [kept, setKept] = useState(item); // keep the item's copy on screen while the sheet slides away
  if (open && item !== kept) setKept(item);
  const it = open ? item : kept;
  const [text, setText] = useState('');
  const [effort, setEffort] = useState<Effort>(1);
  const name = it ? it.name : cleanName(text);
  // free text that names a shared item becomes a request on that item (the server links it the same way)
  const linked = it ?? state.pantry.find((i) => i.owner_id === null && sameName(i.name, name));
  const already = Boolean(linked && openRestockFor(state.restocks, linked.id));
  const close = () => { setText(''); setEffort(1); onClose(); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || already || request.isPending) return;
    haptic('success');
    request.mutate(it ? { p_item: it.id, p_effort: effort, me } : { p_name: name, p_effort: effort, me }, {
      onSuccess: () => { close(); onSent(name); },
    });
  };
  return (
    <Sheet open={open} onClose={close} title="Request Restock">
      <form className="restock-form" onSubmit={submit}>
        <p className="muted">{it
          ? `We're out of ${it.name}. Send this to the Chores pool so a roommate can pick it up.`
          : 'This will create a task in the Chores pool for a roommate to pick up.'}</p>
        {!it && (
          <label className="field">
            <span className="field__control">
              <input maxLength={40} placeholder="e.g., Paper Towels" aria-label="What's needed" value={text} onChange={(e) => setText(e.target.value)} />
            </span>
          </label>
        )}
        {already && <p className="field__error" role="alert">Already requested — it's in the Chores pool.</p>}
        <p className="eyebrow">Effort level</p>
        <div className="seg seg--effort" role="radiogroup" aria-label="Effort level">
          {EFFORTS.map((x) => (
            <button key={x.value} type="button" role="radio" aria-checked={effort === x.value}
              className={`chip chip--md chip--${x.label.toLowerCase()}${effort === x.value ? ' is-on' : ''}`} onClick={() => setEffort(x.value)}>
              {x.label}
            </button>
          ))}
        </div>
        <Button block type="submit" loading={request.isPending} disabled={!name || already}>Send to Chores Pool</Button>
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 4: Create `src/features/pantry/RequestSent.tsx`**

```tsx
import { m } from 'motion/react';
import { useEffect, useRef } from 'react';
import { SPRING } from '../../lib/motion';
import { Button } from '../../ui/Button';

/** Screen 19: the cart springs in on the celebration spring (transform + opacity only; reduced motion keeps the fade). */
export function RequestSent({ name, onBack }: { name: string; onBack: () => void }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []); // screen readers land on the confirmation
  return (
    <main className="screen sent">
      <m.div className="sent__art" aria-hidden initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={SPRING.gentle}>🛒</m.div>
      <h1 ref={title} tabIndex={-1}>Request Sent!</h1>
      <p className="muted">{name} has been added to the Chores pool. A roommate will pick it up soon.</p>
      <span className="sent__pill"><span aria-hidden>🧹</span> Added to Shared Tasks</span>
      <Button block onClick={onBack}>Back to Pantry</Button>
    </main>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/features/pantry`
Expected: PASS (`Pantry.test.tsx` and `RestockSheet.test.tsx`).

Run: `npx tsc -b`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/features/pantry/RestockSheet.tsx src/features/pantry/RequestSent.tsx src/features/pantry/RestockSheet.test.tsx
git commit -F - <<'EOF'
feat(pantry): Request Restock sheet and Request Sent confirmation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 9: Item actions sheet, wired to restock

**Files:**
- Create: `src/features/pantry/ItemSheet.tsx`
- Modify (full rewrite): `src/features/pantry/Pantry.tsx`
- Modify: `src/features/pantry/Pantry.test.tsx` (append)

**Interfaces:**
- Consumes:
  - From Task 7: `usePantryActions()` (`setStock`, `setRule`, `remove`, `ask`, `answer`).
  - From Task 8: `RestockSheet` and `RequestSent`.
  - From Task 2: `canAsk`, `myAsk`, `openRestockFor`, `requestedLine`, `STOCK_LABEL` and `RULE_LABEL`.
- Produces: `ItemSheet({ item: PantryItem | null; onClose: () => void; onRestock: (item: PantryItem) => void })`. What the sheet offers depends on whose item it is:

| Item | Actions |
|---|---|
| Shared | Stock segmented control; **Request restock**, or the "Requested…" line; Remove (two taps) |
| Mine | Stock; Sharing rule; incoming asks with **Sure** / **Not this time**; Remove (two taps) |
| A roommate's, Ask first | **Ask {name}**, or a disabled **Asked · waiting**; the last answer ("Priya said sure.") |
| A roommate's, Do not touch | "This is {name}'s. Do not touch." No actions. |

- Pantry rows become buttons that open the sheet.
- From a shared item, Request restock goes to `RestockSheet` and then to `RequestSent`. **Back to Pantry** returns to the list.

- [ ] **Step 1: Write the failing tests** — append to `src/features/pantry/Pantry.test.tsx`:

```tsx
test('a shared item: mark it out, then request a restock through to Request Sent and back', async () => {
  open(house({ pantry: [item({ id: 'towels', name: 'Paper towels' })] }));
  await userEvent.click(screen.getByRole('button', { name: 'Paper towels' }));
  const sheet = await screen.findByRole('dialog', { name: 'Paper towels' });
  expect(within(sheet).getByRole('radio', { name: 'In stock' })).toHaveAttribute('aria-checked', 'true');
  await userEvent.click(within(sheet).getByRole('radio', { name: 'Out' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('set_item_stock', { p_id: 'towels', p_stock: 'out' }));
  expect(within(sheet).getByRole('radio', { name: 'Out' })).toHaveAttribute('aria-checked', 'true');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Request restock' }));
  const restockSheet = await screen.findByRole('dialog', { name: 'Request Restock' });
  await userEvent.click(within(restockSheet).getByRole('button', { name: 'Send to Chores Pool' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('request_restock', { p_item: 'towels', p_effort: 1 }));
  expect(await screen.findByRole('heading', { name: 'Request Sent!' })).toBeInTheDocument();
  expect(screen.getByText('Paper towels has been added to the Chores pool. A roommate will pick it up soon.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Back to Pantry' }));
  const list = screen.getByRole('list', { name: 'Shared items' });
  expect(within(list).getByText('Requested')).toBeInTheDocument();
  expect(within(list).getByText('Out')).toBeInTheDocument();
});

test('a shared item with an open request shows who is on it instead of the button', async () => {
  const rice = item({ name: 'Rice', stock: 'out' });
  open(house({ pantry: [rice], restocks: [restock({ item_id: rice.id, claimed_by: 'p' })] }));
  await userEvent.click(screen.getByRole('button', { name: /Rice/ }));
  const sheet = await screen.findByRole('dialog', { name: 'Rice' });
  expect(within(sheet).getByText("Requested · Priya's on it")).toBeInTheDocument();
  expect(within(sheet).queryByRole('button', { name: 'Request restock' })).toBeNull();
});

test('removing a shared item takes two taps', async () => {
  open(house({ pantry: [item({ id: 'salt', name: 'Salt' })] }));
  await userEvent.click(screen.getByRole('button', { name: 'Salt' }));
  const sheet = await screen.findByRole('dialog', { name: 'Salt' });
  await userEvent.click(within(sheet).getByRole('button', { name: 'Remove item' }));
  expect(db.rpc).not.toHaveBeenCalledWith('remove_pantry_item', expect.anything());
  await userEvent.click(within(sheet).getByRole('button', { name: 'Remove for everyone?' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('remove_pantry_item', { p_id: 'salt' }));
  expect(screen.queryByRole('list', { name: 'Shared items' })).toBeNull();
});

test('my item: change its rule, answer an ask, remove it', async () => {
  const oat = item({ id: 'oat', name: 'Oat milk', owner_id: 'me', rule: 'ask_first' });
  open(house({ pantry: [oat], asks: [ask({ id: 'k1', item_id: 'oat' })] }), '/pantry?tab=mine');
  await userEvent.click(screen.getByRole('button', { name: /Oat milk/ }));
  const sheet = await screen.findByRole('dialog', { name: 'Oat milk' });
  await userEvent.click(within(sheet).getByRole('radio', { name: 'Do not touch' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('set_item_rule', { p_id: 'oat', p_rule: 'do_not_touch' }));
  expect(within(sheet).getByText('Priya asked to use this.')).toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: 'Sure' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('answer_ask', { p_ask: 'k1', p_yes: true }));
  expect(within(sheet).queryByText('Priya asked to use this.')).toBeNull();
  expect(within(sheet).queryByRole('button', { name: 'Request restock' })).toBeNull(); // personal items are never restock-requested
  await userEvent.click(within(sheet).getByRole('button', { name: 'Remove item' }));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Remove from your shelf?' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('remove_pantry_item', { p_id: 'oat' }));
});

test("a roommate's ask-first item: ask once, then wait", async () => {
  open(house({ pantry: [item({ id: 'oat', name: 'Oat milk', owner_id: 'p', rule: 'ask_first' })] }), '/pantry?tab=roommates');
  await userEvent.click(screen.getByRole('button', { name: /Oat milk/ }));
  const sheet = await screen.findByRole('dialog', { name: 'Oat milk' });
  await userEvent.click(within(sheet).getByRole('button', { name: 'Ask Priya' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('ask_to_use', { p_item: 'oat' }));
  expect(within(sheet).getByRole('button', { name: 'Asked · waiting' })).toBeDisabled();
});

test("the answer to my ask shows on the roommate's item, and I can ask again", async () => {
  const oat = item({ id: 'oat', name: 'Oat milk', owner_id: 'p', rule: 'ask_first' });
  open(house({ pantry: [oat], asks: [ask({ item_id: 'oat', from_user: 'me', to_user: 'p', status: 'yes' })] }), '/pantry?tab=roommates');
  await userEvent.click(screen.getByRole('button', { name: /Oat milk/ }));
  const sheet = await screen.findByRole('dialog', { name: 'Oat milk' });
  expect(within(sheet).getByText('Priya said sure.')).toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Ask Priya' })).toBeEnabled();
});

test("a roommate's do-not-touch item is a label with no actions", async () => {
  open(house({ pantry: [item({ name: 'Protein shake', owner_id: 'p', rule: 'do_not_touch' })] }), '/pantry?tab=roommates');
  await userEvent.click(screen.getByRole('button', { name: /Protein shake/ }));
  const sheet = await screen.findByRole('dialog', { name: 'Protein shake' });
  expect(within(sheet).getByText("This is Priya's. Do not touch.")).toBeInTheDocument();
  expect(within(sheet).queryAllByRole('button')).toHaveLength(0);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/pantry/Pantry.test.tsx`
Expected: the Task 7 tests pass; the new ones FAIL, with `Unable to find an accessible element with the role "button" and name "Paper towels"` (rows are not buttons yet).

- [ ] **Step 3: Create `src/features/pantry/ItemSheet.tsx`**

```tsx
import { m } from 'motion/react';
import { type ReactNode, useState } from 'react';
import {
  canAsk, myAsk, openRestockFor, type PantryRule, requestedLine, RULE_LABEL, STOCK_LABEL, type StockLevel,
} from '@domain/pantry.ts';
import { haptic } from '../../lib/haptics';
import { SPRING } from '../../lib/motion';
import { namesOf } from '../../lib/selectors';
import { useMe } from '../../lib/state';
import type { PantryItem } from '../../lib/types';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { usePantryActions } from './usePantryActions';

const STOCKS: StockLevel[] = ['in_stock', 'low', 'out'];
const RULES: PantryRule[] = ['ask_first', 'do_not_touch'];

/** Tapping a row: what you can do depends on whose item it is (shared / mine / a roommate's). */
export function ItemSheet({ item: current, onClose, onRestock }: { item: PantryItem | null; onClose: () => void; onRestock: (item: PantryItem) => void }) {
  const { me, state } = useMe();
  const act = usePantryActions();
  const [last, setLast] = useState(current); // keep the content while the sheet slides away
  if (current && current !== last) setLast(current);
  const [confirmRemove, setConfirmRemove] = useState(false); // removing is final for everyone who uses it: two taps
  const item = current ?? last;
  const names = namesOf(state);
  const close = () => { setConfirmRemove(false); onClose(); };

  let content: ReactNode = null;
  if (item && item.owner_id !== null && item.owner_id !== me) {
    const owner = names[item.owner_id] ?? 'A roommate';
    const asked = myAsk(state.asks, item.id, me);
    content = item.rule === 'do_not_touch'
      ? <p className="item-sheet__note">This is {owner}'s. Do not touch.</p>
      : canAsk(item, me, state.asks)
        ? (
          <>
            {asked && <p className="muted">{asked.status === 'yes' ? `${owner} said sure.` : `${owner} said not this time.`}</p>}
            <Button block onClick={() => { haptic(); act.ask.mutate({ p_item: item.id, me, owner: item.owner_id! }); }}>Ask {owner}</Button>
          </>
        )
        : <Button block disabled>Asked · waiting</Button>;
  } else if (item) {
    const restock = item.owner_id === null ? openRestockFor(state.restocks, item.id) : undefined;
    const incoming = state.asks.filter((k) => k.item_id === item.id && k.to_user === me && k.status === 'pending');
    content = (
      <>
        <p className="eyebrow">Stock</p>
        <div className="seg" role="radiogroup" aria-label="Stock">
          {STOCKS.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={item.stock === s} className={`seg__opt${item.stock === s ? ' is-on' : ''}`}
              onClick={() => { if (item.stock !== s) { haptic(); act.setStock.mutate({ p_id: item.id, p_stock: s }); } }}>
              {item.stock === s && <m.span layoutId="seg-stock" className="seg__pill" transition={SPRING.snappy} aria-hidden />}{STOCK_LABEL[s]}
            </button>
          ))}
        </div>
        {item.owner_id === null && (restock
          ? <p className="item-sheet__requested">{requestedLine(restock, names, me)}</p>
          : <Button variant="secondary" block onClick={() => { setConfirmRemove(false); onRestock(item); }}>Request restock</Button>)}
        {item.owner_id === me && (
          <>
            <p className="eyebrow">Sharing rule</p>
            <div className="seg" role="radiogroup" aria-label="Sharing rule">
              {RULES.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={item.rule === r} className={`seg__opt${item.rule === r ? ' is-on' : ''}`}
                  onClick={() => { if (item.rule !== r) { haptic(); act.setRule.mutate({ p_id: item.id, p_rule: r }); } }}>
                  {item.rule === r && <m.span layoutId="seg-rule" className="seg__pill" transition={SPRING.snappy} aria-hidden />}{RULE_LABEL[r]}
                </button>
              ))}
            </div>
            {incoming.map((k) => (
              <div key={k.id} className="ask-card">
                <p>{names[k.from_user] ?? 'A roommate'} asked to use this.</p>
                <div className="ask-card__actions">
                  <Button onClick={() => { haptic(); act.answer.mutate({ p_ask: k.id, p_yes: true }); }}>Sure</Button>
                  <Button variant="ghost" onClick={() => act.answer.mutate({ p_ask: k.id, p_yes: false })}>Not this time</Button>
                </div>
              </div>
            ))}
          </>
        )}
        <Button variant="danger" block onClick={() => {
          if (!confirmRemove) return setConfirmRemove(true);
          haptic('warning');
          act.remove.mutate({ p_id: item.id });
          close();
        }}>{confirmRemove ? (item.owner_id === null ? 'Remove for everyone?' : 'Remove from your shelf?') : 'Remove item'}</Button>
      </>
    );
  }

  return (
    <Sheet open={Boolean(current)} onClose={close} title={item?.name ?? ''}>
      <div className="item-sheet">{content}</div>
    </Sheet>
  );
}
```

- [ ] **Step 4: Rewrite `src/features/pantry/Pantry.tsx`**

```tsx
import { LayoutGroup, m } from 'motion/react';
import { type CSSProperties, type ReactNode, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  BASICS, iconFor, openRestockFor, requestedLine, RULE_LABEL, sameName, type ShelfTab, sortShelf, STOCK_LABEL, tintFor,
} from '@domain/pantry.ts';
import { haptic } from '../../lib/haptics';
import { SPRING, useFirstMount } from '../../lib/motion';
import { namesOf } from '../../lib/selectors';
import { useMe } from '../../lib/state';
import type { PantryItem } from '../../lib/types';
import { EmptyState } from '../../ui/EmptyState';
import { ItemSheet } from './ItemSheet';
import { RequestSent } from './RequestSent';
import { RestockSheet } from './RestockSheet';
import { usePantryActions } from './usePantryActions';
import '../chores/chores.css'; // .seg and .fab
import './pantry.css';

const TABS: [ShelfTab, string][] = [['shared', 'Shared'], ['mine', 'My Items'], ['roommates', 'Roommates']];
const asTab = (t: string | null): ShelfTab => (t === 'mine' || t === 'roommates' ? t : 'shared');

/**
 * Rows are keyed by shelf + name (unique among active items), so an optimistic row and the saved one are the same row,
 * and a basics chip can fly into the list as that row (shared layoutId).
 */
export const rowKey = (owner: string | null, name: string) => `pantry-${owner ?? 'shared'}-${name.toLowerCase()}`;

function ItemRow({ item, tag, sub, onOpen, enter }: { item: PantryItem; tag?: ReactNode; sub?: string; onOpen?: () => void; enter?: number }) {
  const icon = iconFor(item.name);
  const body = (
    <>
      <span className="pantry-row__icon" style={{ background: tintFor(icon) }} aria-hidden>{icon}</span>
      <span className="pantry-row__name">{item.name}{sub && <small className="muted">{sub}</small>}</span>
      {tag}
    </>
  );
  return (
    // layout="position": rows glide when a stock change moves them between groups
    <m.li layoutId={rowKey(item.owner_id, item.name)} layout="position" transition={{ layout: SPRING.smooth }}
      className={enter !== undefined ? 'stagger' : undefined} style={enter !== undefined ? ({ '--i': enter } as CSSProperties) : undefined}>
      {onOpen
        ? <button type="button" className="pantry-row" onClick={onOpen} disabled={item.id.startsWith('tmp-')}>{body}</button>
        : <div className="pantry-row">{body}</div>}
    </m.li>
  );
}

export default function Pantry() {
  const { me, state } = useMe();
  const [params, setParams] = useSearchParams();
  const tab = asTab(params.get('tab'));
  const setTab = (t: ShelfTab) => setParams(t === 'shared' ? {} : { tab: t }, { replace: true });
  const [mate, setMate] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [restocking, setRestocking] = useState<{ item: PantryItem | null } | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const { addBasics } = usePantryActions();
  const stagger = useFirstMount('pantry');
  const names = namesOf(state);

  const others = state.members.filter((x) => x.user_id !== me);
  const owners = new Set(state.pantry.map((i) => i.owner_id));
  // the chosen roommate, else the first one who has a shelf, else the first one
  const shownMate = (others.find((o) => o.user_id === mate) ?? others.find((o) => owners.has(o.user_id)) ?? others[0])?.user_id ?? null;
  const shared = state.pantry.filter((i) => i.owner_id === null);
  const shelf = tab === 'shared' ? shared
    : tab === 'mine' ? state.pantry.filter((i) => i.owner_id === me)
    : shownMate ? state.pantry.filter((i) => i.owner_id === shownMate) : []; // never fall through to shared items
  const items = sortShelf(shelf, tab);
  const missing = BASICS.filter((b) => !shared.some((i) => sameName(i.name, b)));
  // offered while the shared shelf holds nothing but basics, so tapped chips land in a list right above the rest
  const offerBasics = tab === 'shared' && missing.length > 0 && shared.every((i) => BASICS.some((b) => sameName(i.name, b)));
  const mateName = shownMate ? names[shownMate] ?? 'Roommate' : '';
  const listLabel = tab === 'shared' ? 'Shared items' : tab === 'mine' ? 'My items' : `${mateName}'s items`;

  if (sent) return <RequestSent name={sent} onBack={() => setSent(null)} />;

  const tagFor = (item: PantryItem) => {
    if (tab === 'shared') return item.stock === 'in_stock' ? undefined : <span className={`tag tag--${item.stock}`}>{STOCK_LABEL[item.stock]}</span>;
    return item.rule ? <span className={`tag tag--${item.rule}`}>{RULE_LABEL[item.rule]}</span> : undefined;
  };
  const subFor = (item: PantryItem) => {
    if (tab === 'shared') {
      const r = openRestockFor(state.restocks, item.id);
      return r ? requestedLine(r, names, me) : undefined;
    }
    if (tab === 'mine') {
      const k = state.asks.find((x) => x.item_id === item.id && x.to_user === me && x.status === 'pending');
      return k ? `${names[k.from_user] ?? 'A roommate'} asked to use this` : undefined;
    }
    return undefined;
  };

  return (
    <main className="screen pantry">
      <h1>Pantry</h1>
      <div className="seg seg--underline" role="tablist" aria-label="Pantry view">
        {TABS.map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} className={`seg__opt${tab === value ? ' is-on' : ''}`} onClick={() => setTab(value)}>
            {label}{tab === value && <m.span layoutId="pantry-underline" className="seg__line" transition={SPRING.snappy} aria-hidden />}
          </button>
        ))}
      </div>

      {tab === 'roommates' && others.length > 0 && (
        <div className="mate-chips" role="radiogroup" aria-label="Whose shelf">
          {others.map((o) => (
            <button key={o.user_id} type="button" role="radio" aria-checked={shownMate === o.user_id}
              className={`mate-chip${shownMate === o.user_id ? ' is-on' : ''}`} onClick={() => setMate(o.user_id)}>{o.name || 'Roommate'}</button>
          ))}
        </div>
      )}

      <LayoutGroup id="pantry">
        {items.length > 0 && (
          <ul className="pantry-list" aria-label={listLabel}>
            {items.map((item, i) => (
              <ItemRow key={rowKey(item.owner_id, item.name)} item={item} tag={tagFor(item)} sub={subFor(item)} enter={stagger ? i : undefined}
                onOpen={() => setOpenId(item.id)} />
            ))}
          </ul>
        )}
        {items.length === 0 && (tab === 'shared'
          ? <EmptyState title="Nothing on the shelf yet" />
          : tab === 'mine'
            ? <EmptyState title="Your shelf is empty." body="Add things that are yours." />
            : <EmptyState title={others.some((o) => owners.has(o.user_id)) ? `${mateName} hasn't added anything yet.` : 'No one has a personal shelf yet.'} />)}
        {offerBasics && (
          <section className="basics" aria-label="Add the basics">
            <p className="eyebrow">Add the basics</p>
            <div className="basics__chips">
              {missing.map((b) => (
                <m.button key={b} type="button" className="basic-chip" layoutId={rowKey(null, b)} layout="position" transition={{ layout: SPRING.smooth }}
                  onClick={() => { haptic(); addBasics.mutate({ p_names: [b], me }); }}>
                  <span aria-hidden>{iconFor(b)}</span> {b}
                </m.button>
              ))}
            </div>
          </section>
        )}
      </LayoutGroup>

      <ItemSheet item={state.pantry.find((i) => i.id === openId) ?? null} onClose={() => setOpenId(null)}
        onRestock={(item) => { setOpenId(null); setRestocking({ item }); }} />
      <RestockSheet open={restocking !== null} item={restocking?.item ?? null} onClose={() => setRestocking(null)} onSent={setSent} />
    </main>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/features/pantry`
Expected: PASS (all of `Pantry.test.tsx` and `RestockSheet.test.tsx`).

Run: `npx tsc -b`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/features/pantry/ItemSheet.tsx src/features/pantry/Pantry.tsx src/features/pantry/Pantry.test.tsx
git commit -F - <<'EOF'
feat(pantry): item actions: stock, rule, remove, restock request, ask and answer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 10: Add item sheet and FAB menu

**Files:**
- Create: `src/features/pantry/AddItemSheet.tsx`
- Create: `src/features/pantry/FabMenu.tsx`
- Modify: `src/features/pantry/Pantry.tsx` (three exact edits)
- Modify: `src/features/pantry/Pantry.test.tsx` (append)

**Interfaces:**
- Consumes:
  - From Task 7: `usePantryActions().add`.
  - From Task 8: `RestockSheet`, opened with `item: null` for free text.
  - From Task 2: `cleanName`, `sameName`, `RULE_LABEL` and `PantryRule`.
  - The `.fab` styles from `chores.css` (M1).
- Produces:
  - `AddItemSheet({ open: boolean; onClose: () => void; initialKind: 'shared' | 'personal' })`.
  - `FabMenu({ onAdd: () => void; onRequest: () => void })`.
    - The "+" (`aria-label` "Add or request", then "Close menu"; `aria-expanded`) rotates 45° into "×".
    - The two pills, "Add to Pantry" and "Request Restock", spring up bottom-first over an opacity-only white scrim.
    - Escape or a tap on the scrim closes it.
    - It is hidden on the Roommates tab (screen 15 has no "+").
  - Opened from My Items, the add sheet starts on Personal.

- [ ] **Step 1: Write the failing tests** — append to `src/features/pantry/Pantry.test.tsx`:

```tsx
const openMenu = async () => userEvent.click(screen.getByRole('button', { name: 'Add or request' }));

test('the + opens Add to Pantry and Request Restock, and becomes a close button', async () => {
  open(house({ pantry: [item({ name: 'Milk' })] }));
  await openMenu();
  expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: 'Add to Pantry' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Request Restock' })).toBeInTheDocument();
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('button', { name: 'Add to Pantry' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Add or request' })).toHaveAttribute('aria-expanded', 'false');
});

test('adding: the sharing rule shows only for personal items, and the button says where it goes', async () => {
  open(house());
  await openMenu();
  await userEvent.click(screen.getByRole('button', { name: 'Add to Pantry' }));
  const sheet = await screen.findByRole('dialog', { name: 'Add to Pantry' });
  expect(within(sheet).getByRole('radio', { name: 'Shared' })).toHaveAttribute('aria-checked', 'true');
  expect(within(sheet).getByLabelText('Item name')).toHaveAttribute('placeholder', 'e.g., Paper Towels');
  expect(within(sheet).queryByRole('radiogroup', { name: 'Sharing rule' })).toBeNull();
  expect(within(sheet).getByRole('button', { name: 'Add to Shared List' })).toBeDisabled();
  await userEvent.click(within(sheet).getByRole('radio', { name: 'Personal' }));
  expect(within(sheet).getByLabelText('Item name')).toHaveAttribute('placeholder', 'e.g., Almond Milk');
  expect(within(sheet).getByRole('radio', { name: 'Ask first' })).toHaveAttribute('aria-checked', 'true');
  await userEvent.click(within(sheet).getByRole('radio', { name: 'Do not touch' }));
  await userEvent.type(within(sheet).getByLabelText('Item name'), 'Almond milk');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Add to My Shelf' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('add_pantry_item', { p_name: 'Almond milk', p_owner_personal: true, p_rule: 'do_not_touch' }));
});

test('adding a shared item sends no rule and shows it at once', async () => {
  open(house({ pantry: [item({ name: 'Hummus' })] }));
  await openMenu();
  await userEvent.click(screen.getByRole('button', { name: 'Add to Pantry' }));
  const sheet = await screen.findByRole('dialog', { name: 'Add to Pantry' });
  await userEvent.type(within(sheet).getByLabelText('Item name'), 'Dish soap');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Add to Shared List' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('add_pantry_item', { p_name: 'Dish soap', p_owner_personal: false, p_rule: null }));
  expect(shelfNames(screen.getByRole('list', { name: 'Shared items' }))).toEqual(['Dish soap', 'Hummus']);
});

test('a duplicate name is caught before sending, ignoring case and spaces', async () => {
  open(house({ pantry: [item({ name: 'Paper towels' })] }));
  await openMenu();
  await userEvent.click(screen.getByRole('button', { name: 'Add to Pantry' }));
  const sheet = await screen.findByRole('dialog', { name: 'Add to Pantry' });
  await userEvent.type(within(sheet).getByLabelText('Item name'), '  paper   TOWELS ');
  expect(within(sheet).getByRole('alert')).toHaveTextContent('Already in the pantry');
  expect(within(sheet).getByRole('button', { name: 'Add to Shared List' })).toBeDisabled();
  await userEvent.click(within(sheet).getByRole('radio', { name: 'Personal' })); // my own shelf is a different list
  expect(within(sheet).queryByRole('alert')).toBeNull();
});

test('from My Items, adding starts on Personal', async () => {
  open(house(), '/pantry?tab=mine');
  await openMenu();
  await userEvent.click(screen.getByRole('button', { name: 'Add to Pantry' }));
  const sheet = await screen.findByRole('dialog', { name: 'Add to Pantry' });
  expect(within(sheet).getByRole('radio', { name: 'Personal' })).toHaveAttribute('aria-checked', 'true');
});

test('Request Restock from the menu takes free text through to Request Sent', async () => {
  open(house());
  await openMenu();
  await userEvent.click(screen.getByRole('button', { name: 'Request Restock' }));
  const sheet = await screen.findByRole('dialog', { name: 'Request Restock' });
  await userEvent.type(within(sheet).getByLabelText("What's needed"), 'Dish soap');
  await userEvent.click(within(sheet).getByRole('radio', { name: 'Medium' }));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Send to Chores Pool' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('request_restock', { p_name: 'Dish soap', p_effort: 2 }));
  expect(await screen.findByRole('heading', { name: 'Request Sent!' })).toBeInTheDocument();
});

test('there is no + on the Roommates tab', () => {
  open(house(), '/pantry?tab=roommates');
  expect(screen.queryByRole('button', { name: 'Add or request' })).toBeNull();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/pantry/Pantry.test.tsx`
Expected: the new tests FAIL, with `Unable to find an accessible element with the role "button" and name "Add or request"`.

- [ ] **Step 3: Create `src/features/pantry/FabMenu.tsx`**

```tsx
import { Plus } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { useEffect, useState } from 'react';
import { haptic } from '../../lib/haptics';
import { EASE_IOS, SPRING } from '../../lib/motion';

/**
 * Screen 20: the + opens two pills that spring up from it, bottom one first, while the + turns into ×.
 * Everything moves by transform and opacity; the white scrim is its own layer fading by opacity.
 */
export function FabMenu({ onAdd, onRequest }: { onAdd: () => void; onRequest: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  const items = [
    { label: 'Add to Pantry', icon: '🛒', tint: 'var(--lav)', run: onAdd },
    { label: 'Request Restock', icon: '📋', tint: 'var(--peach-bg)', run: onRequest },
  ];
  return (
    <>
      <AnimatePresence>
        {open && (
          <m.div key="scrim" className="fab-scrim" aria-hidden onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.18, ease: EASE_IOS } }}
            exit={{ opacity: 0, transition: { duration: 0.14, ease: EASE_IOS } }} />
        )}
      </AnimatePresence>
      <div className="fab-menu" id="pantry-fab-menu">
        <AnimatePresence>
          {open && items.map((x, i) => (
            <m.button key={x.label} type="button" className="fab-pill"
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { ...SPRING.snappy, delay: (items.length - 1 - i) * 0.04 } }}
              exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.12, ease: EASE_IOS } }}
              onClick={() => { setOpen(false); x.run(); }}>
              <span className="fab-pill__icon" style={{ background: x.tint }} aria-hidden>{x.icon}</span>{x.label}
            </m.button>
          ))}
        </AnimatePresence>
      </div>
      <m.button type="button" className="fab" aria-label={open ? 'Close menu' : 'Add or request'} aria-expanded={open} aria-controls="pantry-fab-menu"
        onClick={() => { haptic(); setOpen((o) => !o); }}
        initial={false} animate={{ rotate: open ? 45 : 0 }} transition={SPRING.snappy}>
        <Plus size={26} aria-hidden />
      </m.button>
    </>
  );
}
```

- [ ] **Step 4: Create `src/features/pantry/AddItemSheet.tsx`**

```tsx
import { m } from 'motion/react';
import { type FormEvent, useState } from 'react';
import { cleanName, type PantryRule, RULE_LABEL, sameName } from '@domain/pantry.ts';
import { haptic } from '../../lib/haptics';
import { SPRING } from '../../lib/motion';
import { useMe } from '../../lib/state';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { usePantryActions } from './usePantryActions';

type Kind = 'shared' | 'personal';
const RULES: PantryRule[] = ['do_not_touch', 'ask_first']; // screen 17's order

/** Screens 16 / 17: Shared or Personal; personal items also get a sharing rule (Ask first by default). */
export function AddItemSheet({ open, onClose, initialKind }: { open: boolean; onClose: () => void; initialKind: Kind }) {
  const { me, state } = useMe();
  const { add } = usePantryActions();
  const [kind, setKind] = useState<Kind>(initialKind);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) setKind(initialKind); } // each opening starts on the current tab's shelf
  const [text, setText] = useState('');
  const [rule, setRule] = useState<PantryRule>('ask_first');
  const name = cleanName(text);
  const owner = kind === 'personal' ? me : null;
  const dupe = name !== '' && state.pantry.some((i) => i.owner_id === owner && sameName(i.name, name));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || dupe) return;
    haptic();
    add.mutate({ p_name: name, p_owner_personal: kind === 'personal', p_rule: kind === 'personal' ? rule : null, me });
    setText(''); setRule('ask_first'); onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add to Pantry">
      <form className="add-item" onSubmit={submit}>
        <div className="seg seg--ink" role="radiogroup" aria-label="Whose is it">
          {(['shared', 'personal'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} className={`seg__opt${kind === k ? ' is-on' : ''}`} onClick={() => setKind(k)}>
              {kind === k && <m.span layoutId="seg-kind" className="seg__pill" transition={SPRING.snappy} aria-hidden />}{k === 'shared' ? 'Shared' : 'Personal'}
            </button>
          ))}
        </div>
        <label className="field">
          <span className="field__control">
            <input maxLength={40} aria-label="Item name" placeholder={kind === 'shared' ? 'e.g., Paper Towels' : 'e.g., Almond Milk'}
              value={text} onChange={(e) => setText(e.target.value)} />
          </span>
        </label>
        {dupe && <p className="field__error" role="alert">Already in the pantry</p>}
        {kind === 'personal' && (
          <>
            <p className="eyebrow">Sharing rule</p>
            <div className="rules" role="radiogroup" aria-label="Sharing rule">
              {RULES.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={rule === r} className={`rule-opt rule-opt--${r}${rule === r ? ' is-on' : ''}`} onClick={() => setRule(r)}>
                  {RULE_LABEL[r]}
                </button>
              ))}
            </div>
          </>
        )}
        <Button block type="submit" disabled={!name || dupe}>{kind === 'shared' ? 'Add to Shared List' : 'Add to My Shelf'}</Button>
      </form>
    </Sheet>
  );
}
```

- [ ] **Step 5: Wire them into `src/features/pantry/Pantry.tsx`** (three edits on the Task 9 file)

Replace

```ts
import { ItemSheet } from './ItemSheet';
```
with
```ts
import { AddItemSheet } from './AddItemSheet';
import { FabMenu } from './FabMenu';
import { ItemSheet } from './ItemSheet';
```

Replace

```ts
  const [sent, setSent] = useState<string | null>(null);
```
with
```ts
  const [sent, setSent] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
```

Replace

```tsx
      <RestockSheet open={restocking !== null} item={restocking?.item ?? null} onClose={() => setRestocking(null)} onSent={setSent} />
```
with
```tsx
      <RestockSheet open={restocking !== null} item={restocking?.item ?? null} onClose={() => setRestocking(null)} onSent={setSent} />
      {tab !== 'roommates' && <FabMenu onAdd={() => setAdding(true)} onRequest={() => setRestocking({ item: null })} />}
      <AddItemSheet open={adding} onClose={() => setAdding(false)} initialKind={tab === 'mine' ? 'personal' : 'shared'} />
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/features/pantry`
Expected: PASS (all pantry tests).

Run: `npx tsc -b`
Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add src/features/pantry/AddItemSheet.tsx src/features/pantry/FabMenu.tsx src/features/pantry/Pantry.tsx src/features/pantry/Pantry.test.tsx
git commit -F - <<'EOF'
feat(pantry): FAB menu, Add to Pantry sheet and free-text restock requests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 11: Chores "Up for grabs" restock rows

**Files:**
- Create: `src/features/chores/RestockRow.tsx`
- Create: `src/features/chores/useRestockActions.ts`
- Modify: `src/features/chores/Chores.tsx`, `src/features/chores/chores.css`, `src/features/chores/Chores.test.tsx`
- Modify (copy only): `src/features/profile/HouseholdSettings.tsx:89`, `src/features/profile/Profile.tsx:169`, `src/lib/selectors.ts:25` (comment)

**Interfaces:**
- Consumes:
  - From Task 2: `openRestocks`.
  - From Task 5: `AppState.restocks`, `useAction` and the RPC names `claim_restock`, `unclaim_restock`, `complete_restock` and `cancel_restock`.
  - From M1: `EffortChip`, `.task`/`.claim-btn` styles and `LayoutGroup id="chores"`.
- Produces:
  - `useRestockActions()` returns `{ claim, unclaim, complete, cancel }`. Arguments are `{ p_id, me }` for claim and complete, `{ p_id }` for the rest. Each update is optimistic. Completing also sets the linked item `in_stock` and drops the row from the pool.
  - `RestockRow({ r, me, names, onClaim, onUnclaim, onDone, onCancel })`. The row shows 🛒, "Buy {item}", the effort chip, and a status line:
    - "Requested by Priya" or "Requested by you";
    - "You're on it";
    - "Priya's on it".
  - The row's actions depend on who you are:

| Who you are | Main button | Links |
|---|---|---|
| Nobody has claimed it | **Claim** | "Done" |
| You claimed it | **Done** | "Unclaim" |
| You requested it | (as above) | "Cancel" |
| Someone else claimed it | — | — |

  - The "Missed by roommates" section is renamed **"Up for grabs"** (region label and eyebrow). It lists missed chores, then open restock requests, oldest first.

- [ ] **Step 1: Write the failing tests** — in `src/features/chores/Chores.test.tsx`, replace

```ts
import { fixture, renderWithState } from '../../test-utils';
import Chores from './Chores';
```
with
```ts
import { fixture, renderWithState } from '../../test-utils';
import type { Restock } from '../../lib/types';
import Chores from './Chores';
```

replace

```ts
test('missed by roommates can be claimed, and moves into my tasks', async () => {
  renderWithState(<Chores />, { state: fixture(), route: '/chores' });
  const pool = screen.getByRole('region', { name: 'Missed by roommates' });
```
with
```ts
test('missed by roommates can be claimed, and moves into my tasks', async () => {
  renderWithState(<Chores />, { state: fixture(), route: '/chores' });
  const pool = screen.getByRole('region', { name: 'Up for grabs' });
```

and append:

```tsx
const restock = (over: Partial<Restock>): Restock => ({
  id: 'r1', item_id: null, name: 'Paper towels', effort: 2, requested_by: 'p', claimed_by: null, status: 'open',
  done_by: null, done_day: null, created_at: '2026-10-01T00:00:00Z', ...over,
});

test('restock requests sit in Up for grabs: claim, unclaim, then done', async () => {
  renderWithState(<Chores />, { state: fixture({ restocks: [restock({})] }), route: '/chores' });
  const grabs = screen.getByRole('region', { name: 'Up for grabs' });
  expect(within(grabs).getByText('Buy Paper towels')).toBeInTheDocument();
  expect(within(grabs).getByText('Medium')).toBeInTheDocument();
  expect(within(grabs).getByText('Requested by Priya')).toBeInTheDocument();
  await userEvent.click(within(grabs).getByRole('button', { name: 'Claim Paper towels' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('claim_restock', { p_id: 'r1' }));
  expect(within(grabs).getByText("You're on it")).toBeInTheDocument();
  await userEvent.click(within(grabs).getByRole('button', { name: 'Unclaim Paper towels' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('unclaim_restock', { p_id: 'r1' }));
  await userEvent.click(within(grabs).getByRole('button', { name: 'Done: Paper towels' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('complete_restock', { p_id: 'r1' }));
  expect(within(grabs).queryByText('Buy Paper towels')).toBeNull();
});

test("a request someone else claimed shows who's on it; my own request can be cancelled", async () => {
  renderWithState(<Chores />, {
    state: fixture({ restocks: [restock({ claimed_by: 'p' }), restock({ id: 'r2', name: 'Rice', requested_by: 'me', created_at: '2026-10-01T01:00:00Z' })] }),
    route: '/chores',
  });
  const grabs = screen.getByRole('region', { name: 'Up for grabs' });
  expect(within(grabs).getByText("Priya's on it")).toBeInTheDocument();
  expect(within(grabs).queryByRole('button', { name: 'Claim Paper towels' })).toBeNull();
  expect(within(grabs).queryByRole('button', { name: 'Done: Paper towels' })).toBeNull();
  expect(within(grabs).getByText('Requested by you')).toBeInTheDocument();
  await userEvent.click(within(grabs).getByRole('button', { name: 'Cancel request for Rice' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('cancel_restock', { p_id: 'r2' }));
  expect(within(grabs).queryByText('Buy Rice')).toBeNull();
});

test('an empty pool says so', () => {
  const s = fixture();
  renderWithState(<Chores />, { state: { ...s, assignments: s.assignments.filter((a) => a.status !== 'missed') }, route: '/chores' });
  expect(within(screen.getByRole('region', { name: 'Up for grabs' })).getByText('Nothing waiting. The house is on it.')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/features/chores/Chores.test.tsx`
Expected: FAIL, with `Unable to find role="region" and name "Up for grabs"`.

- [ ] **Step 3: Create `src/features/chores/useRestockActions.ts`**

```ts
import { useAction } from '../../lib/state';
import type { AppState, PantryItem, Restock } from '../../lib/types';
import { useToast } from '../../ui/Toast';

const patch = (s: AppState, id: string, f: (r: Restock) => Restock): AppState =>
  ({ ...s, restocks: s.restocks.map((r) => (r.id === id ? f(r) : r)) });

/** Restock requests in the pool: claim, unclaim, done (no claim needed), cancel (requester). All optimistic. */
export function useRestockActions() {
  const toast = useToast();
  const claim = useAction<{ p_id: string; me: string }>('claim_restock', {
    optimistic: (s, { p_id, me }) => patch(s, p_id, (r) => ({ ...r, claimed_by: me })),
    onSuccess: () => toast.show("It's yours — thanks for doing the run."),
  });
  const unclaim = useAction<{ p_id: string }>('unclaim_restock', {
    optimistic: (s, { p_id }) => patch(s, p_id, (r) => ({ ...r, claimed_by: null })),
  });
  const complete = useAction<{ p_id: string; me: string }>('complete_restock', {
    optimistic: (s, { p_id, me }) => {
      const itemId = s.restocks.find((r) => r.id === p_id)?.item_id;
      const next = patch(s, p_id, (r) => ({ ...r, status: 'done', done_by: me, done_day: s.today, claimed_by: me }));
      return { ...next, pantry: s.pantry.map((i): PantryItem => (i.id === itemId ? { ...i, stock: 'in_stock' } : i)) };
    },
    onSuccess: () => toast.show('Restocked. The house thanks you.'),
  });
  const cancel = useAction<{ p_id: string }>('cancel_restock', {
    optimistic: (s, { p_id }) => patch(s, p_id, (r) => ({ ...r, status: 'cancelled' })),
  });
  return { claim, unclaim, complete, cancel };
}
```

- [ ] **Step 4: Create `src/features/chores/RestockRow.tsx`**

```tsx
import { m } from 'motion/react';
import type { CSSProperties } from 'react';
import { SPRING } from '../../lib/motion';
import type { Restock } from '../../lib/types';
import { EffortChip } from '../../ui/EffortChip';

interface Props {
  r: Restock; me: string; names: Record<string, string>; enter?: number;
  onClaim: () => void; onUnclaim: () => void; onDone: () => void; onCancel: () => void;
}

/** A restock request in the Up for grabs pool: claim it first, or just buy it. Nobody owes anyone for it. */
export function RestockRow({ r, me, names, enter, onClaim, onUnclaim, onDone, onCancel }: Props) {
  const free = r.claimed_by === null;
  const mine = r.claimed_by === me;
  const requester = r.requested_by === me ? 'you' : names[r.requested_by] ?? 'a roommate';
  const status = free ? `Requested by ${requester}` : mine ? "You're on it" : `${names[r.claimed_by!] ?? 'A roommate'}'s on it`;
  const links = free || mine || r.requested_by === me;
  return (
    <m.div layoutId={`restock-${r.id}`} layout="position" transition={{ layout: SPRING.smooth }}
      className={`task task--pool${enter !== undefined ? ' stagger' : ''}`} style={enter !== undefined ? ({ '--i': enter } as CSSProperties) : undefined}>
      <div className="task__card">
        <span className="task__icon task__icon--cart" aria-hidden>🛒</span>
        <div className="task__body restock__body">
          <span className="task__name">Buy {r.name}</span>
          <span className="task__meta"><EffortChip effort={r.effort} /><span className="muted">{status}</span></span>
          {links && (
            <span className="restock__links">
              {free && <button type="button" onClick={onDone} aria-label={`Done: ${r.name}`}>Done</button>}
              {mine && <button type="button" onClick={onUnclaim} aria-label={`Unclaim ${r.name}`}>Unclaim</button>}
              {r.requested_by === me && <button type="button" onClick={onCancel} aria-label={`Cancel request for ${r.name}`}>Cancel</button>}
            </span>
          )}
        </div>
        {free && <button className="claim-btn" onClick={onClaim} aria-label={`Claim ${r.name}`}>Claim</button>}
        {mine && <button className="claim-btn" onClick={onDone} aria-label={`Done: ${r.name}`}>Done</button>}
      </div>
    </m.div>
  );
}
```

- [ ] **Step 5: Render restock rows in the pool** — in `src/features/chores/Chores.tsx`:

Replace

```ts
import { DAY_NAMES, weekdayOf, weekStartOf } from '@domain/time.ts';
```
with
```ts
import { openRestocks } from '@domain/pantry.ts';
import { DAY_NAMES, weekdayOf, weekStartOf } from '@domain/time.ts';
```

Replace

```ts
import { useChoreActions } from './useChoreActions';
```
with
```ts
import { RestockRow } from './RestockRow';
import { useChoreActions } from './useChoreActions';
import { useRestockActions } from './useRestockActions';
```

Replace

```ts
  const stagger = useFirstMount('chores');
```
with
```ts
  const stagger = useFirstMount('chores');
  const restock = useRestockActions();
  const restocks = openRestocks(state.restocks);
```

Replace

```tsx
          <section className="section" aria-label="Missed by roommates">
            <p className="eyebrow eyebrow--warm">Missed by roommates</p>
            {pool(state, me).length === 0
              ? <p className="muted">Nothing waiting. The house is on it.</p>
              : pool(state, me).map((a, i) => row(a, { pool: true }, myTasksOn(state, me, state.today).length + i))}
          </section>
```
with
```tsx
          <section className="section" aria-label="Up for grabs">
            <p className="eyebrow eyebrow--warm">Up for grabs</p>
            {pool(state, me).length === 0 && restocks.length === 0
              ? <p className="muted">Nothing waiting. The house is on it.</p>
              : (
                <>
                  {pool(state, me).map((a, i) => row(a, { pool: true }, myTasksOn(state, me, state.today).length + i))}
                  {restocks.map((r) => (
                    <RestockRow key={r.id} r={r} me={me} names={names}
                      onClaim={() => { haptic(); restock.claim.mutate({ p_id: r.id, me }); }}
                      onUnclaim={() => restock.unclaim.mutate({ p_id: r.id })}
                      onDone={() => { haptic('success'); restock.complete.mutate({ p_id: r.id, me }); }}
                      onCancel={() => restock.cancel.mutate({ p_id: r.id })} />
                  ))}
                </>
              )}
          </section>
```

Append to `src/features/chores/chores.css`:

```css
/* restock requests in the pool (a <div> body, not a button: the actions are its own buttons) */
.restock__body { cursor: default; }
.restock__body .task__name { overflow-wrap: anywhere; }
.restock__body .task__meta { flex-wrap: wrap; }
.restock__links { display: flex; flex-wrap: wrap; column-gap: 16px; }
.restock__links button { min-height: 44px; padding: 0; border: 0; background: none; color: var(--lav-ink); font-weight: 600; font-size: 14px; cursor: pointer; }
.task__icon--cart { background: var(--light-bg); }
```

- [ ] **Step 6: Rename the pool everywhere the copy mentions it**

In `src/features/profile/HouseholdSettings.tsx`, replace

```tsx
        <p className="muted">Unfinished chores move to “Missed by roommates” after this time.</p>
```
with
```tsx
        <p className="muted">Unfinished chores move to “Up for grabs” after this time.</p>
```

In `src/features/profile/Profile.tsx`, replace

```tsx
        <p className="muted">Their upcoming chores go to “Missed by roommates” so anyone can claim them.</p>
```
with
```tsx
        <p className="muted">Their upcoming chores go to “Up for grabs” so anyone can claim them.</p>
```

In `src/lib/selectors.ts`, replace

```ts
/** Missed by roommates — claimable by me. */
```
with
```ts
/** Missed by roommates (the "Up for grabs" pool) — claimable by me. */
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run src`
Expected: PASS (all app tests, including Chores, Home, Profile and Plan).

Run: `npx tsc -b`
Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add src/features/chores src/features/profile/HouseholdSettings.tsx src/features/profile/Profile.tsx src/lib/selectors.ts
git commit -F - <<'EOF'
feat(chores): restock requests in the Up for grabs pool: claim, unclaim, done, cancel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

### Task 12: Activity text, e2e extension, width sweep, Lighthouse and final budget

This task does **not** deploy to prod (see "Rollout (controller)" below).

**Files:**
- Modify: `src/features/activity/text.ts`, `src/features/activity/activity.test.tsx`
- Modify: `e2e/roommates.spec.ts` (extend the two-roommate test)
- Create: `e2e/widths.spec.ts`

**Interfaces:**
- Consumes: everything above. The dev project has migrations 000011–000014 and the Task 6 tick deploy.
- Produces:
  - The household feed reads "Priya asked for Paper towels" (`restock_requested`) and "Aarav restocked Paper towels" (`restocked`).
  - The e2e covers the spec §7 flow.
  - A 20-width overlap sweep of Pantry (Shared, My Items, FAB menu) and Chores.

- [ ] **Step 1: Write the failing test** — in `src/features/activity/activity.test.tsx`, replace

```ts
  [item('created', 'me'), 'You created the home'],
])('activityText %#', (i, text) => expect(activityText(i, names, 'me')).toBe(text));
```
with
```ts
  [item('created', 'me'), 'You created the home'],
  [item('restock_requested', 'p', { item: 'Paper towels' }), 'Priya asked for Paper towels'],
  [item('restocked', 'me', { item: 'Paper towels' }), 'You restocked Paper towels'],
])('activityText %#', (i, text) => expect(activityText(i, names, 'me')).toBe(text));
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/features/activity`
Expected: FAIL. The two new cases get `Something happened at home`.

- [ ] **Step 3: Add the activity text** — in `src/features/activity/text.ts`, replace

```ts
    case 'day_kept': return `${p.streak}-day streak — house peace secured`;
```
with
```ts
    case 'day_kept': return `${p.streak}-day streak — house peace secured`;
    case 'restock_requested': return `${who} asked for ${p.item}`;
    case 'restocked': return `${who} restocked ${p.item}`;
```

Run: `npx vitest run src/features/activity`
Expected: PASS.

- [ ] **Step 4: Extend the two-roommate e2e** — in `e2e/roommates.spec.ts`, replace the last three lines of the test

```ts
  await priya.getByRole('link', { name: 'Profile' }).click();
  await expect(priya.getByText(/ahead — next week will be a little lighter/)).toBeVisible();
  await expect(priya.getByText(/pick up .* extra point/)).toHaveCount(0);
});
```
with
```ts
  await priya.getByRole('link', { name: 'Profile' }).click();
  await expect(priya.getByText(/ahead — next week will be a little lighter/)).toBeVisible();
  await expect(priya.getByText(/pick up .* extra point/)).toHaveCount(0);

  // Pantry: Priya adds Paper towels from the basics, marks them Out and sends a restock to the Chores pool
  await priya.getByRole('link', { name: 'Pantry' }).click();
  await expect(priya.getByText('Nothing on the shelf yet')).toBeVisible();
  await priya.getByRole('region', { name: 'Add the basics' }).getByRole('button', { name: 'Paper towels' }).click();
  const shared = priya.getByRole('list', { name: 'Shared items' });
  const towels = shared.getByRole('button', { name: /Paper towels/ });
  await expect(towels).toBeEnabled(); // the saved row, not the optimistic one
  await towels.click();
  const sheet = priya.getByRole('dialog', { name: 'Paper towels' });
  await sheet.getByRole('radio', { name: 'Out' }).click();
  await sheet.getByRole('button', { name: 'Request restock' }).click();
  await priya.getByRole('dialog', { name: 'Request Restock' }).getByRole('button', { name: 'Send to Chores Pool' }).click();
  await expect(priya.getByRole('heading', { name: 'Request Sent!' })).toBeVisible();
  await priya.getByRole('button', { name: 'Back to Pantry' }).click();
  await expect(shared.getByText('Requested')).toBeVisible();

  // Aarav sees it up for grabs in Chores and buys it
  await aarav.goto('/chores');
  const grabs = aarav.getByRole('region', { name: 'Up for grabs' });
  await expect(grabs.getByText('Buy Paper towels')).toBeVisible();
  await expect(grabs.getByText('Requested by Priya')).toBeVisible();
  await grabs.getByRole('button', { name: 'Done: Paper towels' }).click();
  await expect(grabs.getByText('Buy Paper towels')).toHaveCount(0);
  await expect.poll(async () => (await admin().from('restock_requests').select('status').eq('household_id', householdId!).single()).data?.status)
    .toBe('done');

  // Priya sees it back in stock
  await priya.reload();
  const shelf = priya.getByRole('list', { name: 'Shared items' });
  await expect(shelf.getByRole('button', { name: /Paper towels/ })).toBeVisible();
  await expect(shelf.getByText('Out')).toHaveCount(0);
  await shelf.getByRole('button', { name: /Paper towels/ }).click();
  await expect(priya.getByRole('dialog', { name: 'Paper towels' }).getByRole('radio', { name: 'In stock' })).toHaveAttribute('aria-checked', 'true');
});
```

- [ ] **Step 5: Create the width sweep** — `e2e/widths.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { admin, cleanup } from '../tests/db/helpers';

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const storageKey = `sb-${new URL(process.env.VITE_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`;
const WIDTHS = [320, 340, 360, 375, 390, 393, 400, 412, 414, 428, 430, 480, 540, 600, 700, 768, 820, 1024, 1280, 1440];
const userIds: string[] = [];
const householdIds: string[] = [];
test.afterAll(() => cleanup({ userIds, householdIds }));

/** Nothing scrolls sideways, no row's parts overlap, nothing pokes past the edge, the tab bar's items don't collide. */
const problems = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const out: string[] = [];
  const hit = (a: DOMRect, b: DOMRect) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
  const pairs = (rects: DOMRect[], what: string) => rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => { if (hit(a, b)) out.push(what); }));
  if (document.documentElement.scrollWidth > innerWidth) out.push('page scrolls sideways');
  pairs([...document.querySelectorAll('.tabbar__item')].map((e) => e.getBoundingClientRect()), 'tab bar items overlap');
  for (const row of document.querySelectorAll('.pantry-row, .task__card, .fab-menu')) {
    pairs([...row.children].map((c) => c.getBoundingClientRect()), `overlap in "${(row.textContent ?? '').slice(0, 40)}"`);
    const r = row.getBoundingClientRect();
    if (r.right > innerWidth + 0.5 || r.left < -0.5) out.push(`"${(row.textContent ?? '').slice(0, 40)}" past the edge`);
  }
  for (const pill of document.querySelectorAll('.fab-pill')) {
    const r = pill.getBoundingClientRect();
    if (r.left < -0.5 || r.right > innerWidth + 0.5) out.push('FAB pill past the edge');
  }
  return out;
});

test('Pantry and Chores fit at 20 widths with nothing overlapping', async ({ page }) => {
  test.setTimeout(240_000);
  const email = `widths-${Date.now()}@roomie.test`;
  const password = `pw-${crypto.randomUUID()}`;
  const { data: created, error } = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  userIds.push(created.user.id);
  const client = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, opts);
  const { data: auth, error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  await client.rpc('update_profile', { p_name: 'Alexandria' });
  const { data: h } = await client.rpc('create_household', { p_name: 'Width flat', p_busy: [], p_chores: [] });
  householdIds.push(h as string);
  // long names, every tag and both kinds of pool row
  await client.rpc('add_pantry_basics', { p_names: ['Olive oil', 'Rice', 'Salt', 'Milk', 'Bread', 'Paper towels'] });
  await client.rpc('add_pantry_item', { p_name: 'Extra-long organic unsweetened almond milk', p_owner_personal: true, p_rule: 'do_not_touch' });
  await client.rpc('add_pantry_item', { p_name: 'Oat milk', p_owner_personal: true, p_rule: 'ask_first' });
  const { data: rice } = await admin().from('pantry_items').select('id').eq('household_id', h).eq('name', 'Rice').single();
  await client.rpc('request_restock', { p_item: rice!.id, p_effort: 3 });
  const { data: salt } = await admin().from('pantry_items').select('id').eq('household_id', h).eq('name', 'Salt').single();
  await client.rpc('set_item_stock', { p_id: salt!.id, p_stock: 'low' });
  await client.rpc('request_restock', { p_name: 'Washing-up liquid for the big sink', p_effort: 2 });

  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [storageKey, JSON.stringify(auth.session)]);
  await page.goto('/pantry');
  await expect(page.getByRole('heading', { name: 'Pantry' })).toBeVisible();

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 800 });
    await page.getByRole('link', { name: 'Pantry' }).click();
    await page.getByRole('tab', { name: 'Shared' }).click();
    await expect(page.getByRole('list', { name: 'Shared items' })).toBeVisible();
    expect(await problems(page), `Pantry · Shared at ${width}px`).toEqual([]);
    await page.getByRole('button', { name: 'Add or request' }).click();
    await expect(page.getByRole('button', { name: 'Request Restock' })).toBeVisible();
    expect(await problems(page), `FAB menu at ${width}px`).toEqual([]);
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: 'My Items' }).click();
    await expect(page.getByRole('list', { name: 'My items' })).toBeVisible();
    expect(await problems(page), `Pantry · My Items at ${width}px`).toEqual([]);
    await page.getByRole('link', { name: 'Chores' }).click();
    await expect(page.getByRole('region', { name: 'Up for grabs' })).toBeVisible();
    expect(await problems(page), `Chores at ${width}px`).toEqual([]);
  }
});
```

- [ ] **Step 6: Run the whole unit and DB suite**

Run: `npm test`
Expected: PASS. Every file passes; the `tests/db/*` suites run against dev, because `.env.local` has `SUPABASE_TEST_*`.

Run: `npx tsc -b`
Expected: no output.

- [ ] **Step 7: Run the e2e tests and the width sweep against dev**

Run: `npx playwright test`
Expected: `2 passed` (`roommates.spec.ts` and `widths.spec.ts`).
- If a width fails, the assertion message names the view and the width. Fix the CSS in `pantry.css` or `chores.css`, re-run, and commit the fix with this task.

- [ ] **Step 8: Check the final bundle budget**

Run: `npm run build 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep -E 'assets/(index|Pantry)-.*\.js'`
Expected: `assets/index-*.js … gzip:` **≤ 196.00 kB**, and a separate `assets/Pantry-*.js`.

Run: `grep -l "Nothing on the shelf" dist/assets/*.js`
Expected: only `dist/assets/Pantry-*.js` (never `index-*.js`).

- [ ] **Step 9: Lighthouse (mobile)**

Start the preview server with the Bash tool's `run_in_background: true`:

```bash
npx vite preview --port 4173 --strictPort
```

Then run:

```bash
npx --yes lighthouse@12 http://localhost:4173/welcome --only-categories=performance,accessibility --form-factor=mobile --chrome-flags="--headless=new" --output=json --output-path=/tmp/lh-pantry.json --quiet; node -e "const r=require(process.argv[1]);for(const c of Object.values(r.categories))console.log(c.id, Math.round(c.score*100))" "$(cygpath -w /tmp/lh-pantry.json)"
```
Expected: `performance` ≥ 90 and `accessibility` 100.
- `/welcome` measures the entry chunk that M2 must not grow.
- Pantry's own accessibility is covered by the role-based tests above. Lighthouse cannot sign in.
- Stop the background preview server afterwards.

- [ ] **Step 10: Commit**

```bash
git add src/features/activity/text.ts src/features/activity/activity.test.tsx e2e/roommates.spec.ts e2e/widths.spec.ts
git commit -F - <<'EOF'
test(pantry): restock activity text, two-roommate pantry e2e and 20-width sweep

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

## Rollout (controller)

Not part of any task; the controller runs it after the branch is reviewed and merged.

**What ships.** The backend only: Tasks 1-6 (domain code, tables and RLS, RPCs, `get_state`, tick). The web screens (Tasks 7-12) were not built; the Pantry screens are native. Nothing in this rollout adds a Pantry tab to the web app.

**Order matters:**
- **Tick first.** The new tick works against the old DB. The old tick has no copy for the `restock`/`ask` kinds, so one such notification would stall its drain. Deploy the tick before the DB push, or immediately after it with no pantry RPC calls on prod in between.
- **Then the DB.** The current web app ignores the new `get_state` fields and still works against the new functions.
- **Web app optional, and only after the DB.** It ships type/state plumbing only (no Pantry tab).

1. Finish the branch (superpowers:finishing-a-development-branch) and merge `feat/motion` as agreed.
2. Link the worktree to **prod**: `npx supabase link --project-ref <prod-ref>`. Supply the prod DB password and access token the same way as dev, read into variables, never printed.
3. Deploy the tick to prod: `npx supabase functions deploy tick --no-verify-jwt --use-api`.
4. Push the six new migrations to prod: `npx supabase db push --linked --password "$P"` (plain push, no `--include-all`; that flag was only needed on dev).
   - Expected, in order: `20261001000011_pantry_schema.sql`, `..._000012_pantry_rpc.sql`, `..._000013_pantry_state.sql`, `..._000014_pantry_tick.sql`, `..._000015_pantry_rpc_fixes.sql`, `20261001000016_pantry_final_fixes.sql`.
   - Nothing else is pending.
5. Optional: `npx vercel deploy --prod` (only after step 4).
6. Relink the worktree to **dev**: `npx supabase link --project-ref <dev-ref>`.
7. RPC-level smoke test on prod with two prod test accounts in one test household (signed-in clients, not the service role):
   - A: `add_pantry_item('Paper towels', false)`; A: `request_restock(p_item => <id>)`; B: `complete_restock(<request id>)`.
   - The item is `in_stock`, the request is `done` by B, one `restock_done` notification is queued for A, and `effort_ledger` is unchanged for both.
   - `get_state` returns `pantry`, `restocks` and `asks`.
   - The existing web app still loads, and pushes still arrive.
   - The UI smoke test (Pantry tab, Up for grabs, In stock, "picked up" push) runs when the native screens ship.
8. Next morning: confirm the digest still arrives, and that `restock` pushes are being sent:

```sql
select kind, count(*), count(*) filter (where skipped) as skipped
from notifications
where kind like 'restock%' or kind like 'ask%'
group by kind;
```

**Gate before the native Pantry goes live on prod.** Web-only roommates need the web restock pool rows, the web activity text (`src/features/activity/text.ts` kinds `restock_requested`, `restocked`) and a native push path. Otherwise accept that mixed households see "Something happened at home" in the web feed and that native users get no pantry pushes.
