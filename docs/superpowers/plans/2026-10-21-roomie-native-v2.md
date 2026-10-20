# Roomie Native v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the look and motion of the working Expo app in `native/` so it matches Final app v2 screen for screen, then run it on Pema's iPhone via Expo Go against a fresh, seeded dev database.

**Architecture:** Keep the routes, the data layer (`src/lib/state.ts`, `actions.ts`, RPCs) and the domain logic. Add a single token module, a motion module and a `src/ui/v2/` component library that mirrors the Figma library. Then re-compose every screen from those components, phase by phase, and check each phase against Figma screenshots before Pema reviews it.

**Tech Stack:** Expo SDK 57, expo-router, React Native 0.86, Reanimated 4, gesture-handler, expo-blur, expo-camera, expo-notifications (local), expo-haptics, supabase-js, React Query, vitest (run from the repo root).

**Spec:** `docs/superpowers/specs/2026-10-21-roomie-native-v2-design.md`

## Global Constraints

- **Colour:**
  - Never `#FFFFFF`: surfaces are `#FCFBFF` (`bg/surface`) and the canvas is `#F8F6FC` (`bg/canvas`).
  - No all-caps text and no `textTransform: 'uppercase'`. Sentence case everywhere.
  - Never show points or scores. Balance copy is only "On track" or "Catching up".
- **Locked features, unchanged in behaviour:**
  - effort Light / Medium / Heavy
  - busy days
  - shared pool
  - nudge style "Motivate me" / "Just the facts"
  - pantry tags "Do not touch" / "Ask first"
  - restock requests
- **Weeks start on Sunday:** weekday 0 = Sunday, everywhere in UI and logic.
- **Fonts:** titles use Fraunces 72pt Soft (SemiBold, SemiBold Italic). All other text uses Geist (Light 300, Regular 400, Medium 500, SemiBold 600). Every text style comes from `tokens.type`.
- **Expo Go only:** no dependency outside the Expo Go SDK 57 bundle. Check each new dependency with `npx expo install --check` before adding it.
- **Motion:** no animation on a repeated path runs longer than 450 ms. With Reduce Motion on, every preset becomes an opacity fade of 200 ms or less.
- **Secrets:** never print any part of a secret. Read `.env.local` values only with `grep '^KEY=' .env.local | cut -d= -f2- | tr -d '\r'`. Run network CLIs with `NODE_EXTRA_CA_CERTS` set to the Cloudflare gateway root cert in the session scratchpad.
- **Visual source of truth:** Figma file `54WDfpLvnPKcWRnswVdOSd`, page `834:4432`. Each screen task names its frame.
- **Commits:** in the `roomie-app` repo, on branch `feat/native-v2`. No co-author lines and no mention of AI tools in commits or code.
- **Ledger:** update `native/PROGRESS.md` at the end of every task with what was done, what's next, and any blockers.

## Review Focus

1. **Wrong, expired or rate-limited email code.** Show the 05b message ("Hmm, wrong code."), keep "Send a new one" disabled for 30 s after sending, and give a friendly line when the code is rate-limited. Tested in Task 6.
2. **Midnight on Saturday to Sunday in Kathmandu.** The week rolls over at local midnight, not UTC. `weekStartOf(localToday(...))` changes between 23:59 Saturday and 00:01 Sunday Asia/Kathmandu. Tested in Task 4.
3. **Long user content** (a 30-character home name, a 40-character item name, 4+ roommates) never overflows or overlaps at 375 pt width. It truncates with an ellipsis. Tested in Task 5 on the kit route.
4. **A failed write while offline or on a server error.** The optimistic change rolls back and a snackbar explains it. Tested in Task 4 (`useAction` rollback).
5. **Reduce Motion on.** No translate, scale or confetti, only fades. Tested in Task 4.

---

### Task 1: Project identity, build config, cleanup, ledger

**Files:**
- Create: `native/eas.json`, `native/PROGRESS.md`, `native/assets/brand/app-icon.png`, `native/assets/brand/splash.png`
- Modify: `native/app.json`, `native/package.json`
- Delete:
  - `native/migration-progress.md`, `native/src/components/` (template only), `native/src/hooks/use-theme.ts`, `native/global.css`
  - the template assets `react-logo*`, `expo-badge*`, `expo-logo.png`, `tabIcons/`, `tutorial-web*`
  - `native/scripts/reset-project.js`

**Interfaces:**
- Produces: bundle id / package `com.pemaghising.roomie`; EAS profiles `development`, `preview` (Android `buildType: "apk"`, iOS internal), `production`.

- [ ] Step 1: Create branch `feat/native-v2` from `feat/m1`.
- [ ] Step 2: Export the app icon (brand guidelines frame "16 · App icon") and the splash mark from Figma at 1024 px into `assets/brand/`. Point `app.json` `icon`, `ios.icon`, `android.adaptiveIcon` and `splash` at them. Set `ios.bundleIdentifier`, `android.package`, `ios.supportsTablet: false`, `userInterfaceStyle: "light"`, and splash background `#F8F6FC`.
- [ ] Step 3: Write `eas.json` with the three profiles. Add `"test": "vitest run --config vitest.config.ts"` to the scripts.
- [ ] Step 4: Delete the template files. Run `npx tsc --noEmit`, expect 0 errors, and fix any imports of the deleted files.
- [ ] Step 5: Run `npx expo-doctor`. Expected: no failing checks, or only warnings recorded in PROGRESS.md.
- [ ] Step 6: Write `PROGRESS.md`: one table of all tasks with a status column, and a "Resume here" line. Commit `chore(native): app identity, EAS profiles, remove template code`.

### Task 2: Reset roomie-dev and seed a demo household

**Files:**
- Create: `supabase/seed/demo.ts` (pure builder), `supabase/seed/demo.test.ts`, `scripts/seed-demo.ts` (applies it with the service key), `supabase/migrations/<next>_pantry_icons.sql`

**Interfaces:**
- Produces:
  - `buildDemoHousehold(today: string, ownerEmail: string): DemoSeed`, with `DemoSeed = { household: {name: string; tz: 'Asia/Kathmandu'}; members: {name: string; email: string; busyDays: Weekday[]}[]; chores: {name: string; icon: string; effort: 1|2|3; cadence: 'daily'|'weekly'|'biweekly'}[]; pantry: {name: string; icon: string; shared: boolean; tag?: 'do_not_touch'|'ask_first'; status: 'in_stock'|'low'|'out'}[]; streakDays: number }`.
  - The migration adds `pantry_items.icon text`. `add_item` and `update_item` accept `p_icon text default null`, and `get_state` returns `icon`.

- [ ] Step 1: Confirm `native/.env` `EXPO_PUBLIC_SUPABASE_URL` points at the same project ref as `.env.local` `SUPABASE_TEST_URL`. Compare the hostnames only and never print the keys.
- [ ] Step 2: Write the failing tests in `demo.test.ts`.
  - `buildDemoHousehold('2026-10-17','pema@x.com')` has 3 members: Ramesh (owner email), Priya and Aman.
  - Busy days are Ramesh [2,3,5] (Tue, Wed, Fri, Sunday-first), Priya [1,4] and Aman [6].
  - Every chore effort is in {1,2,3} and at least one of each appears.
  - `streakDays === 23`.
  - Pantry includes Milk with status `out`, Rice with status `low`, and one item tagged `do_not_touch` (Protein shake, not shared).
- [ ] Step 3: Run `npx vitest run supabase/seed/demo.test.ts` from the roomie-app root. Expected: FAIL (module missing).
- [ ] Step 4: Implement `buildDemoHousehold` with the names, icons (3D emoji names from the icon library) and statuses the Figma frames use.
- [ ] Step 5: Run the test. Expected: PASS.
- [ ] Step 6: Write the `pantry_icons` migration. Then reset the project:
  1. `npx supabase link --project-ref <ref>`
  2. `npx supabase db reset --linked` (approved by Pema; destroys all data)
  3. `npx supabase functions deploy tick`
  4. Set the email OTP template to send a 6-digit code (Auth > Email templates via the Management API, using `SUPABASE_ACCESS_TOKEN`).
  5. Re-create the scheduled tick job if the migrations don't create it.
- [ ] Step 7: Implement `scripts/seed-demo.ts <ownerEmail>`. It creates the auth users through the admin API and inserts the seed through the existing RPCs or service-role inserts. Run it with Pema's email. Verify by signing in on Expo web and checking that Home shows "23 days strong".
- [ ] Step 8: Run all domain tests: `npx vitest run --exclude 'tests/db/**'`. Expected: all pass. Commit.

### Task 3: Tokens and fonts

**Files:**
- Create: `native/src/ui/tokens.ts`, `native/src/ui/tokens.test.ts`, `native/scripts/make-fraunces.py`, `native/assets/fonts/Fraunces72Soft-SemiBold.ttf`, `native/assets/fonts/Fraunces72Soft-SemiBoldItalic.ttf`
- Modify: `native/src/app/_layout.tsx` (font loading), `native/src/constants/theme.ts` (reduce it to a re-export of `tokens` and remove `Brand`/`Colors`)

**Interfaces:**
- Produces:
  - `color` holds the 34 semantic names, camel-cased by group: `color.bg.canvas`, `color.text.primary`, `color.action.primary`, `color.effort.lightBg` and so on. Each value equals the Figma `v2 · Color` value.
  - `space` = `{4:4, 8:8, 10:10, 12:12, 16:16, 20:20, 24:24, 32:32}`.
  - `radius` = `{tile:11, chip:18, card:24, field:26, sheet:32, full:999}`.
  - `type` holds the 16 styles keyed by Figma name (`'Title/Page'`, …, `'Numeral/Streak'`). Each is `{fontFamily, fontSize, lineHeight, letterSpacing?}`.
  - `elevation` = `{glass, liftButton, liftSmall, sheet}` as RN shadow props.

- [ ] Step 1: Write the failing tests.
  - `color.bg.surface === '#FCFBFF'`.
  - `color.action.primary === '#7A5FD6'`.
  - `color.effort.heavyFg === '#B23E1E'`.
  - `type['Title/Page']` is `{fontSize:34, lineHeight:41}` with the Fraunces family.
  - `type['Numeral/Streak'].fontSize === 96`.
  - No value anywhere in `color` equals `'#FFFFFF'` (case-insensitive), checked with a deep walk.
- [ ] Step 2: Run `npm test -- tokens`. Expected: FAIL.
- [ ] Step 3: Implement `tokens.ts` from the values in the spec's Figma variables. Write `make-fraunces.py`: fontTools `instancer` on the Google Fonts `Fraunces[SOFT,WONK,opsz,wght].ttf` with opsz=72, SOFT=100, WONK=0, wght=600, for roman and italic. Add `@expo-google-fonts/geist` (300/400/500/600) and load all of them in `_layout.tsx` before hiding the splash.
- [ ] Step 4: Run the tests. Expected: PASS. `npx tsc --noEmit` is clean. Commit.

### Task 4: Motion, haptics, and the Review Focus logic tests

**Files:**
- Create: `native/src/ui/motion.ts`, `native/src/ui/haptics.ts`, `native/src/ui/motion.test.ts`, `native/src/lib/time.test.ts`
- Modify:
  - `native/src/lib/state.ts`: `localToday` takes the household tz, defaulting to 'Asia/Kathmandu'.
  - Export the `useAction` rollback helper as a pure function `applyOptimistic` / `rollback` so it can be tested.

**Interfaces:**
- Produces:
  - `motion.press = {scale: 0.97, spring: {damping: 18, stiffness: 320}}`
  - `enter(i: number, reduced: boolean)`: returns a Reanimated entering animation. Fade plus 12 px rise over 260 ms with `delay = Math.min(i, 8) * 40`. When reduced, `FadeIn.duration(180)` with no delay.
  - `motion.sheet = {damping: 22, stiffness: 260}`
  - `celebrate(reduced)`
  - `haptic.complete()` (impact Light), `haptic.allDone()` (notification Success), `haptic.select()` (selection)
  - `stagger(i) = Math.min(i,8)*40`

- [ ] Step 1: Write the failing tests.
  - `stagger(0)===0`, `stagger(3)===120`, `stagger(20)===320`.
  - Every duration in `motion.durations` is ≤ 450.
  - `enter(5, true)` has no translate and a delay of 0. Assert on the config object that `enterConfig(i, reduced)` returns.
  - `localToday(new Date('2026-10-17T18:14:00Z'),'Asia/Kathmandu') === '2026-10-17'` (Saturday 23:59). `localToday(new Date('2026-10-17T18:16:00Z'),'Asia/Kathmandu') === '2026-10-18'` (Sunday 00:01). Their `weekStartOf` values differ: '2026-10-11' then '2026-10-18'.
  - A rollback test: `rollback(applyOptimistic(state, action), snapshot)` deep-equals the original `state`.
- [ ] Step 2: Run them. Expected: FAIL.
- [ ] Step 3: Implement `motion.ts` (with the `enterConfig` pure helper used by `enter`), `haptics.ts`, the tz parameter, and the exported rollback helpers.
- [ ] Step 4: Run them. Expected: PASS. Commit.

### Task 5: v2 component library and kit route

**Files:**
- Create: `native/src/ui/v2/` with one file per Figma component: `Button`, `BackButton`, `TextField`, `CodeInput`, `Tag` (effort / status / boundary kinds), `Check`, `EmojiBadge`, `SegmentedControl`, `ViewSwitch`, `StepBar`, `DayPicker`, `Chip`, `Toggle`, `TaskRow` (todo / done / mine), `PoolRow`, `PoolBanner`, `ReasonRow`, `UpcomingCard`, `ItemCard`, `ShelfTile`, `SectionHeader`, `Heading`, `GreetingHeader`, `StreakCard` (on track / drooped, `days: number`, `week: DayState[7]`), `Avatar`, `IconButton`, `AddButton`, `Nav`, `Snackbar`, `BottomSheet`, `SettingsRow` (default / danger), `NudgeCard`, `ChoreOption`, `GlassCard`
- Create: `native/src/ui/v2/index.ts`, `native/src/app/_kit.tsx` (dev-only route, hidden from the tabs), `native/scripts/compare.mjs`

**Interfaces:**
- Consumes: `tokens`, `motion`, `haptic`.
- Produces: the components above. Props are named after the Figma variant properties (e.g. `<Button kind="primary|secondary|destructive">`, `<Tag kind="light|medium|heavy|inPool|out|low|doNotTouch|askFirst">`, `<TaskRow state="todo|done|mine">`). Every pressable uses `motion.press` and reaches at least 44 pt.

- [ ] Step 1: Write `compare.mjs`.
  - It takes `--route /_kit --figma <nodeId> --out <png>`.
  - It runs `npx expo export --platform web` once, serves `dist/`, and captures the route with Playwright at 393×852 @2x.
  - It downloads the Figma node screenshot and writes a side-by-side PNG.
- [ ] Step 2: Build the components. Glass surfaces use expo-blur `BlurView` (intensity 40, tint light) plus `color.bg.glass` and a `border.hairline` stroke.
- [ ] Step 3: The kit route renders every component and variant, plus long-content cases: a 30-character home name in `GreetingHeader`, a 40-character item in `ItemCard`, and 5 avatars. Run compare against Figma nodes `1160:445` and `1014:2800`. Expected: the side-by-side shows matching sizes, colours and type, and no overflow at 375 width (also run with `--width 375`).
- [ ] Step 4: Run `npx tsc --noEmit` and `npm test`. Expected: clean, all pass. Commit.

### Task 6: Auth and onboarding (frames 01–13, 05b, J1–J4)

**Files:**
- Modify: `native/src/app/auth/*.tsx`, `native/src/app/onboarding/*.tsx`, `native/src/app/j/[code].tsx`
- Create: `native/src/app/onboarding/scan.tsx` (J2, expo-camera barcode QR), `native/src/lib/otp.ts`, `native/src/lib/otp.test.ts`

**Interfaces:**
- Produces:
  - `otpMessage(error: unknown): string`. A wrong or expired code gives "Hmm, wrong code." A rate limit gives "Too many tries. Wait a minute, then send a new one."
  - `resendCooldown(lastSentAt: number, now: number): number`, the seconds remaining, from 30 down to 0.

- [ ] Step 1: Write the failing tests for `otpMessage` (wrong, expired and rate-limit Supabase error shapes) and `resendCooldown` (0 s after → 30, 31 s after → 0).
- [ ] Step 2: Run them. Expected: FAIL. Implement, run again. Expected: PASS.
- [ ] Step 3: Rebuild each screen from v2 components to its frame:
  - 01 `834:4433`, 02 `835:4432`, 03 `835:4483` (sheet over Welcome), 04 `835:4534`, 05 `835:4564`, 05b `835:4601`, 06 `835:4640`
  - 07–13 `836:4432`…`836:4777`
  - J1–J4 `836:4857`, `836:4900`, `836:4924`, `836:4970`
  - Apple and Google buttons show a "Coming soon" snackbar.
  - J2 asks for camera permission and handles a declined permission with a "Enter the code instead" link.
- [ ] Step 4: Run compare for every frame. Expected: side-by-sides match. Commit.
- [ ] Step 5: **Phase review.** Start `npx expo start --tunnel`. Send Pema the side-by-side sheet and the Expo Go QR code, and wait for her go-ahead before Task 7.

### Task 7: Home (H0–H8, W0–W5) and nudges

**Files:**
- Modify: `native/src/app/(tabs)/index.tsx`, `native/src/app/why.tsx`, `native/src/ui/tab-bar.tsx` → use `v2/Nav`
- Create: `native/src/app/add-menu.tsx` (H8 sheet), `native/src/lib/nudges.ts`, `native/src/lib/nudges.test.ts`

**Interfaces:**
- Produces: `planNudges(assignments: Assignment[], member: Member, today: string, style: 'motivate'|'facts'): {title: string; body: string; at: Date}[]`. It returns one nudge per due chore, at the member's reminder time, and never on a busy day for a Heavy chore. The copy follows the nudge style: Motivate includes the streak and an emoji, Facts is text only. Scheduling goes through `expo-notifications` `scheduleNotificationAsync`.

- [ ] Step 1: Write the failing tests for `planNudges`.
  - The copy differs by style; the facts copy has no emoji (regex `/\p{Extended_Pictographic}/u` fails to match).
  - Nothing is scheduled for done chores.
  - The count equals the number of due chores.
- [ ] Step 2: Implement, run the tests, and confirm they pass.
- [ ] Step 3: Rebuild Home and its states to frames H0 `950:2217`, H1 `912:2195`, H2 `966:1854` (the "Why these?" link opens the sheet over a blurred scrim), H3–H7 and H8 `963:1811`.
  - The all-done state hides the pool banner (H6 `950:2986`).
  - The streak card uses Sunday-first pills, and the plant stage comes from milestones 3/7/14/30.
  - The W-frames become in-app states with local notifications.
- [ ] Step 4: Run compare for each frame. Expected: match. Commit. **Phase review** with Pema.

### Task 8: Chores and calendar (C1–C4)

**Files:**
- Modify: `native/src/app/(tabs)/chores.tsx`, `native/src/ui/calendar.tsx`, `native/src/ui/week-strip.tsx`, `native/src/app/add-chore.tsx`
- Create: `native/src/lib/month-grid.ts`, `native/src/lib/month-grid.test.ts`

**Interfaces:**
- Produces: `monthGrid(year: number, month1to12: number): (string|null)[][]`, weeks of 7 cells, Sunday first.

- [ ] Step 1: Write the failing tests.
  - `monthGrid(2026,10)[0]` is `[null,null,null,null,'2026-10-01','2026-10-02','2026-10-03']`.
  - It has 5 rows and the last cell is `'2026-10-31'`.
  - For February 2026, the first row starts with `'2026-02-01'` at index 0.
- [ ] Step 2: Implement, run, pass. Then rebuild to the frames:
  - C1 `837:4458`, C1b `837:4655`, C1c `837:4572`, C2 `837:4904`, C3 `837:5217`, C4 `837:5428`
  - Week-strip days with no dot keep a transparent dot, so every day aligns.
- [ ] Step 3: Run compare. Commit. **Phase review.**

### Task 9: Pantry (P1–P3) with item icons

**Files:**
- Modify: `native/src/app/(tabs)/pantry.tsx`, `add-item.tsx`, `pantry-item.tsx`, `restock.tsx`
- Create: `native/src/lib/icons.ts` (the icon library index: name → asset, category), `native/src/lib/icons.test.ts`, `native/src/app/pick-icon.tsx`

**Interfaces:**
- Produces: `matchIcons(query: string): {exact: IconRef|null; closest: IconRef[]; letter: string}`.

- [ ] Step 1: Write the failing tests.
  - `matchIcons('Milk').exact.name === 'Glass of milk'`.
  - `matchIcons('Almond milk').closest[0].name === 'Glass of milk'`.
  - `matchIcons('Tofu').exact === null` and `.closest[0].name === 'Cheese wedge'`.
  - `matchIcons('kombucha').letter === 'K'`.
- [ ] Step 2: Implement (synonym table plus name and category match), run, pass.
- [ ] Step 3: Rebuild to the frames:
  - P1 `842:3873`, P1d `966:1958` (Undo snackbar), P1e `966:2021`, P1f `966:2090`
  - P2 `966:2201`, P2b–P2g `966:2225`…`1028:19699`
  - P3 `966:2383`
  - Icons are stored through `p_icon`.
- [ ] Step 4: Run compare. Commit. **Phase review.**

### Task 10: Profile, settings, and the frameless screens

**Files:**
- Modify: `native/src/app/(tabs)/profile.tsx` and the sheets `edit-profile`, `household`, `invite`, `busy-days`, `reminders`, `manage-chores`, plus `kudos`, `recap`, `swap`, `plan`, `activity`, `request-sent`. Hide `paywall` (remove its entry points; keep the file).

- [ ] Step 1: Rebuild to the frames:
  - R1 `842:3980` / `966:2471`, R2–R15 `966:2636`…`966:3309`, R5b `966:3479`, R5c `966:3554`
  - R13 Leave home moves your chores to the pool. R15 Delete account is a red destructive sheet.
- [ ] Step 2: Restyle the frameless screens with the same components and patterns: sheet layout from `v2/BottomSheet`, rows from `SettingsRow` / `TaskRow`. No new visual vocabulary.
- [ ] Step 3: Grep check: no route still imports the old `kit.tsx` `C` palette or Inter / Playfair. Run `grep -rn "from '@/ui/kit'" src/app` and expect no output. Delete `kit.tsx` and the old fonts.
- [ ] Step 4: Run compare for the R frames, `tsc` and the tests. Commit. **Phase review.**
- [ ] Step 5: Export the frameless screens from Expo web and add them to Figma page `834:4432` as new frames named "X1 · Kudos", and so on.

### Task 11: Motion and scroll pass

**Files:**
- Modify: the tab screens and `v2/Nav`, `v2/StreakCard`, `v2/BottomSheet`, `v2/TaskRow`, `celebration.tsx`, `confetti.tsx`

- [ ] Step 1: Collect reference timing from Mobbin (Tiimo, Things, Revolut, Duolingo flows: complete task, tab switch, sheet open, streak/celebration). Record the chosen values in PROGRESS.md. Timing only, never layout.
- [ ] Step 2: Apply the motion system.
  - Large-title collapse on tab screens (Fraunces title scales from 34 to 20 and moves into the bar between 0 and 60 px of scroll).
  - The nav fades in at the bottom, as in the Figma nav fade.
  - Pull-to-refresh on Home and Chores.
  - The tab pill slides between tabs as a shared layout animation.
  - Task complete: the check fills, the row fades to 55% opacity, and `haptic.complete`.
  - All done: the streak number counts up, the plant grows to its stage, confetti, and `haptic.allDone`.
  - Sheets use the `motion.sheet` spring over a blurred scrim.
- [ ] Step 3: Verify on device in Expo Go with Reduce Motion both off and on (Settings > Accessibility > Motion). Expected: with it on, only fades remain. Commit. **Phase review.**

### Task 12: QA sweep

**Files:**
- Create: `native/scripts/lint-copy.mjs` (+ `npm run lint:copy`)

- [ ] Step 1: Write `lint-copy.mjs`. It fails if `src/` contains `#FFFFFF` / `#fff` / `'white'`, `textTransform: 'uppercase'`, `/\bpts?\b/` in strings, or `Monday` as a week start. Run it and fix every hit.
- [ ] Step 2: Use the Expo web sweep to capture every route at widths 375, 390, 393 and 430. Check for overlap, clipping and orphaned words, and fix them.
- [ ] Step 3: Run the impeccable audit and the mobile-app-ui-design checklist on the captured screens. Fix the findings.
- [ ] Step 4: Run the full device pass in Expo Go on iPhone with the seeded household, walking through the case study's four usability scenarios. Each must succeed without help.
- [ ] Step 5: Run `tsc`, the tests and `lint:copy`, all clean. Commit. **Phase review.**

### Task 13: Packages

- [ ] Step 1: Ask Pema to run `npx eas login` once. Run `npx eas build -p android --profile preview` and share the APK link.
- [ ] Step 2: When Pema has an Apple Developer account, run `npx eas build -p ios --profile production` and `npx eas submit -p ios` to TestFlight. Pema signs in to Apple when prompted.
- [ ] Step 3: Update PROGRESS.md and the README with how to install. Final commit, then push the branch.
