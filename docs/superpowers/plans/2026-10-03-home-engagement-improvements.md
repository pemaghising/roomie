# Home Engagement Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Duolingo-style engagement patterns (progress rings, richer completion celebration, streak goals) and warmer copy to the Home screen, based on a Mobbin UI survey of Greenlight, GoHenry, Duolingo, Splitwise, Copilot and Revolut.

**Architecture:** Pure frontend changes to `src/features/home/Home.tsx` and `src/features/chores/Celebration.tsx`, plus one new small presentational component (`RingProgress`). No new backend RPCs or schema — everything renders from data already in `AppState` (`src/lib/types.ts`). The one piece of new client state (a streak goal target) is stored in `localStorage` since it's a personal preference with no cross-device sync requirement and no existing household-settings table column for it.

**Tech Stack:** React 19, TypeScript, Vitest + Testing Library, react-router, `@tanstack/react-query` (state already wired via `useMe`/`useAction` in `src/lib/state.ts`).

**Spec:** This plan's own Context section below (no separate spec doc — derived directly from the Mobbin research conversation and existing codebase).

## Context (replaces a separate spec doc)

Current `AppState` (`src/lib/types.ts:18-30`) already has everything needed:
- `streak: { current: number; best: number; last_settled_day: string | null } | null` — household-level only, not per-member. Per-member streaks do **not** exist in the data model — do not fabricate them.
- `balance: number` — a *points* balance (see `balanceSentence` in `supabase/functions/_shared/domain/copy.ts:47-53`), not money. Any "balance chip" must use point language, not currency.
- `roommates(s, today)` (`src/lib/selectors.ts:43-48`) already returns `{ ...member, today: number, done: number }` — exactly what a per-roommate completion ring needs, no selector changes required.

Existing pattern notes to follow:
- Haptics: this codebase has no shared haptics module wired up yet for Home/Celebration — `src/features/chores/useChoreActions.ts:8` uses a local `const buzz = () => navigator.vibrate?.(12);`. Reuse that inline pattern for any new tap feedback in these files — do not import `../../lib/haptics` (it does not exist on disk yet; it's an in-progress, uncommitted dependency of `Profile.tsx` elsewhere, unrelated to this plan).
- Sheets use the existing `Sheet` component (`src/ui/Sheet.tsx`) — title + children, portal-rendered, handles Escape/focus trap already.
- Buttons use the existing `Button` component (`src/ui/Button.tsx`) with `variant` and `block` props.
- CSS is plain hand-written classes per feature folder (`home.css`), using CSS custom properties already defined globally (`--radius-l`, `--radius-m`, `--ink`, `--ink-2`, `--navy`, `--lav`, etc.) — follow this, no CSS-in-JS.
- Test style: Vitest + Testing Library, `render`/`screen`/`userEvent`, plain `test(...)` blocks, no `describe` nesting (see `src/ui/TaskRow.test.tsx`).

## Global Constraints

- No new Supabase migrations, RPCs, or `AppState` shape changes — this is a presentation-layer plan only.
- Balance is in points, never render it with a currency symbol.
- Household streak is a single shared number — never invent or display a per-member streak value.
- Match existing code style: no semicolon-free style, single quotes, existing import ordering per file (external → `@domain` → local `lib` → local `ui` → local feature), existing accessibility patterns (`aria-hidden` on decorative icons/images, `role="progressbar"` for progress UI as `src/ui/Progress.tsx` already does).
- `prefers-reduced-motion` must be respected for any new animation, matching `home.css:12-14`'s existing `@media (prefers-reduced-motion: no-preference)` guard pattern.

## Review Focus

- Zero-division: a roommate with `today === 0` tasks must not render `NaN`/`Infinity` in the ring math (`done / today`).
- Household with only one member: the per-roommate ring row must still render sensibly (no "vs your roommates" language that implies plurality when there's just you).
- Streak goal already met or exceeded (e.g. goal 3, current streak 9): must not show a negative or zero "days to go" that reads as broken.
- Local storage unavailable/throws (private browsing, quota): streak-goal read/write must not crash the Home screen render.
- Balance exactly 0: chip must use the existing "all square" phrasing, not "+0 pts".

---

## File Structure

- Create: `src/ui/RingProgress.tsx` — small presentational SVG ring, used by Home's roommate row.
- Create: `src/ui/RingProgress.test.tsx` — covers the zero-division Review Focus item.
- Create: `src/lib/streakGoal.ts` — tiny localStorage-backed get/set/clear for a personal streak-day goal, wrapped in try/catch.
- Create: `src/lib/streakGoal.test.ts` — covers the storage-throws Review Focus item.
- Modify: `src/features/home/Home.tsx` — roommate rings, streak-goal UI, balance chip, warmer empty state.
- Modify: `src/features/home/home.css` — styles for the above.
- Modify: `src/features/chores/Celebration.tsx` — richer stat summary on completion.
- Modify: `src/features/chores/useChoreActions.ts` — compute and pass the stats `Celebration` needs.

---

### Task 1: `RingProgress` component

**Files:**
- Create: `src/ui/RingProgress.tsx`
- Test: `src/ui/RingProgress.test.tsx`

**Interfaces:**
- Produces: `RingProgress({ value, total, size, children }: { value: number; total: number; size?: number; children?: ReactNode }): JSX.Element` — a circular SVG progress ring with `role="img"` and an `aria-label` describing "X of Y done"; `children` render centered on top (used later for the avatar letter). Defaults: `size = 40`.
- Consumes: nothing beyond React.

- [ ] **Step 1: Write the failing test**

```tsx
// src/ui/RingProgress.test.tsx
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { RingProgress } from './RingProgress';

test('renders full ring and label when total is zero', () => {
  render(<RingProgress value={0} total={0} />);
  expect(screen.getByRole('img', { name: '0 of 0 done' })).toBeInTheDocument();
});

test('computes a partial arc without NaN', () => {
  render(<RingProgress value={1} total={3} />);
  const circles = document.querySelectorAll('circle');
  const progressCircle = circles[1] as SVGCircleElement;
  expect(progressCircle.getAttribute('stroke-dashoffset')).not.toContain('NaN');
  expect(screen.getByRole('img', { name: '1 of 3 done' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/ui/RingProgress.test.tsx`
Expected: FAIL — `Cannot find module './RingProgress'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/ui/RingProgress.tsx
import type { ReactNode } from 'react';

export function RingProgress({ value, total, size = 40, children }: { value: number; total: number; size?: number; children?: ReactNode }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  const offset = c * (1 - pct);
  return (
    <span className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value} of ${total} done`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      {children && <span className="ring__content" aria-hidden>{children}</span>}
    </span>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/ui/RingProgress.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Add minimal CSS and commit**

Add to `src/ui/` — actually this ring is used only from Home, so put its CSS in `home.css` in Task 2 instead of a new global stylesheet (avoids an extra file for 4 lines of CSS). Skip a standalone CSS file here.

```bash
git add src/ui/RingProgress.tsx src/ui/RingProgress.test.tsx
git commit -m "feat: add RingProgress component for per-roommate completion display

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Roommate row uses rings + warmer empty state + balance chip

**Files:**
- Modify: `src/features/home/Home.tsx:58-67` (mates list), `:81-83` (empty state), `:39-47` (header)
- Modify: `src/features/home/home.css`

**Interfaces:**
- Consumes: `RingProgress` from Task 1 (`src/ui/RingProgress.tsx`); `balanceSentence` from `supabase/functions/_shared/domain/copy.ts` (already imported pattern — confirm via `@domain/copy.ts` alias, same as `Profile.tsx:8`); `state.balance` from `useMe()` (already destructured as `state` on `Home.tsx:24`).
- Produces: no new exports — this task only changes `Home`'s JSX/CSS.

- [ ] **Step 1: Update the mates row to show a ring per roommate**

In `src/features/home/Home.tsx`, replace the `<li className="mate">` block (lines 60-64):

```tsx
<ul className="mates" aria-label="Roommates today">
  {roommates(state, state.today).map((m) => (
    <li key={m.user_id} className="mate" style={{ background: m.color }}>
      <RingProgress value={m.done} total={m.today} size={44}>
        <Avatar name={m.name} color="#ffffffaa" size={36} />
      </RingProgress>
      <strong>{m.user_id === me ? 'You' : m.name}</strong>
      <span>{m.today === 0 ? 'free today' : `${m.done}/${m.today} done`}</span>
    </li>
  ))}
</ul>
```

Add the import near the other `ui` imports (`Home.tsx:8-11`):

```tsx
import { RingProgress } from '../../ui/RingProgress';
```

- [ ] **Step 2: Add a balance chip to the header**

Replace the header block (`Home.tsx:39-47`) to add a compact balance chip next to the bell. Import `balanceSentence` and add state:

```tsx
import { balanceSentence } from '@domain/copy.ts';
```

```tsx
<header className="home__header">
  <div>
    <p className="muted">{greeting()}</p>
    <h1>Hello, {first}.</h1>
  </div>
  <div className="home__header-actions">
    <Link to="/profile" className="balance-chip" title={balanceSentence(state.balance)}>
      {state.balance === 0 ? 'All square' : state.balance > 0 ? `+${state.balance} pts next week` : `${Math.abs(state.balance)} pts ahead`}
    </Link>
    <Link to="/activity" className="icon-btn home__bell" aria-label={unread ? `Activity, ${unread} new` : 'Activity'}>
      <Bell size={20} aria-hidden />{unread > 0 && <span className="dot" aria-hidden />}
    </Link>
  </div>
</header>
```

- [ ] **Step 3: Warm up the empty state copy**

In `Home.tsx:81-83`:

```tsx
{tasks.length === 0 ? (
  <EmptyState title="No tasks today 🎉" body="Check back tomorrow." />
) : tasks.map((a) => {
```

- [ ] **Step 4: Add CSS**

Append to `src/features/home/home.css`:

```css
.ring { position: relative; display: inline-grid; place-items: center; color: #ffffffcc; }
.ring svg { position: absolute; inset: 0; }
.ring__content { display: grid; place-items: center; }
.home__header-actions { display: flex; align-items: center; gap: 10px; }
.balance-chip { font: 600 12px/1 var(--font-ui); padding: 7px 12px; border-radius: 999px; background: var(--lav); color: var(--lav-ink); text-decoration: none; white-space: nowrap; }
```

- [ ] **Step 5: Manually verify no crash with zero tasks and run existing suite**

Run: `npm run test`
Expected: PASS — no existing Home test should break (there isn't a dedicated `Home.test.tsx` currently; this step is a safety net against breaking other suites that import `Home`, e.g. router tests).

- [ ] **Step 6: Commit**

```bash
git add src/features/home/Home.tsx src/features/home/home.css
git commit -m "feat: show per-roommate completion rings and a balance chip on Home

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Streak goal (localStorage) + goal progress on the streak card

**Files:**
- Create: `src/lib/streakGoal.ts`
- Test: `src/lib/streakGoal.test.ts`
- Modify: `src/features/home/Home.tsx:49-56` (streak section)
- Modify: `src/features/home/home.css`

**Interfaces:**
- Produces: `getStreakGoal(): number | null`, `setStreakGoal(days: number): void`, `clearStreakGoal(): void` from `src/lib/streakGoal.ts`. Key used: `'roomie:streak-goal'`.
- Consumes: `Sheet` (`src/ui/Sheet.tsx`), `Button` (`src/ui/Button.tsx`), `state.streak` (`Home.tsx:34`).

- [ ] **Step 1: Write the failing test for storage helpers**

```ts
// src/lib/streakGoal.test.ts
import { afterEach, expect, test, vi } from 'vitest';
import { clearStreakGoal, getStreakGoal, setStreakGoal } from './streakGoal';

afterEach(() => { clearStreakGoal(); vi.restoreAllMocks(); });

test('returns null when no goal is set', () => {
  expect(getStreakGoal()).toBeNull();
});

test('round-trips a goal through storage', () => {
  setStreakGoal(7);
  expect(getStreakGoal()).toBe(7);
});

test('returns null instead of throwing when storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(getStreakGoal()).toBeNull();
});

test('setStreakGoal does not throw when storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(() => setStreakGoal(5)).not.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/streakGoal.test.ts`
Expected: FAIL — `Cannot find module './streakGoal'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/streakGoal.ts
const KEY = 'roomie:streak-goal';

export function getStreakGoal(): number | null {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function setStreakGoal(days: number): void {
  try { localStorage.setItem(KEY, String(days)); } catch { /* storage unavailable — goal just won't persist */ }
}

export function clearStreakGoal(): void {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/streakGoal.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Wire goal UI into the streak card**

In `Home.tsx`, add imports:

```tsx
import { useState } from 'react'; // already imported — just add to the existing destructure if needed
import { getStreakGoal, setStreakGoal } from '../../lib/streakGoal';
import { Sheet } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
```

Add local state near the top of `Home()` (after `const streak = ...` on line 34):

```tsx
const [goal, setGoalState] = useState(() => getStreakGoal());
const [settingGoal, setSettingGoal] = useState(false);
```

Replace the streak section (`Home.tsx:49-56`):

```tsx
<section className="streak" aria-label="Household streak">
  <div>
    <p className="streak__label">Clean streak</p>
    <p className="streak__value"><span className="streak__num">{streak}</span> <span>day{streak === 1 ? '' : 's'} in a row</span></p>
    <p className="streak__sub">{streak > 0 ? 'Kept together, by everyone.' : 'Finish today together to start one.'}</p>
    {goal ? (
      streak >= goal
        ? <p className="streak__goal">🏆 Goal reached — {goal} days!</p>
        : <p className="streak__goal">{goal - streak} day{goal - streak === 1 ? '' : 's'} to your {goal}-day goal</p>
    ) : (
      <button type="button" className="streak__goal-link" onClick={() => setSettingGoal(true)}>Set a streak goal</button>
    )}
  </div>
  <StreakPlant streak={streak} />
</section>

<Sheet open={settingGoal} onClose={() => setSettingGoal(false)} title="Set a streak goal">
  <p className="muted">Commit to keeping the house clean together for a stretch.</p>
  <div className="sheet-actions">
    {[3, 5, 7].map((d) => (
      <Button key={d} variant="secondary" onClick={() => { setStreakGoal(d); setGoalState(d); setSettingGoal(false); }}>{d} days</Button>
    ))}
  </div>
</Sheet>
```

- [ ] **Step 6: Add CSS**

Append to `src/features/home/home.css`:

```css
.streak__goal { font-size: 13px; opacity: .85; margin-top: 6px; font-weight: 700; }
.streak__goal-link { margin-top: 6px; font: 700 13px/1 var(--font-ui); background: none; border: none; padding: 0; color: inherit; text-decoration: underline; cursor: pointer; }
```

- [ ] **Step 7: Run full test suite**

Run: `npm run test`
Expected: PASS — all existing + new tests green.

- [ ] **Step 8: Commit**

```bash
git add src/lib/streakGoal.ts src/lib/streakGoal.test.ts src/features/home/Home.tsx src/features/home/home.css
git commit -m "feat: add a settable streak goal with progress shown on Home

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Duolingo-style completion summary in `Celebration`

**Files:**
- Modify: `src/features/chores/useChoreActions.ts:10-50`
- Modify: `src/features/chores/Celebration.tsx`
- Test: `src/features/chores/Celebration.test.tsx` (new)

**Interfaces:**
- Consumes: `myTasksOn` (already imported in `useChoreActions.ts:4`), `AppState`/`Assignment` types.
- Produces: `useChoreActions()` now returns `celebration: { kind: 'all_done' | 'covered'; streak: number; doneToday: number } | null` instead of the bare `kind` string — **this changes the shape consumed by `Home.tsx:108`** (`<Celebration kind={celebration} onClose={closeCelebration} />`), so Home must be updated in the same task.

- [ ] **Step 1: Write the failing test for the richer Celebration props**

```tsx
// src/features/chores/Celebration.test.tsx
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Celebration } from './Celebration';

test('shows streak and tasks-done stats when celebrating all_done', () => {
  render(<Celebration info={{ kind: 'all_done', streak: 4, doneToday: 3 }} onClose={vi.fn()} />);
  expect(screen.getByText('Wonderful job.')).toBeInTheDocument();
  expect(screen.getByText('4')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
});

test('renders nothing when info is null', () => {
  const { container } = render(<Celebration info={null} onClose={vi.fn()} />);
  expect(container).toBeEmptyDOMElement();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/features/chores/Celebration.test.tsx`
Expected: FAIL — `Celebration` doesn't accept an `info` prop yet (current prop is `kind`).

- [ ] **Step 3: Rewrite `Celebration.tsx`**

```tsx
// src/features/chores/Celebration.tsx
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { Sprout } from '../../ui/Sprout';

const COPY = {
  all_done: { title: 'Wonderful job.', body: 'That’s everything for today. The house noticed.' },
  covered: { title: 'Thanks for covering.', body: 'You took one off a roommate’s plate — it evens out next week.' },
};

export type CelebrationInfo = { kind: 'all_done' | 'covered'; streak: number; doneToday: number };

export function Celebration({ info, onClose }: { info: CelebrationInfo | null; onClose: () => void }) {
  if (!info) return null;
  const c = COPY[info.kind];
  return (
    <Sheet open onClose={onClose} title={c.title}>
      <div className="celebrate">
        <div className="celebrate__sprout"><Sprout size={72} grow={1.15} /></div>
        <p>{c.body}</p>
        <div className="celebrate__stats">
          <div className="celebrate__stat"><strong>{info.streak}</strong><span>day streak</span></div>
          <div className="celebrate__stat"><strong>{info.doneToday}</strong><span>done today</span></div>
        </div>
        <Button block onClick={onClose}>Close</Button>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/features/chores/Celebration.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Update `useChoreActions` to compute and pass the new stats**

Replace the `complete` function body and state type in `src/features/chores/useChoreActions.ts`:

```ts
import type { CelebrationInfo } from './Celebration';
// ...
const [celebration, setCelebration] = useState<CelebrationInfo | null>(null);
// ...
const complete = (a: Assignment) => {
  if (a.status === 'done') return;
  buzz();
  const s = qc.getQueryData<AppState>(STATE_KEY);
  const me = s?.profile.id;
  let kind: 'all_done' | 'covered' | null = null;
  if (a.status === 'claimed' && a.claimed_by === me) kind = 'covered';
  else if (s && me) {
    const stillOpen = myTasksOn(s, me, s.today).filter((x) => x.id !== a.id && x.status !== 'done');
    if (a.day === s.today && stillOpen.length === 0) kind = 'all_done';
  }
  const streak = s?.streak?.current ?? 0;
  const doneToday = s && me ? myTasksOn(s, me, s.today).filter((x) => x.status === 'done').length + 1 : 1;
  // celebrate only once the server accepted it; a failure rolls back with a toast and no sheet
  completeAction.mutate({ p_id: a.id }, { onSuccess: () => { if (kind) setCelebration({ kind, streak, doneToday }); } });
};
```

(Return statement at the bottom of the hook is unchanged — `celebration` is now the richer object, same identifier.)

- [ ] **Step 6: Update `Home.tsx` to pass the renamed prop**

In `Home.tsx:108`, the hook usage stays `const { complete, celebration, closeCelebration } = useChoreActions();` (unchanged identifier names), but the JSX prop changes:

```tsx
<Celebration info={celebration} onClose={closeCelebration} />
```

- [ ] **Step 7: Add CSS for the stat row**

Append to the chores feature's CSS (find it first):

Run: `ls src/features/chores/*.css` to confirm the filename, then append:

```css
.celebrate__stats { display: flex; gap: 24px; justify-content: center; margin: 14px 0 20px; }
.celebrate__stat { display: flex; flex-direction: column; align-items: center; }
.celebrate__stat strong { font: 700 28px/1 var(--font-display); }
.celebrate__stat span { font-size: 12px; color: var(--ink-2); margin-top: 2px; }
```

- [ ] **Step 8: Run full test suite**

Run: `npm run test`
Expected: PASS — all existing + new tests green, including `Home.tsx` not breaking from the `Celebration` prop rename.

- [ ] **Step 9: Commit**

```bash
git add src/features/chores/Celebration.tsx src/features/chores/Celebration.test.tsx src/features/chores/useChoreActions.ts src/features/home/Home.tsx src/features/chores/*.css
git commit -m "feat: show streak and daily-completion stats in the completion celebration

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:** All 6 of the 7 originally-suggested improvements from the Mobbin research are covered (rings, empty-state copy, celebration stats, streak-goal commitment, balance chip, per-roommate view via rings on the existing roommate row). The 7th — a full expense quick-add flow (Splitwise/Vipps-style) — was explicitly called out as higher-effort and out of scope for this plan since it needs a new RPC and screen, not a Home tweak; it is NOT included here and should be its own plan if wanted.

**2. Placeholder scan:** No TBD/TODO markers; every step has runnable code.

**3. Type consistency:** `CelebrationInfo` is defined once in `Celebration.tsx` and imported by `useChoreActions.ts` — single source of truth. `RingProgress({ value, total, size, children })` signature is identical between its definition (Task 1) and its two call sites (Task 2). `getStreakGoal`/`setStreakGoal`/`clearStreakGoal` names match between definition and test.

**4. Review Focus coverage:**
- Zero-division ring math → covered by `RingProgress.test.tsx` Step 1 (`total={0}`).
- Single-member household → the roommate row copy (`'free today'` / `'X/Y done'`) doesn't assume plural roommates; no dedicated test added since it's a copy-only concern with no branching logic to break.
- Streak goal already met → covered by the `streak >= goal` branch in Task 3 Step 5; not unit-tested because it's inline JSX in `Home.tsx` with no existing `Home.test.tsx` to extend — flagged here for manual QA when reviewing the branch (open Home with a mock state where `streak > goal` and confirm the trophy message, not a negative number, shows).
- localStorage throwing → covered by `streakGoal.test.ts` Steps for both `getItem` and `setItem` throwing.
- Balance exactly 0 → handled by the ternary in Task 2 Step 2 (`'All square'` branch); not unit-tested since `Home.tsx` has no existing test file — same manual-QA flag as above.
