# Roomie v2: using UI research to make a chore app people keep using

By pemaghising. Case study draft for the portfolio website. Written for: design and engineering hiring managers and peers reading the Roomie project page.
Status: draft. Items marked **[add]** need a screenshot, a number, or a link before publishing.

## Summary

Roomie is a shared-household app: a fair weekly chore plan, a private effort balance, a household streak and a pantry. Version 1 worked, but the home screen was mostly a task list. For v2 I ran a structured UI research pass on Mobbin, a library of real shipped app screens, to find proven patterns for habit, group and money apps, then ported the best ones into both the web app and a new native Expo app, redesigning every tab. A later audit of what the app could not do found ten more gaps (some of them App Store blockers), which I closed.

I did not use the research to copy visuals. I used it to answer four questions: what makes people open a chore app tomorrow, how a group product gets its second member, what a good "done" moment feels like, and what money apps do that a points app can learn from.

## The problem

- v1 Home showed tasks and a streak number. There was no sense of progress, no goal, and no moment of reward.
- A household app only works with several members, but inviting was a bare 6-character code.
- Nothing made the week shareable, which meant no organic growth.

## Research method

Mobbin searches, grouped by question:

| Question | Searched | Apps studied |
|---|---|---|
| How do chore apps structure work? | chore assignment and completion flows | Greenlight, GoHenry, Superlist |
| How do group money apps handle shared expenses? | adding and splitting expenses | Splitwise, Vipps, KOHO |
| What makes habit apps sticky? | streaks, lesson completion, friend streaks | Duolingo, Finch |
| What do good dashboards show? | tasks and spending with progress | Copilot, Revolut, Cleo, YNAB |
| How do group apps recruit? | invite flows and share sheets | Yope, DICE, Uber Eats |
| How do apps become shareable? | weekly recap and shareable cards | Airbuds, Tonal, MyFitnessPal |
| How do apps monetize? | paywalls and free trials | Sunlitt, Givingli, Linktree |

Mobbin had almost no direct roommate-chore apps, so the research borrowed patterns from adjacent categories rather than from direct competitors. That is a limit: I studied screens, not usage data, so none of this proves the patterns work for Roomie. **[add: link the Mobbin collection]**

## What I found, and what I did with it

| Finding | Source | Decision |
|---|---|---|
| Show per-person progress, not just a count | Copilot budget rings, Revolut arc | Progress ring on each roommate tile with "done/total" |
| A completion moment with stats feels like a reward | Duolingo lesson-complete screen | Celebration now shows day streak and tasks done today |
| A visible goal makes a streak worth protecting | Duolingo streak-goal screen | Optional 3/5/7-day household streak goal |
| Warm empty states beat blank ones | Greenlight | "No tasks today 🎉 Check back tomorrow." |
| Balance should be glanceable | Splitwise | Header chip showing the effort balance |
| An invite should be a shareable object | Yope QR card, Uber Eats add-people | Invite card with QR, link, copy and share sheet |
| A recap card turns usage into marketing | Airbuds, Tonal | Shareable "Our week" image |

### Design decisions I made against the research

1. **No ranking.** Duolingo-style friend streaks and leaderboards are the most copied retention pattern. Roomie shares chores with people who live together, and a leaderboard in a house creates resentment. The recap lists each person's count in fixed member order and crowns no one. The codebase already had a test asserting there is no ranking; I kept it.
2. **Points, not money.** The balance is an effort balance. The chip reads "+3 pts next week", never a currency, and its full sentence is the accessibility label.
3. **No invented data.** Duolingo's friends tab shows per-person streaks. Roomie only tracks one household streak, so I did not fake per-person numbers. Per-member streaks are listed as future work, not shipped.
4. **Personal goal stays on the device.** The streak goal needs no backend, so it is stored locally with a try/catch fallback instead of adding a schema change.

## What shipped

**Web (PWA):** roommate progress rings and the balance chip on Home, a streak goal with a "set a new goal" path, a celebration with stat tiles, and a warmer empty state.

**Native (Expo SDK 57)** is where most of v2 landed. Every tab and the first-run experience were redesigned from Mobbin patterns:

- **Home:** a deep-violet streak hero (the household's growing plant that levitates over a soft shadow, the Monday-to-Sunday strip of kept and missed days, a goal progress bar, a share icon), a "Today, together" card with each roommate's avatar in a progress ring that turns purple when they finish, a daily task list, and banners when a plan or swap needs attention.
- **Moments:** a stat summary when you clear your list, a full-screen takeover at 3, 7, 14, 30, 50 and 100-day streaks, and a shareable "Our week" image.
- **Chores:** a week strip with one day in focus instead of a month calendar over a long list, assignee avatars in the "Everyone" view, an "Up for grabs" section, and an extended add button.
- **Pantry:** stock cards with a three-pip meter and a "Time to restock" banner instead of plain rows.
- **Profile:** a stats hero, derived achievements (locked ones show how to earn them), a roommate row with an invite circle, a Roomie Plus banner and grouped settings.
- **First run:** a swipeable welcome, a shareable invite card with a QR code, and a "your first week is ready" screen.
- **Money:** a Roomie Plus paywall designed from Mobbin, with billing deliberately not wired yet (see limits).

Every feature has an entry with its Mobbin source, files and verification in `docs/V2-UPGRADE.md`.

**Version 2.1** went back to Mobbin with a different question: what does this app still do less well than the best apps in its neighbourhood? The pass looked at gestures, loading states, activity feeds, social reactions and shared household boards. It shipped four things:

- **Swipe to finish:** swiping a chore right finishes it, the way Todoist and Mail apps work, so the most common action is one gesture.
- **A feed that reads like a conversation:** a "New" section first, then days, with avatars, a badge for what happened and relative times.
- **Cheers between roommates:** a positive-only way to say well done, from a tap on a roommate or from the feed. It is the one social feature in the app and it deliberately has no counts, streaks of cheers or leaderboard, so it cannot turn into pressure inside a home.
- **Skeleton loading:** the first screen after sign-in shows the shape of Home in grey instead of a blank page.

Larger ideas from the same research (a shared house board for notes, rules and bills, a real dark theme, home-screen widgets) were written up and left for later rather than rushed.

## The audit that found the missing flows

After the redesign I asked a different question: what can a person not do? I compared every function the backend exposes with the ones the native app actually calls, and walked the routes a new person takes. That found ten gaps that no amount of visual polish would have fixed, and some were store blockers:

| Gap | Why it mattered |
|---|---|
| No account deletion in the app or the backend | The App Store requires it for any app with sign-up |
| No way to leave a household, rename it, remove a roommate or change the invite code | Someone who joined the wrong house was stuck |
| No push registration (the plugin was installed but unused) | No reminders at all, the biggest retention gap |
| Invite links and QR codes opened the website, and the code was lost during sign-up | The growth loop broke at its first step |
| No plan review or swaps, though the server drafts a plan every week | Next week's plan could never be approved, nobody could swap |
| No way to remove a chore, and no "why this chore" explanation | A mistake was permanent, and fairness was invisible |
| No first-win moment, no offline state, an unplanned dark mode, no privacy or about rows | Rough edges a reviewer or a new user hits in the first minutes |

What changed: a push primer and registration (plus an Expo sender in the existing reminder pipeline, reusing its subscription table and extending its safety allow-list instead of adding a new system), household settings, in-app account deletion with a backend function, a `/j/<code>` invite route that survives sign-up, plan review and swap screens ported from the web app, chore management and an explanation sheet, a first-week-ready screen, an offline banner, a light-mode lock, and About rows with a rating prompt after streak milestones.

The audit mattered more than any single screen. A design pass makes an app look finished; the audit is what made it complete.

## How I built it

- Plan first: a written task-by-task implementation plan, then execution with a failing test before code for every piece of logic. **[add: link plan if public]**
- Logic separated from screens: the recap, week states, achievements, pantry grouping, plan copy, "why" text and first-week summary are pure functions with their own tests, so they run without a device.
- An independent review of the first batch found four problems I had missed: a progress ring with about 1.2:1 contrast against a 3:1 target, a streak goal that could never be changed once reached, a balance chip whose meaning lived only in a hover tooltip, and a sheet whose focus jumped on re-render. All four were fixed, with tests where testable.
- Iterating with the owner on the device shaped the final design: a glow circle, a "days until fully grown" caption, a balance chip beside the bell, a progress bar under the task list and a house-total line were each tried and removed because they added clutter. Knowing what to take out was as much of the work as knowing what to add.
- Image clean-up was part of the craft: the 12 illustrations had tinted opaque backgrounds that showed as faint rectangles on coloured cards, and the streak plant had a pale white rim from a white matte. I cut the backgrounds out and defringed the edges, checking each result zoomed on the real card colour.
- A process mistake worth recording: my first commit swept in unrelated staged files. I caught it from the commit output, undid it locally before anything was pushed, and from then on named every file in every commit.

## Verification and honest limits

Verified:
- Native: TypeScript is clean, the Android bundle builds, `expo-doctor` passes 21/21, and 39 logic tests pass.
- Web and edge functions: 265 tests pass, including new tests for the native push sender and the cheer notification.
- Web: the production build passes.

Not verified, and not claimed:
- **No native screen has been run on a device.** All native checks are typecheck, bundle and logic tests. **[add: device screenshots once tried in Expo Go]**
- **Two database functions are untested.** `delete_account` (account deletion) and `send_kudos` (cheers) have not been run against any database; both need a staging run before they go near production.
- **Push needs setup.** Remote push does not work in Expo Go on Android; it needs a development build and an EAS project id, and the updated reminder function has to be deployed.
- **Purchases are not wired.** The paywall is complete, but nobody can subscribe until store products and a billing provider exist. The app says so instead of faking an unlock, and the prices in it are placeholders.
- **Invite links** open the app only through the `roomie://` scheme. The shared `https` link still opens the website until universal links are set up on the domain.
- No user testing and no metrics, so I make no claims about retention or growth.

## What I would do next

1. Run it on real devices, then set up a development build (needed for push, purchases, widgets and universal links)
2. Apply and test the account deletion migration on staging, then deploy the reminder function
3. Wire purchases (store products plus a billing provider)
4. Home-screen widgets for today's chores and the streak
5. Per-member streaks (needs a database change), kept unranked
6. A real dark theme, a terms page and a support address
7. Expense splitting for shared bills, deferred by decision

## Assets to add before publishing

- Before and after screenshots of each tab (Home, Chores, Pantry, Profile), web and native
- The streak hero in a few states (day 0, mid-week, a reached goal) and the milestone takeover
- The paywall and a before and after of the Chores week strip
- The audit table above as a graphic, with the Plan and Household screens it produced
- Two or three annotated Mobbin screens beside the Roomie screen they influenced, and a Mobbin collection link
- A short screen recording: finishing the last chore, the celebration, then the weekly recap share
