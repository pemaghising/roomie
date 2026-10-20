# Roomie v2 upgrade

Single source of truth for everything added to Roomie as part of the Mobbin-research upgrade. Each feature has one entry: what it is, the Mobbin pattern behind it, why, where it lives, and how it was verified.
Narrative version for the portfolio: [case-study-v2-mobbin-research.md](case-study-v2-mobbin-research.md).

**Maintenance rule:** every feature added from Mobbin research gets an entry here (same fields, next free ID), and the status table is updated. Do not append loose notes at the bottom.

## Status

App version: **2.1.0** (`native/app.json` and `native/package.json`; shown under Profile > About). Made by pemaghising.

| ID | Feature | Web | Native | Source pattern |
|---|---|---|---|---|
| V2-01 | Roommate progress rings | done | done | Copilot, Revolut |
| V2-02 | Celebration stats | done | done | Duolingo |
| V2-03 | Streak goal | done | done | Duolingo |
| V2-04 | Balance chip | done | removed from native Home | Splitwise |
| V2-05 | Warmer empty state | done | done | Greenlight |
| V2-06 | Shareable invite card | not planned | done | Yope, Uber Eats |
| V2-07 | Shareable weekly recap | not planned | done | Airbuds, Tonal |
| V2-08 | Home-screen widgets | n/a | planned | Runbuds |
| V2-09 | Per-member 7-day record | planned | done | Duolingo Friends, Finch |
| V2-10 | Expense splitting | deferred | deferred | Splitwise, Vipps |
| V2-11 | Roomie Plus paywall | planned | done (billing not wired) | Sunlitt, Givingli, Linktree, Tolan, BitePal, Gentler Streak |
| V2-12 | Home daily progress bar | planned | done | Finch |
| V2-13 | Streak hero card (growing plant, week strip, goal bar) | plant only (existing) | done | Duolingo, Finch, Mimo, Yazio, Me+, Gentler Streak |
| V2-14 | Streak milestone celebrations | planned | done | Duolingo |
| V2-15 | Swipeable welcome intro | planned | done | Alan, Mimo, ClickUp, Me+ |
| V2-16 | Chores tab redesign (week strip, one-day focus) | planned | done | Liven, Tiimo, Todoist, Me+, Attio, Asana |
| V2-17 | Pantry tab redesign (stock cards, restock banner) | planned | done | Amazon Fresh, Alexa, Natural AI, Yazio, Lovi, Vivino |
| V2-18 | Profile redesign (stats hero, achievements) | planned | done | Mimo, Lyft, Duolingo, Headway, QUITTR, Matter |
| V2-19 | Push reminders (primer, registration, Expo sender) | n/a | done, needs dev build and deploy | Flow audit |
| V2-20 | Household settings | exists | done | Flow audit |
| V2-21 | Account deletion | planned | done, backend untested | Flow audit |
| V2-22 | Invite deep links | exists | route done, universal links not set up | Flow audit |
| V2-23 | Plan review and swaps | exists | done | Flow audit |
| V2-24 | Manage chores and why-this-chore | exists | done | Flow audit |
| V2-25 | First week is ready | planned | done | Flow audit |
| V2-26 | Offline banner | exists | done | Flow audit |
| V2-27 | Light mode locked | n/a | done | Flow audit |
| V2-28 | About, privacy, rating prompt | partial | done | Flow audit |
| V2-29 | Tab bar shrinks while scrolling | n/a | done | Owner request (common iOS pattern) |
| V2-30 | "Up for grabs" made a top priority | exists (banner) | done | Alexa announcement banner, Asana, Tiimo section pills |
| V2-31 | Swipe a chore to finish it (2.1) | n/a | done | MyFitnessPal, Notion Mail, GitHub swipe actions |
| V2-32 | Activity feed redesign (2.1) | partial | done | Instagram, Lapse, Life Reset, Mesh |
| V2-33 | Cheers between roommates (2.1) | planned | done, backend untested | Finch kudos, Alma reactions |
| V2-34 | Skeleton loading (2.1) | n/a | done | Careem, Snapchat, Grab |

Design rules applied to every feature: no ranking of people, balance shown in points never money, no invented data, personal preferences stay on the device.

---

## V2-01 Roommate progress rings
- **What (web):** each roommate tile on Home shows a progress ring and "done/total done" (or "free today").
- **What (native):** redesigned as one compact white card (it once had a "Today, together" title and a house-total line, both removed to save space and clutter), each roommate is an avatar (or photo) inside a progress ring drawn in a darkened version of their own colour, with a purple gradient ring (light to deep brand purple) and a green check badge once they are fully done, their name and "done/total" (or "free"). It scrolls sideways for bigger households, shows "You" first, never ranks anyone, and ends with a dashed "+ Invite" circle (opens the invite sheet) while there are fewer than 8 members. Replaces the three flat coloured tiles.
- **Mobbin:** Copilot budget rings and Revolut arc (web); Alma (avatars in rings, dashed add circle), Yazio (ring with check badge), Calm (ring-first progress) for the native card.
- **Why:** v1 showed only a task count; progress is more motivating and shows who has finished. The native version also shows everyone, not just three people.
- **Where:** web `src/ui/RingProgress.tsx`, `src/features/home/Home.tsx`, `home.css`. Native `native/src/ui/roommates-card.tsx` (new), `native/src/ui/ring.tsx` (adds a `stroke` prop), `native/src/app/(tabs)/index.tsx`. Native adds `react-native-svg`.
- **Verified:** web `RingProgress.test.tsx` (zero total shows an empty ring, no NaN); `Home.test.tsx` updated from "1 task" to "0/1 done". Native typecheck and bundle.
- **Review fix:** ring colour changed from `#ffffffcc` (about 1.2:1 contrast) to the ink colour.

## V2-02 Celebration stats
- **What:** the completion celebration shows day streak and tasks done today.
- **Mobbin:** Duolingo lesson-complete summary.
- **Why:** gives the finishing moment concrete feedback.
- **Where:** web `Celebration.tsx` (prop `kind` became `info`), `useChoreActions.ts`, `Chores.tsx`, `chores.css`. Native `lib/actions.ts`, `ui/celebration.tsx`, `(tabs)/chores.tsx`.
- **Verified:** web `Celebration.test.tsx` (2 tests). `doneToday` has no direct test (minor, deferred).

## V2-03 Streak goal
- **What:** optional 3, 5 or 7-day household streak goal with progress text; once reached, "Set a new goal".
- **Mobbin:** Duolingo streak-goal commitment screen.
- **Why:** a visible target makes the streak worth protecting.
- **Where:** web `src/lib/streakGoal.ts`, `Home.tsx`. Native `native/src/lib/streak-goal.ts`, `(tabs)/index.tsx` (native `Alert` as the picker).
- **Verified:** web `streakGoal.test.ts` (4 tests incl. storage throwing); `Home.test.tsx` goal-replacement test.
- **Limit:** stored per device (localStorage), not per user or household.

## V2-04 Balance chip
- **What:** header chip: "All square", "+N pts next week" or "N pts ahead", linking to Profile. Full sentence is the accessibility label.
- **Mobbin:** Splitwise "Overall, you are owed".
- **Why:** the balance was buried in Profile.
- **Where:** web `Home.tsx` + `home.css`. Removed from native Home by request (the "All square" text next to the bell read as clutter); the balance is still on the native Profile.
- **Verified:** web `Home.test.tsx` (chip announces the full sentence). The nowrap chip may crowd the header at 320px (minor, deferred).

## V2-05 Warmer empty state
- **What:** "No tasks today 🎉 Check back tomorrow."
- **Mobbin:** Greenlight chores empty state.
- **Where:** web `Home.tsx`; native `(tabs)/index.tsx`.

## V2-06 Shareable invite card (native)
- **What:** card with household name, QR code of the join link, code, "Share invite" and "Copy code". Shown in onboarding and a new Invite sheet opened from Profile.
- **Mobbin:** Yope invite QR card, Uber Eats add-people.
- **Why:** a household needs several members; a shareable object drives invites.
- **Where:** `native/src/ui/invite-card.tsx`, `native/src/app/invite.tsx`, `onboarding/invite.tsx`, `(tabs)/profile.tsx`, `lib/actions.ts` (`inviteLink`), `_layout.tsx`. Adds `react-native-qrcode-svg`, `expo-clipboard`.
- **Link:** `https://roomie-theta.vercel.app/j/<code>`, which the web app already resolves. Native deep linking is not set up.
- **Verified:** typecheck, bundle, `expo-doctor`. Not tested on a device.

## V2-07 Shareable weekly recap (native)
- **What:** "Our week" sheet: chores done, percent of week, streak, each person's count in member order. "Share recap" exports a PNG. Opened from a plain share icon (no background shape) in the top-right corner of the Home streak card (earlier versions, a separate "Our week so far" row and a circle button, were removed by request).
- **Mobbin:** Airbuds weekly recap, Tonal month review.
- **Why:** turns usage into organic marketing.
- **Where:** `native/src/lib/recap.ts` (+ `recap.test.ts`), `native/src/app/recap.tsx`, Home entry row, `_layout.tsx`. Adds `react-native-view-shot`, `expo-sharing`.
- **Verified:** 3 unit tests (done vs due, covered chores credit the claimer with no ranking, empty week is 0% not NaN). Run: `npx vitest run --config native/vitest.config.ts`. Image sharing not tested on a device.

## V2-09 Per-member 7-day record (native)
- **What:** on the recap sheet, each person's last 7 days as dots (kept, hollow = something left, faint = no chores) and "N/7 kept". Shown in member order, never ranked. A Roomie Plus feature.
- **Mobbin:** Duolingo friend streaks, Finch weekly progress.
- **Why:** per-person accountability without a leaderboard.
- **Where:** `native/src/lib/recap.ts` (`memberWeek`), `recap.test.ts` (1 new test, 4 total), `native/src/app/recap.tsx`.
- **Limit:** true lifetime per-member streaks would need a database migration; `get_state` only returns 7 days of history, so this is a 7-day record, not a streak count.

## V2-11 Roomie Plus paywall (native)
- **What:** full-screen paywall. Peach hero with the trophy mascot curving into a white sheet, headline with an accent phrase, a Free vs Plus comparison table (Plus column highlighted), a yearly plan (pre-selected, "Most popular" badge, 7-day free trial) and a monthly plan, a pinned dark CTA with "No payment now. Easy to cancel.", Restore purchases and a privacy link. Entry points: Profile > Roomie Plus, and the locked 7-day record on the recap sheet.
- **Mobbin:** layout from Tolan (comparison table), BitePal (plan card and reassurance line), Gentler Streak and Finch (illustrated hero, close button); plan structure from Sunlitt, Givingli, Linktree.
- **Layout fix:** an earlier version overflowed small screens; only the CTA is pinned now and everything else scrolls.
- **Free vs Plus:** core chores, invites and the shareable recap stay free because they drive household growth. Plus currently unlocks the 7-day record; themes and bigger households are listed as "coming soon".
- **Where:** `native/src/app/paywall.tsx`, `lib/plans.ts` (prices are **placeholders**: $19.99/year, $2.99/month), `lib/entitlement.ts`, `(tabs)/profile.tsx`, `recap.tsx`, `_layout.tsx`.
- **Billing is NOT wired.** `entitlement.ts` is the single seam: nobody is Plus and `purchase()` / `restorePurchases()` throw `PurchasesNotConfigured`, which the paywall shows as "Purchases are not set up yet. Roomie Plus is coming soon." It never fakes an unlock. To go live: create products in App Store Connect and Play Console, add RevenueCat in a dev build (not Expo Go), then call `setPlus()` from the provider.
- **Verified:** typecheck and bundle only; not on a device.

## V2-12 Home daily progress bar (native)
- **What:** "Today's Tasks" header shows "N of M done" (or "All done 🎉"). An animated progress bar under it was tried and removed by request.
- **Mobbin:** Finch daily progress above the goal cards.
- **Why:** shows progress at a glance and rewards each tick.
- **Home layout (one screen):** the native Home no longer scrolls as a whole. From the top: a one-line greeting, plan or swap banners (only when needed), the compact streak card, a compact roommate row, then the "Today's Tasks" header, and only the task list (and a "Coming up" row) scrolls inside the remaining space, with pull-to-refresh on it. On a small phone fewer tasks are visible at once; on a larger one all of them usually are. Compaction: the greeting is 26pt, the roommate row has no title and uses 52pt rings, and spacing is tightened throughout. The old peach "Next up: Monday" card became a white "Coming up" row with a small violet date tile (day and date), the next chore with its icon, and a chevron that opens the Chores tab.
- **Where:** `native/src/app/(tabs)/index.tsx`, `native/src/ui/streak-card.tsx`, `native/src/ui/roommates-card.tsx`.
- **Design check:** the floating pill tab bar, illustrated onboarding and pastel task cards already matched the research, so they were left as they are.

## V2-13 Streak hero card (native)
- **What:** the Home streak card was redesigned to remove empty space and give it a clear hierarchy, top to bottom: a deep-violet gradient surface; a "CLEAN STREAK" chip with a plain share icon (opens the recap); a huge streak number with "days in a row" beside the 8-stage plant (egg to fully grown at day 7), which levitates over a soft shadow that shrinks and fades as it rises; the household's Monday to Sunday strip (white check = every chore kept, dashed ring = today, dim dot = missed, faint = upcoming); and a goal row, either a progress bar ("3/7 to your goal") or a "Set a streak goal" button, which becomes "goal reached · set a new one". Replaces the 🌿 emoji and the earlier flat lavender layout. The card was then made compact (about 190pt: a small chip and goal pill, a 56pt number, a 78pt plant, and the week strip) so that Home fits on one screen with the streak card at the top. The goal is now a single pill ("3/7 goal", "+ Set a goal", or "Goal reached · new goal") instead of a progress bar. See "Home layout" under V2-12.
- **Mobbin:** Duolingo streak widget (gradient card, mascot at the corner, weekday check strip), Finch day-streak screen (huge number, 7-day check row), Mimo widget (weekday circles), Yazio milestone bar (goal progress), Me+ and BitePal (weekday pills).
- **Where:** `native/src/ui/streak-card.tsx` (new), `streak-plant.tsx`, `native/src/lib/plant.ts` (`stageFor`), `native/src/lib/recap.ts` (`houseWeek`), `native/src/app/(tabs)/index.tsx`. Adds `expo-linear-gradient`. Plant art copied from web `public/streak` to `native/assets/images/streak/`; the web app already had the plant.
- **Verified:** `plant.test.ts` (stage per day) and 2 `houseWeek` tests in `recap.test.ts` (kept / missed / open / future, and no-chore days). Typecheck and Android bundle. Idle bob respects reduced motion. Not seen on a device.

## V2-14 Streak milestone celebrations (native)
- **What:** reaching a 3, 7, 14, 30, 50 or 100-day household streak opens a full-screen takeover: the plant, a huge number, a milestone line, confetti, "Share the streak" and "Keep going". Each milestone shows once; a broken streak starts a fresh run so milestones can be earned again.
- **Mobbin:** Duolingo streak milestone screens.
- **Where:** `native/src/ui/milestone.tsx`, `lib/plant.ts` (`milestoneState`), `lib/streak-goal.ts` (seen-milestone storage), `(tabs)/index.tsx`.
- **Verified:** `plant.test.ts` (celebrate once at the highest milestone, reset after a break).
- **Limits:** "seen" is stored per device, so a second device celebrates again. The share is text only, not an image.

## V2-15 Swipeable welcome intro (native)
- **What:** Welcome is now a 3-page swipeable intro (Peaceful co-living, Chores that run themselves, Win the week together) with a dot indicator, "Next" then "Create Account" on the last page, and "Log In" always available.
- **Mobbin:** Alan, Mimo, ClickUp and Me+ onboarding: one character, one headline, one button, progress dots.
- **Where:** `native/src/app/auth/index.tsx`.
- **Not done:** a "your first week is ready" first-win screen right after setup. Planned.

## V2-16 Chores tab redesign (native)
- **What:** the Chores tab used to open on a large month calendar over a seven-day list, with no title. It is now a focused, one-day view: a "Chores" title with a "Today" jump chip (only when you are on another day) and a calendar button that reveals the month view on demand; a week strip of seven pills (selected day filled violet, today tinted) with a dot under each date (filled = everything kept, outlined = something missed, light = open) and ‹ › to change week; "Just me / Everyone" filter chips; a big day header ("Wednesday", "Today · 7 October") with an "N of M" badge that turns green "All done"; that day's chores; an "Also this week" list of the other days as tappable summary rows (date, chore icons, count) so the rest of the week is one tap away without a long scroll; an "Up for grabs" pill with a count above missed chores and restock requests; an illustrated "Nothing planned. Enjoy the quiet." empty state; and an extended violet "+ Add chore" button. In the Everyone view each chore shows its assignee's avatar with a small check when done.
- **Mobbin:** Liven, Tiimo, Todoist and Me+ (week strip with one day in focus, "N of M completed", Today jump chip, filter chips); Attio (assignee avatars on tasks); Asana (extended "New task" pill); Tiimo (section pills with counts).
- **Where:** `native/src/app/(tabs)/chores.tsx` (rewritten), `native/src/ui/week-strip.tsx` (new), `native/src/ui/task-row.tsx` (`badge` prop, `AssigneeBadge`), `native/src/ui/week-view.tsx` (reduced to `tasksOn`; the old `WeekAgenda` is removed), `native/src/lib/recap.ts` (`weekStates`, now also behind `houseWeek`).
- **Verified:** `weekStates` test (past weeks judged, future never) and the existing `houseWeek` tests still pass (10/10 native logic tests). Typecheck and Android bundle. Not seen on a device.
- **Behaviour kept:** chores can only be ticked on your own tasks for today or earlier; roommates' chores are read-only; the claim flow for missed chores and the restock requests are unchanged.

## V2-17 Pantry tab redesign (native)
- **What:** the Pantry was a text-tab list of plain rows. It is now: a "Pantry" title with a live subtitle ("3 need restocking" / "Fully stocked"); a rounded segmented control (Shared, My items, Roommates); on Shared, a peach "Time to restock" banner naming the items and a "Request" button (or a green "Fully stocked. Nice." strip); then two sections with counts, "RUNNING LOW" (out items first, then low) and "IN STOCK", each a two-column grid of item cards. Each card has a large emoji, the name, and a three-pip stock meter with a label (green full, amber low, red out; never colour alone), tinted borders on items that need attention, and the open-restock note ("Priya is getting it") under it. My items and Roommates use the same cards with the "Ask first" / "Do not touch" tag; roommates are grouped under their avatar and name with an item count. The empty state keeps the add-the-basics chips, now with emoji. An extended violet "+ Add" button opens the existing "Request restock / Add to pantry" menu.
- **Mobbin:** Amazon Fresh and Alexa (uppercase sections with counts, announcement-style banner, prominent add action), Natural AI and Yazio (two-column cards with big emoji), Lovi and Julienne (rounded segmented tabs), Vivino (cart-style restock action on items that need it).
- **Where:** `native/src/app/(tabs)/pantry.tsx` (rewritten), `native/src/ui/pantry-tile.tsx` (new, with the stock meter), `native/src/lib/pantry-health.ts` (new: `pantryHealth` splits the shelf into needs-restock and fine).
- **Verified:** `pantry-health.test.ts` (out before low, then by name; empty shelf). Typecheck and Android bundle (12/12 native logic tests). Not seen on a device.
- **Behaviour kept:** adding basics, ask-to-use requests (Sure / Not this time), opening an item, the restock and add flows, and the `?tab=` deep link are unchanged.

## V2-18 Profile tab redesign (native)
- **What:** the Profile was a centred avatar with two stat boxes and plain lists. It is now: a deep-violet gradient hero card with the avatar (camera edit button), name, household and Owner label, a three-tile stat row (day streak, done this week, points), and an outlined "Share our week" button that opens the recap; an **Achievements** row with an "N of 6" count, where earned badges are lit and locked ones are greyed with a lock and a one-line hint on how to earn them; a **Roommates** row of avatars with an Owner label and a dashed "+ Invite" circle; a dark **Roomie Plus** banner with a "Try" button; grouped **Settings** rows with coloured icon tiles (Edit profile, My busy days); a **Notification style** segmented control with its hint underneath; and an outlined red "Log out" button. Replaces the stacked roommate list with the invite-code row (the invite sheet still shows the code).
- **Achievements (derived, nothing invented):** Sprout, Week warrior and Two weeks strong come from the household's best streak (so they stay earned after a break); Clean sweep is finishing all your chores today; Team player is covering a roommate's chore this week; Restocker is completing a restock this week. Earned badges sort first. They are personal and never ranked against roommates.
- **Mobbin:** Mimo and Lyft (centred avatar with a three-stat row and a share button), Duolingo, Headway and QUITTR (achievement badges, locked ones greyed with a lock), Lyft and Matter (grouped settings rows with coloured icon tiles), Duolingo friend streaks (avatars with a dashed add circle).
- **Where:** `native/src/app/(tabs)/profile.tsx` (rewritten), `native/src/lib/achievements.ts` (new, with `achievements.test.ts`).
- **Verified:** 5 achievements tests (nothing earned for a new profile, streak badges from the best streak, clean sweep needs at least one chore, covering vs finishing your own, earned-first order); 17/17 native logic tests, typecheck and Android bundle. Not seen on a device.
- **Behaviour kept:** edit profile and photo, invite sheet, paywall, busy days, the notification-style update, and the log-out confirmation are unchanged.

## V2-19 to V2-28 Flow completeness (native, shipped in 2.0)

These ten items came from an audit of the app against its own backend, not from Mobbin screens. The method: list every server function the app can call, check which ones the native app actually uses, and check the routes a new person walks through. Where a screen was needed, it reuses the patterns already adopted above.

### V2-19 Push reminders (native)
- **Gap:** the notifications plugin was configured but nothing registered a device, so the app sent no reminders at all.
- **What:** a "Never miss your turn" screen explains what the nudges are before the system prompt (the first time someone lands on Home, and from Profile > Reminders, which also links to phone settings if permission was denied). Accepting registers this device's Expo push token as an `expo:` subscription through the existing `save_push_subscription` function. Tapping a reminder opens the screen it names (`/chores`, `/plan`, `/pantry?tab=mine`). Signing out removes this device's subscription.
- **Server:** the reminder pipeline already stored subscriptions generically, so native devices reuse it. `supabase/functions/tick/push.ts` now accepts the exact shape `expo:ExponentPushToken[...]` in its allow-list (still rejecting anything else) and exposes `expoMessage`; `tick/index.ts` sends those through Expo's push service and drops tokens Expo reports as `DeviceNotRegistered`.
- **Where:** `native/src/lib/push.ts`, `native/src/app/reminders.tsx`, `_layout.tsx`, `lib/auth.tsx`, `(tabs)/index.tsx`, `supabase/functions/tick/push.ts`, `tick/index.ts`, `tick/push.test.ts`.
- **Verified:** 2 new push tests (allowed token shape and rejected lookalikes; the Expo message carries title, body and deep link). All 26 edge-function tests pass.
- **"Up for grabs" pushes:** the server already queues one when a day is swept (`srv_sweep_day`): every other member gets "Up for grabs 🙌 …" listing the chores that were missed, which opens the Chores tab, and it does not count toward the daily push cap. The native app now receives it through the steps above. To check how it looks without waiting for a roommate to miss a chore, Profile > Reminders has a "Preview an 'up for grabs' reminder" button that shows the real wording as a local notification after 5 seconds (it works in Expo Go; tapping it opens Chores). Gap: a person leaving or being removed also sends their chores to the pool, but that path does not queue a push.
- **Not done / needs you:** remote push does not work in Expo Go on Android, so it needs a development build and an EAS project id (`extra.eas.projectId`). The updated `tick` function must be deployed (`npx supabase functions deploy tick --no-verify-jwt --use-api`); I did not deploy it.

### V2-20 Household settings (native)
- **Gap:** the backend can rename a home, change the plan mode and day end, make a new invite code, remove a roommate and leave a household, but the native app used none of it.
- **What:** Profile > Household opens a sheet with the home name, "Review first / Apply automatically", "Day ends at" (20:00 to 23:00), the invite code with a two-tap "Make a new code" (owner only), a roommate list with owner-only remove, and a confirmed "Leave household". Behaviour matches the web settings screen.
- **Where:** `native/src/app/household.tsx`, `(tabs)/profile.tsx`, `_layout.tsx`.
- **Verified:** typecheck and bundle only (it calls existing, tested server functions).

### V2-21 Account deletion (native and backend)
- **Gap:** App Store guideline 5.1.1(v) requires in-app account deletion, and neither the app nor the backend had it.
- **What:** Profile > Delete account, behind two confirmations. The app removes the person's avatar files, removes this device's reminder subscription, calls `delete_account`, then clears the local session.
- **Backend:** `supabase/migrations/20261001000018_account_deletion.sql` adds `delete_account()`. Several tables reference profiles without a cascade, so it first leaves the household the normal way, then removes or detaches this person's swaps, assignments, ledger and activity references and personal pantry items and requests, hands shared pantry items they added to a remaining roommate, and finally deletes the auth user (which cascades the profile, membership, approvals, push subscriptions and notifications).
- **Where:** `native/src/lib/account.ts`, `(tabs)/profile.tsx`, the migration.
- **Not applied and not tested.** The migration has not been run against any database, and I could not run it here. Try it on a staging project or Supabase branch before `db push`. This is the highest-risk item in this section; the app only shows "Couldn't delete the account" if the function is missing or fails.
- **Known trade-off:** a leaving person's unfinished chores for the current week are removed rather than reassigned, because the profile row cannot be deleted while rows still reference it.

### V2-22 Invite links open the app (native)
- **Gap:** an invite link or QR code opened the web app, not the native one, and the join code was lost on the way through sign-up.
- **What:** a `/j/<code>` route (so `roomie://j/ABC123` works) remembers the code through sign-in and profile setup, then skips the create-or-join choice and lands on the join step with the code filled in.
- **Where:** `native/src/app/j/[code].tsx`, `native/src/lib/invite.ts`, `onboarding/start.tsx`.
- **Not done:** the shared `https://roomie-theta.vercel.app/j/<code>` link still opens the website. Making it open the installed app needs universal links (an `apple-app-site-association` file and `assetlinks.json` served from that domain, plus associated-domain and intent-filter config) and a development or production build.
- **Verified:** typecheck and bundle. Not tried on a device.

### V2-23 Plan review and swaps (native)
- **Gap:** each week the server drafts next week's plan and supports approving it and swapping chores, and the web app has a Plan Review screen and Home banners. Native had none, so a draft could never be approved and nobody could swap.
- **What:** a Plan screen (this week or next week, with the "locks Sunday 6 pm" line, each person's chores and points, a check for everyone who approved, and "Looks good"), incoming swap requests with Accept and Decline, and a Swap sheet (pick one of yours, pick what to trade for, see what it does to your points, send the request). Home shows a banner when a plan is waiting or a roommate wants to swap, and the Chores header has a plan button.
- **Where:** `native/src/app/plan.tsx`, `swap.tsx`, `ui/banner.tsx`, `lib/plan.ts`, `lib/selectors.ts` (`pendingDraft`, `incomingSwaps`), `(tabs)/index.tsx`, `(tabs)/chores.tsx`.
- **Verified:** 4 tests in `plan.test.ts` (a draft is next week's only, swaps addressed to me, the lock line in the household timezone, the swap points sentence).

### V2-24 Manage chores and "why this chore" (native)
- **Gap:** you could add a chore but never remove a mistaken one, and there was no explanation of why a chore landed on someone.
- **What:** Profile > Chores lists the rotation with effort and rhythm and lets you remove one (its upcoming turns are cleared; finished ones stay in history). A small info button on every chore opens an explanation: the reason ("Your turn, Priya did it last week"), this week's effort per person (alphabetical, never ranked), and your private balance. Covering for a roommate says thanks and never shows their private reason.
- **Where:** `native/src/app/manage-chores.tsx`, `why.tsx`, `lib/why.ts`, `ui/task-row.tsx` (`onInfo`).
- **Verified:** 3 tests in `why.test.ts`.

### V2-25 First week is ready (native)
- **Gap:** setup ended by dropping people on Home with no sense of what had just been made.
- **What:** after the invite step (creators) or joining (roommates) a "Your first week is ready" screen shows how many chores, people and your turns this week, or says the plan is still being made.
- **Where:** `native/src/app/onboarding/ready.tsx`, `lib/first-week.ts`, `onboarding/invite.tsx`, `onboarding/busy.tsx`, the root gate in `_layout.tsx`.
- **Verified:** 3 tests in `first-week.test.ts`.

### V2-26 Offline banner (native)
- **What:** a slim "You're offline. Changes sync when you're back." banner while the phone has no connection. Not done: persisting changes made offline (listed in the migration notes as not ported).
- **Where:** `native/src/ui/offline-banner.tsx`, `_layout.tsx`. Adds `@react-native-community/netinfo`.

### V2-27 Light mode locked (native)
- **What:** `userInterfaceStyle` is now `light`. The app followed the system setting but every screen is hard-coded light, so dark-mode phones looked inconsistent. A real dark theme is a possible future project.
- **Where:** `native/app.json`.

### V2-28 About, privacy and rating prompt (native)
- **What:** Profile > About has a Privacy policy link and the app version. After the 7-day (or longer) streak celebration the app asks the OS to show the rating prompt (the OS decides whether it appears). Not done: a Terms of service page and a support or feedback address, because neither exists yet.
- **Where:** `(tabs)/profile.tsx`, `(tabs)/index.tsx`. Adds `expo-store-review`.

## V2-29 Tab bar shrinks while scrolling (native)
- **What:** the floating pill tab bar shrinks to icons only (68pt down to 52pt, labels fade out) whenever a tab's list is scrolled in either direction, and opens again 0.6 seconds after scrolling stops or as soon as the list is back at the top. This gives the content more room, which matters most on the one-screen Home.
- **Source:** an owner request, in the style of iOS bars that make way for content. It was not taken from a Mobbin screen.
- **Where:** `native/src/lib/tab-shrink.ts` (a tiny shared store: `noteScroll`, `scrollShrink`, `useTabShrunk`), `native/src/ui/tab-bar.tsx`, and the `scrollShrink` props on the Home task list and the Chores, Pantry and Profile scroll views.
- **Verified:** 4 tests in `tab-shrink.test.ts` (shrinks while scrolling, stays shrunk across a direction change, expands at the top, ignores a one-pixel wobble); 31/31 native logic tests, typecheck and Android bundle. Not seen on a device.

## V2-30 "Up for grabs" as a top priority (native)
- **Gap:** the claim flow (a roommate's missed chore, claimable by anyone else) lived at the very bottom of the Chores tab and nothing on Home pointed to it, so it was easy never to find. The web Home had a banner for it; native did not.
- **What:** on Home, a peach "N UP FOR GRABS" card sits directly under the streak card whenever there is something to claim. It names the first chore ("Bathroom, Missed by Priya") with a dark one-tap **Claim** button, and tapping the card opens the Chores tab. If only a pantry restock request is waiting it shows that with a chevron instead of Claim. The count includes missed chores and open restock requests. On the Chores tab the "Up for grabs" section moved from the bottom to the top, directly under the header. When nothing is up for grabs both disappear and take no space.
- **Mobbin:** Alexa's coloured announcement banner for a shared-household notice, Asana's prominent action pill, and Tiimo's section pills with counts.
- **Where:** `native/src/ui/grab-card.tsx` (new), `native/src/app/(tabs)/index.tsx`, `native/src/app/(tabs)/chores.tsx`.
- **Fix after first use:** the card kept showing after a claim and the claimed item never reached Today's Tasks. Cause: claiming a pantry restock request only marks it as claimed; it stays "open", so the card still counted it, and nothing turned it into a task. Now the card counts only what is claimable (roommates' missed chores and restock requests nobody has claimed), and its Claim button works for either kind. A restock you claim leaves the pool and appears in Today's Tasks as a "Buy Milk" errand with a check circle (tap when bought; hold to give it back), counted in "N of M done". A chore you claim shows in Today's Tasks marked "Covering for Priya". Logic is in `grabbable` and `myRestocks` in `native/src/lib/selectors.ts`, with 4 tests in `grabs.test.ts`; the errand row is `RestockTaskRow` in `native/src/ui/restock-row.tsx`.
- **Behaviour kept:** you can only claim other people's missed chores, never your own, so a single-person household never sees this. Claiming still moves the chore to your list as "covering" and ends with the "thanks for covering" celebration.
- **Verified:** typecheck and Android bundle (the selectors it uses were already covered). Not seen on a device, and it needs a second account with a missed chore to appear.

## V2-31 Swipe a chore to finish it (native, 2.1)
- **What:** swipe a chore card to the right to finish it; a green "Done" panel (or a grey "Undo" panel if it is already done) slides out, the chore toggles, and the row snaps back. It works on the Home task list and on the Chores tab (only on chores you can tick: yours, today or earlier). Tapping the circle still works.
- **Mobbin:** swipe actions in MyFitnessPal (swipe to delete), Notion Mail's swipe settings and GitHub's "left swipe: mark as done".
- **Where:** `native/src/ui/swipe-task.tsx` (new, on react-native-gesture-handler's ReanimatedSwipeable), `(tabs)/index.tsx`, `(tabs)/chores.tsx`.
- **Verified:** typecheck and bundle. Not tried on a device (a gesture needs a real feel test: thresholds are 64pt with friction 1.5).

## V2-32 Activity feed redesign (native, 2.1)
- **What:** the feed is now a "New" section first (the events you have not seen, with a violet dot and an "N new" chip beside the title), then Today, Yesterday and earlier days. Every row has the person's avatar with a small emoji badge for what happened, one readable sentence, and a relative time ("3m", "2h", "1d"). When a roommate finishes a chore there is a "🙌 Cheer" chip that opens the cheer sheet (V2-33). Events with no person (plan locked, chores up for grabs) show their emoji in a coloured circle.
- **Mobbin:** Instagram and Lapse (a "New" group above time-grouped activity, avatars, the dot), Life Reset (reaction chips), Mesh (day groups).
- **Where:** `native/src/app/activity.tsx` (rewritten), `native/src/lib/activity-text.ts` (`activityIcon`, `groupActivity`, kudos wording).
- **Verified:** 4 tests in `activity-text.test.ts` (cheer wording from each side, an icon per kind, New first then by day, no New section when nothing is unseen).

## V2-33 Cheers between roommates (native and backend, 2.1)
- **What:** tap a roommate in the Home roommate row, or the "Cheer" chip in the feed, to open a sheet with six cheers (🙌 👏 🔥 💪 ❤️ 🎉). Sending shows "Sent 🙌 to Priya!", adds a line to the house feed ("Rahul sent Priya a 🙌", seen by everyone) and sends Priya one push ("A cheer for you 🙌, Rahul sent you a 🙌. The house noticed."), which opens the feed. One cheer per sender and recipient every 10 minutes, so it stays warm rather than a stream of pings. It is positive only, with no counts and no ranking.
- **Mobbin:** Finch's "Send kudos" with its "Sent kudos to Alex!" confirmation, Alma's emoji grid for reacting to a friend, and Life Reset's emoji reaction row.
- **Backend:** `supabase/migrations/20261001000019_kudos.sql` adds `send_kudos(p_to, p_emoji)`. It needs no new table: a cheer is an activity row (kind `kudos`) plus one notification. It checks the emoji is on the fixed list, the recipient is an active roommate, and the rate limit. Push copy: `kudos` added to `supabase/functions/_shared/domain/nudge.ts` (both tones, with tests) and to the deep-link map in `tick/push.ts`.
- **Where:** `native/src/app/kudos.tsx` (new), `ui/roommates-card.tsx` (tap to cheer), `app/activity.tsx`, `lib/activity-text.ts`, `_layout.tsx`.
- **Verified:** the push copy test and all 135 edge-domain tests pass; the feed wording is tested (V2-32).
- **Not applied and not tested.** The migration has not been run against any database. Try it on staging before `db push`, and redeploy the `tick` function so it can send the new push kind.

## V2-34 Skeleton loading (native, 2.1)
- **What:** on the first load after signing in the tabs used to be a blank screen. They now show the shape of the Home in pulsing grey (header, streak card, roommate row, three task rows), which becomes still if the phone has reduced motion on. The same `Bone` block can be reused for other screens.
- **Mobbin:** Careem, Snapchat and Grab loading screens.
- **Where:** `native/src/ui/skeleton.tsx` (new), `(tabs)/_layout.tsx`.
- **Verified:** typecheck and bundle. Not seen on a device.

## Researched for later (not built)
These came out of the same Mobbin pass for 2.1 and need more than a day each, so they are listed rather than rushed.
- **House board:** a shared home for notes, rules and upcoming bills or events, in the tile style of Abode and Canopi, with Rodeo's calendar. Needs new tables and screens.
- **Real dark theme:** the app is locked to light mode; a proper dark palette across every screen (as Lapse and Life Reset do).
- **Home-screen widgets** (Runbuds, Duolingo): need a development build.
- **Rotating chore ownership view and "who has it this week"** as a compact Home widget, and richer swipe settings (Notion Mail lets people choose what each swipe does).

## Planned or deferred
- **V2-08 Widgets:** needs a custom dev build and a device to verify, not Expo Go.
- **V2-10 Expense splitting:** deferred by decision (needs a new RPC and screens).

---

## Supporting changes (not from Mobbin)
- Missing modules added so the production build passes: `motion` package, `src/lib/motion.ts`, `src/lib/haptics.ts`, and `LazyMotion` in `src/main.tsx` (needed by Profile's animated ring).
- Illustration backgrounds removed: the 12 onboarding illustrations the native app uses (`native/assets/images/onboarding`) had tinted opaque backgrounds that showed as faint rectangles on coloured surfaces. They are now transparent PNGs (flood-fill from the edges with feathering). The streak plant images were already transparent but had a pale white-matted rim that showed as a halo on the dark streak card, so they were defringed (edge pixels recoloured from the plant's own colours, faintest rim trimmed, saved as lossless WebP). Originals are backed up outside the repo. The night-sky house keeps its dark sky disc because it is part of the scene.
- `native/vitest.config.ts` so native pure-logic tests run via the root vitest without editing the web config.

## Verification summary
- Web: build passes, 130 frontend tests pass.
- Native: `tsc` clean, Android bundle builds, `expo-doctor` 21/21, native logic tests 39/39 (recap, week strips, plant, pantry health, achievements, plan, why, first week, tab-bar shrink, up-for-grabs and activity); web and edge-function tests 265/265 (the `tests/db` suites need a live Supabase and were not run).
- Pre-existing and unrelated: `tests/db/*` need a live Supabase.
- Not verified: any native screen on a device; no user testing or metrics.

## Git and deploy state
- Committed: `RingProgress`, web streak-goal helpers.
- Uncommitted on purpose: `Home.tsx`, `home.css` and the celebration API change (they sit beside unfinished work), plus all native changes and these docs.
- Backend changes, none applied or deployed: the new migrations `20261001000018_account_deletion.sql` and `20261001000019_kudos.sql` (both untested, apply to staging first), and edits to `supabase/functions/tick/push.ts`, `tick/index.ts`, `tick/push.test.ts`, `_shared/domain/nudge.ts` and `nudge.test.ts` (Expo push sender and the cheer push; the `tick` function must be redeployed). The earlier v2 features needed no database changes. The pantry migrations are separate and were not pushed.
- Setup still needed before the native app works end to end: a development build, an EAS project id for push, universal-link files on the web domain for invite links, and App Store Connect / Play products plus RevenueCat for purchases.
- Production deploy: run by the owner; not confirmed in this log.
