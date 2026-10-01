# Roomie app — Milestone 1 design

**Date:** 2026-10-01 · **Status:** awaiting review · **Owner:** Pema Ghising

## 1. Intent

Turn the Roomie case study into a real product that actual roommates install and use together.

- **Who:** 2–6 people sharing a flat (students, young professionals in the Kathmandu Valley).
- **Success:** a household can sign up and run a whole week on Roomie — the plan is made for them, chores get done or claimed, and nobody has to remind anybody. Measured against the case-study criteria: setup under 60 seconds; every assignment explainable in one sentence; zero person-to-person reminders; no nudge reads as nagging.
- **Out of scope (Milestone 1):** Pantry (Milestone 2, its own spec), any money/expense feature (Phase 2 per case study), AI optimisation, multiple households per person, dark mode.

### Decisions made with Pema
| Topic | Decision |
|---|---|
| Purpose | Real multi-user app, not a demo |
| Platform | Installable web app (PWA) |
| Milestones | M1 = household + chores + nudges + profile; M2 = pantry |
| Sign-in | Google, email one-time code, phone one-time code (SMS) |
| Weekly plan | Household setting: **review first** (default) or **apply automatically** |
| Missed chores | Go to a claim pool; **private** effort debt balances the next plan |
| Stack | React + TypeScript + Vite PWA, Supabase (Auth, Postgres, Realtime, Edge Functions, Cron), hosted on Vercel |
| Design authority | Pema delegated design decisions to Claude: follow the hi-fi screens, fill gaps with best-in-class patterns |

### Assumptions (Claude)
- One household per person in M1.
- Household timezone fixed per household, default `Asia/Kathmandu`.
- Effort points: Light = 1, Medium = 2, Heavy = 3 (the app's chips; no invented minute data).
- Free tiers for Supabase/Vercel at launch; SMS is the only paid dependency.

## 2. Architecture

```
PWA (React, Vite, TS) ── supabase-js ──► Supabase
  │  TanStack Query (cache + offline persistence)       ├─ Auth: Google OAuth, email OTP, phone OTP (Twilio Verify; Send-SMS hook later)
  │  Realtime subscription per household                 ├─ Postgres + Row-Level Security (household isolation)
  │  Service worker: offline shell + Web Push            ├─ RPC functions (security definer) for every state change
  │                                                       ├─ Edge Functions: plan generator, push sender, SMS hook (later)
  └─ shared/rotation.ts  ◄── same file ──►               └─ pg_cron: Saturday draft, Sunday lock, hourly sweep, 08:00 digest
```

**Units and boundaries**
- `shared/` — pure TypeScript domain logic with no I/O: `rotation.ts` (plan generation), `ledger.ts` (debt maths), `streak.ts`, `copy.ts` (nudge/reason copy in both tones). Imported by the app (previews, optimistic UI) and by Edge Functions (Deno). Fully unit-tested.
- `supabase/migrations/` — schema, RLS policies, RPC functions. All writes go through RPCs so rules live in one place; the client never updates tables directly.
- `supabase/functions/` — `generate-plans`, `send-push`, `sweep` (thin wrappers that load data, call `shared/`, write results).
- `src/` — the app: `features/{auth,onboarding,home,chores,plan,profile}`, `ui/` (design-system components), `lib/` (supabase client, query client, push registration).

## 3. Data model

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | id (= auth user), name, color, nudge_style (`motivate`\|`facts`), created_at | One per user |
| `households` | id, name, invite_code (6 chars, unique), plan_mode (`review`\|`auto`), tz, day_ends_at (default 22:00) | |
| `members` | household_id, user_id, busy_days (int[] 0–6), role (`owner`\|`member`), joined_at, left_at | Max 8 active |
| `chores` | id, household_id, name, icon, effort (1–3), cadence (`daily`\|`weekly`\|`biweekly`), active | |
| `plans` | id, household_id, week_start (date, Monday), status (`draft`\|`locked`), generated_at, lock_at | Unique (household, week) |
| `plan_approvals` | plan_id, user_id, approved_at | Review mode only |
| `assignments` | id, plan_id, chore_id, user_id, day (date), effort, status (`todo`\|`done`\|`missed`\|`claimed`\|`expired`), claimed_by, done_at, reason | `reason` = the one-sentence explanation |
| `swap_requests` | id, from_assignment, to_assignment, status (`pending`\|`accepted`\|`declined`), created_at | |
| `effort_ledger` | household_id, user_id, balance (int; + owes, − credited), updated_at | **RLS: only the row's user can read it** |
| `streaks` | household_id, current, best, last_kept_day | Household-wide, never per person |
| `push_subscriptions` | user_id, endpoint, keys, created_at | One per device |
| `activity` | id, household_id, kind, actor, payload (jsonb), created_at | In-app feed + push source |

**Security (RLS):** every household-scoped table is readable/writable only by active members of that household (`is_member(household_id)` helper). `effort_ledger` adds `user_id = auth.uid()` for reads. Joining uses `join_household(code)` RPC (security definer, rate-limited, rejects full or unknown codes). Owners can rotate the invite code and remove members.

## 4. Core logic

### 4.1 Weekly plan generation (`shared/rotation.ts`, pure, deterministic)
**Input:** active members (busy days, last 4 weeks' assignment history), active chores, each member's ledger balance, week start, seed (`household_id + week_start`).

1. **Expand** chores into instances for the week: daily → 7, weekly → 1, biweekly → 1 on alternate weeks (parity of ISO week number since chore creation).
2. **Targets:** total points ÷ members = fair share; each member's target = fair share + ledger balance (clamped to ±3 points/week so debt is repaid gradually, never punishingly).
3. **Assign heaviest first.** For each instance pick the member minimising `(assigned − target)` subject to:
   - **Hard:** never a Heavy instance on someone's busy day (if every member is busy that day, move the instance to the nearest non-busy day; if impossible, flag it and still assign to the lowest-loaded member with reason "Everyone's busy Wednesday — swapped in your lightest week").
   - **Soft (penalties):** Medium on a busy day; same person did this chore last week; more than one Heavy per person per day.
4. **Place weekly instances** on the day with the lowest household load that satisfies the assignee's constraints.
5. **Write a reason** for each assignment from the dominant factor: `"Heavy task moved off your busy Wednesday"`, `"Your turn — Priya did it last week"`, `"Evens out effort: you're at 6 of 7 points"`, `"One extra Light task — Aman covered the bathroom on Tuesday"`.
6. **Output:** assignments + per-member point totals + unsatisfiable flags. Same input ⇒ same output.

**Properties enforced by tests:** no Heavy on a busy day when any alternative exists; each member's total within 1 point of target when the chore set allows; ledger balance changes the next week's totals in the right direction; deterministic; handles 1–8 members, 0–40 chores.

### 4.2 Plan lifecycle (pg_cron + Edge Function)
- **Saturday 18:00 (household tz):** generate next week's plan.
  - `review` mode → status `draft`, push "Next week's plan is ready — take a look". Members can **Approve** or **Request a swap**. Locks when everyone approves or Sunday 18:00, whichever first.
  - `auto` mode → status `locked` immediately, push "Your week is planned".
- **Swaps:** exchange two assignments between two members; recipient accepts/declines. If efforts differ, the difference moves to the ledger so fairness holds ("+1 point for you"). Swaps allowed on draft and locked plans for future days.
- **Mid-week changes:** a new chore is assigned for the rest of the week using the same algorithm on remaining days; a new member joins from next week's plan; a leaving member's future assignments go to the claim pool; busy-day edits apply from the next plan (UI says so).
- **First week:** a household created mid-week gets an immediate plan for the remaining days.

### 4.3 Missed, claimed, ledger, streak
- **Sweep (hourly):** when a household's local time passes `day_ends_at`, that day's `todo` assignments become `missed` → appear in **Missed by roommates** for everyone except the owner; push "Up for grabs: Mop bathroom floor" (once per batch).
- **Claim** (`claim_assignment` RPC, row-locked; first claim wins, others see "Priya already grabbed this"): status `claimed`, `claimed_by` set. Claimer completes it → `done`. Ledger: missed person `+effort`, claimer `−effort`. Missed person gets a private push in their tone: "Aman covered the bathroom — you'll get one extra Light task next week."
- **Expiry:** unclaimed missed items expire 24 h after the day ended → status `expired`, ledger `+effort` for the missed person only.
- **Streak (household):** a day is *kept* when all its assignments are `done` (by anyone) by the time its pool closes. Kept ⇒ `current + 1`; any `expired` item ⇒ `current = 0`. `best` tracked. Shown as the sprout on Home; no per-person numbers anywhere.

### 4.4 Nudges (Web Push + in-app activity)
| Trigger | Motivate me | Just the facts |
|---|---|---|
| 08:00 digest (if tasks today) | "🌱 Morning! 2 tasks today — the bathroom's waiting for a quick wipe down." | "Today: Bathroom wipe-down, Take out trash." |
| Item enters claim pool | "🙌 Up for grabs: Mop bathroom floor. Be a hero?" | "Unclaimed: Mop bathroom floor." |
| Plan draft ready | "📋 Next week's plan is ready — 30 seconds to check it." | "Next week's plan is ready for review." |
| Someone claimed your missed chore | "Aman covered the bathroom. You'll get one extra Light task next week." | "Aman covered Bathroom. +1 Light task next week." |
| Day kept | "✨ House peace secured — 4-day streak!" | "Streak: 4 days." |

Rules: quiet hours 22:00–07:00 (queued to 07:00); max 3 pushes/person/day except claim results; every push also lands in the in-app Activity feed, so users without push (desktop Safari, EU iOS, permission denied) miss nothing.

## 5. Experience

Visual system = the hi-fi screens: Playfair Display headlines, Inter UI, lavender primary `#B9A2FF`/`#5C3B9B`, effort chips (Light mint, Medium butter, Heavy peach), one pastel per roommate, floating dark tab bar, sprout motif. Copy uses the case study's tone ("a flatmate who's on your side").

### 5.1 Screens (★ = not in the hi-fi set, added to complete the flow)
**Auth & onboarding (target < 60 s):**
1. Welcome — value line + "Continue with Google / email / phone".
2. ★ Email or phone entry → ★ 6-digit code screen (auto-advance, paste-friendly, resend timer).
3. Your name + pick a pastel.
4. Create a home **or** ★ Join with code (6 boxes, paste support, invite link `<app-url>/j/ABC123` pre-fills).
5. (Create) Name your home → Suggested chores (5 suggested, basics pre-selected, effort chip editable) → Busy days → Invite (code, share sheet with WhatsApp first, copy link).
6. (Join) Busy days → straight to Home with a welcome toast from the household.
7. ★ Install & notifications primer — shown once on Home: on iOS a 3-step "Share → Add to Home Screen" guide (push needs it), elsewhere a one-tap install; then a pre-permission screen explaining *why* ("so the app can do the reminding, not your roommates") before the browser prompt.

**Tabs (M1: Home · Chores · Profile; Pantry tab arrives with M2):**
- **Home** — greeting, household streak card with sprout, roommate cards (pastel, tasks today), Today's tasks, "Next up" card, ★ Activity entry (bell) with unread dot.
- **Chores** — segmented: **Today** / **This week** / **All chores**.
  - My tasks with effort chips; tap the circle **or swipe right** to complete; 5-second **Undo** snackbar.
  - ★ "Why me?" — tap any task for a bottom sheet with its reason and the household's point totals for the week.
  - **Missed by roommates** with Claim; claimed items move into My tasks.
  - **Plan** banner when a draft is pending → ★ Plan review screen (each person's week, totals, Approve, Request swap) → ★ Swap sheet (pick a task of theirs, see effort difference, send).
  - FAB **+** → Add chore sheet (effort first, icon, cadence, assign-to "Rotation" by default).
- **Celebration** — after completing: "Wonderful job. +1 day streak" card with the sprout growing; after claiming a roommate's chore: "Thanks for covering — the house noticed."
- **Profile** — name/colour, busy days, nudge style, ★ private "Your balance" card (plain-sentence explanation, never a rank), roommates (invite, owner can remove), ★ household settings (plan mode, day ends at, rename, rotate invite code), notifications per device, sign out, ★ leave household.
- ★ **Activity** — chronological feed (completed, claimed, plan ready, joined), mirrors pushes.
- ★ **States** — skeletons on first load, empty states with the sprout ("No tasks today. Enjoy it."), offline banner ("You're offline — changes will sync"), error toasts with retry.

### 5.2 Patterns borrowed from best-in-class apps
- **Things 3 / Todoist:** swipe-to-complete with satisfying check animation, Undo instead of confirm dialogs.
- **Splitwise:** every balance explained in words, never a bare number.
- **Duolingo:** streak as warm progress, framed as the *household's*, never a leaderboard (case-study principle).
- **Apple onboarding / Headspace:** one question per screen, progress bar, permission primers before system prompts.
- **Linear / WhatsApp:** optimistic UI — taps feel instant, sync happens behind.

### 5.3 Quality bar
- Optimistic mutations with rollback; offline queue via TanStack Query persistence (IndexedDB).
- Realtime: one channel per household; completion/claim appears on roommates' phones within ~1 s.
- Accessibility: 44 px targets, AA contrast (lavender text checked against backgrounds), visible focus, screen-reader labels on chips and swipe actions, `prefers-reduced-motion` honoured.
- Performance: Lighthouse PWA installable, ≥ 90 performance on mid-range Android; route-level code splitting.
- Haptics: `navigator.vibrate` tick on complete/claim (Android).

## 6. Error handling
- Every RPC returns typed errors (`not_member`, `already_claimed`, `plan_locked`, `household_full`, `invalid_code`, `rate_limited`) mapped to human copy in `copy.ts`.
- Claim races resolved server-side with row locks; the loser's optimistic update rolls back with a friendly toast.
- Plan generation failure → retried by the next cron tick; household sees last week's chores as "unplanned" tasks rather than nothing; logged to the `activity` table with kind `system_error` (owner-only visibility).
- Push failures: 404/410 endpoints deleted; others retried once.
- Auth: expired session refreshes silently; OTP throttling surfaced as "Try again in 30 s".

## 7. Testing
- **Unit (Vitest):** `rotation`, `ledger`, `streak`, `copy` — property-style tests for the guarantees in §4.1 plus fixed scenarios from the case study (3 roommates, busy Mon/Wed/Fri, 5 suggested chores).
- **Database:** SQL tests for RLS (non-members see nothing; ledger readable only by owner; claim race) run against a Supabase dev project.
- **End-to-end (Playwright):** two browser contexts as two roommates — create home → join by code → complete → miss → claim → ledger/streak outcomes; mobile viewport.
- **Manual device check:** iPhone (installed PWA push) and Android Chrome before each release.

## 8. Accounts Pema needs to create (before implementation)
1. Supabase project (free).
2. Google Cloud OAuth client (free) for Google sign-in.
3. Twilio account with Verify (paid per SMS) — can be added last; email and Google work without it.
4. Vercel account (free) linked to the repo.
5. A domain is optional (Vercel subdomain works).

## 9. Risks
| Risk | Mitigation |
|---|---|
| iOS push requires install; many users won't install | Install primer + in-app Activity feed so nothing depends on push |
| Google sign-in redirect behaviour inside an installed iOS app | Test early; email/phone codes always work in-app as fallback |
| Effort debt still feels judgmental | Private by design; copy reviewed against "how would you feel if your roommate saw this?"; ledger clamp ±3/week |
| SMS cost in Nepal | Twilio first; Send-SMS hook allows a local gateway later without app changes |
| Algorithm edge cases (everyone busy, one member) | Explicit fallbacks + property tests |
