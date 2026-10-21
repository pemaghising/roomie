<div align="center">

<img src=".github/assets/logo-roomie.webp#gh-light-mode-only" alt="Roomie" height="72">
<img src=".github/assets/logo-roomie-dark.webp#gh-dark-mode-only" alt="Roomie" height="72">

**Fair chores and a shared pantry for roommates. No nagging.**

[**Try the app**](https://roomie-app-v2-delta.vercel.app) · [**Website**](https://roomie-site-sigma.vercel.app) · [**Case study**](https://roomie-case-study.vercel.app)

![Expo](https://img.shields.io/badge/Expo-SDK%2057-1F1B3A?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-1F1B3A?style=flat-square&logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-1F1B3A?style=flat-square&logo=supabase&logoColor=3ECF8E)
![Next.js](https://img.shields.io/badge/Next.js-16-1F1B3A?style=flat-square&logo=nextdotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-1F1B3A?style=flat-square&logo=vercel&logoColor=white)

<img src=".github/assets/site-hero.webp" alt="The Roomie website: Fair chores. Zero nagging." width="100%">

</div>

## About

**Roomie is a chore splitting and shared pantry app for roommates, flatmates and shared houses.** It started from one research finding: in a shared flat, the chore isn't the hard part. Asking is. Roomie does the asking. It balances chores by effort instead of count, keeps heavy jobs off your busy days, sends missed chores to a shared pool with no name attached, tracks what the house is running low on, and lets the whole flat grow one daily streak together.

It is a UX case study and product design project by **Pema Ghising**, taken all the way to a working phone app. Everything lives in this one repo:

| | What it is | Live |
| --- | --- | --- |
| [`apps/mobile`](apps/mobile) | The Roomie app for iPhone and Android (Expo, React Native). Also runs on the web inside a phone frame | [roomie-app-v2-delta.vercel.app](https://roomie-app-v2-delta.vercel.app) · Expo Go |
| [`supabase`](supabase) | The backend: Postgres with row-level security, every write as an RPC, the scheduled `tick` function, and the chore logic shared with the app | Supabase |
| [`apps/site`](apps/site) | The marketing website: features, a week in a shared flat, the pantry | [roomie-site-sigma.vercel.app](https://roomie-site-sigma.vercel.app) |
| [`apps/case-study`](apps/case-study) | The design-thinking case study, from research to reflection | [roomie-case-study.vercel.app](https://roomie-case-study.vercel.app) |
| [`research`](research) | The written case study, decisions log, evidence map and research sources | |

## How Roomie works

**Chores are split by effort.** Every chore is Light, Medium or Heavy. Each week Roomie hands chores out one at a time, each to whoever is furthest below their fair share, so everyone does the same amount of work, not the same number of chores. Nobody sees points or a leaderboard.

**Busy days are protected.** A Heavy chore never lands on a day you marked busy.

**Missed chores never become a fight.** A missed chore moves to a shared pool that shows the chore, never who missed it. Anyone can claim it.

**The pantry runs itself.** Flag something low or out, tap "I'll get it", and the house can see who's on it. Personal items can be marked ask first, and the owner approves from Activity.

**One house streak, counted in days.** A day counts when every chore due that day is done. The house plant grows at 3, 7, 14 and 30 days, droops when a chore slips, and recovers if the house catches up in time.

<img src=".github/assets/case-study-rules.webp" alt="Case study: how chores get split, as a weekly planning flowchart" width="100%">

## Screens

<table>
  <tr>
    <td width="50%"><img src=".github/assets/site-features.webp" alt="Website: the features tour"></td>
    <td width="50%"><img src=".github/assets/site-week.webp" alt="Website: one week at Parijat Chowk Flat"></td>
  </tr>
  <tr>
    <td align="center"><sub>Features tour: one feature per screen</sub></td>
    <td align="center"><sub>How it works: a week told phone by phone</sub></td>
  </tr>
  <tr>
    <td colspan="2"><img src=".github/assets/case-study-hero.webp" alt="Case study: Fair isn't equal"></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><sub>The case study: Empathize, Define, Ideate, Prototype, Test, Reflect</sub></td>
  </tr>
</table>

## Repository

```
.
├── apps/
│   ├── mobile/        Roomie app: Expo SDK 57, Expo Router, Reanimated, TanStack Query
│   ├── site/          Marketing website (Next.js, GSAP, Lenis), static export
│   └── case-study/    Case study website (Next.js)
├── supabase/
│   ├── migrations/    Schema, row-level security and every RPC
│   ├── functions/     tick (scheduled) and _shared/domain, the chore logic the app imports
│   └── seed/          Demo household
├── tests/db/          Database tests: RLS, RPCs and the tick, against a dev project
├── research/          case-study.md, decisions-log.md, evidence-map.md, sources/
└── docs/              Specs, plans and design notes
```

## Run it locally

You need Node.js 20 or later.

```bash
# The app (opens in Expo Go, an iOS simulator, Android or the browser)
cd apps/mobile
npm install
npx expo start

# The backend tests (database tests run when SUPABASE_TEST_* is set in .env.local)
npm install
npm test

# The websites
cd apps/site && npm install && npm run dev
cd apps/case-study && npm install && npm run dev
```

The app reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `apps/mobile/.env` (never committed).

## Ship it

| What | Command |
| --- | --- |
| Database | `npx supabase db push` |
| App on phones (Expo Go / installed builds) | `cd apps/mobile && npx eas-cli update --branch preview` |
| App on the web (phone frame on desktop) | `bash apps/mobile/scripts/deploy-web.sh` |
| Android test build | `cd apps/mobile && npx eas-cli build --profile preview --platform android` |
| Websites | `npx vercel deploy --prod` from `apps/site` or `apps/case-study` |

## Design

- **Type:** Fraunces for headlines, Geist for everything else.
- **Colour:** lilac mist backgrounds, roof violet `#7A5FD6` for actions, lavender off-white `#FCFBFF` instead of pure white.
- **Tone:** calm, never alarmist. No points, no leaderboards, no all caps.
- **Source of truth:** the Figma file "Final app v2" and its v2 design system; the app's tokens map one to one.

## Author

**Pema Ghising**, Lead Graphic Designer at Leapfrog Technology, Kathmandu.
[pemaghising.com.np](https://pemaghising.com.np)
