# Roomie native v2: phone prototype design

Date: 2026-10-21 · Owner: Pema Ghising

## Intent

Pema wants a working Roomie app on a real iPhone, matching the Final app v2 design in Figma, so that the usability test planned in the case study can run on a real product and not on a click-through. It should feel premium: considered motion, scroll behaviour and timing on every screen.

The Expo app in `native/` already works end to end against Supabase: email-code sign-in, onboarding, tabs, about 20 sheets, roughly 37 RPCs and realtime. It is built on the earlier design (Inter and Playfair, the old `kit.tsx` tokens, the template icon), so this project is a visual and motion rebuild on a working data layer, not a rewrite.

## Goals

1. Every screen matches its Final app v2 frame (Figma file `54WDfpLvnPKcWRnswVdOSd`, page `834:4432`, 69 frames) in layout, type, colour, spacing and copy.
2. The app runs on Pema's iPhone through **Expo Go**, from a QR code, against a fresh dev database.
3. Motion is premium and consistent: one motion system (springs, durations and stagger) used everywhere, with haptics on meaningful moments, and Reduce Motion respected.
4. The project is ready for packages: `eas.json` with a preview APK profile now, and an iOS profile ready for TestFlight once Pema has an Apple Developer account.
5. A progress ledger lets any session resume exactly where the last one stopped.

## Non-goals

- Google and Apple sign-in. The buttons stay as designed but show "Coming soon".
- Billing. The paywall stays a placeholder.
- The web PWA in `src/`, dark mode, barcode scanning, item photos, quantities.
- Offline write queueing. The offline banner stays.

## Anti-goals (would make it a failure even if it works)

- Changing any locked feature: effort Light / Medium / Heavy, busy days, the shared pool, nudge tone, pantry boundary tags, restock.
- Showing points or scores anywhere. Balance is only "On track" / "Catching up".
- Pure white (`#FFFFFF`); use `#FCFBFF`. All-caps labels. Decorative AI-slop ornaments such as pulsing "live" dots.
- Monday-first weeks. Sunday is day 0 everywhere, in UI and logic.
- Motion that slows the user down: no animation longer than about 450 ms on a path the user repeats.

## Constraints

- **Expo Go compatibility.** Only modules bundled in Expo Go for SDK 57 can be used, so no custom native code until a dev build exists. Check every new dependency against Expo Go before adding it.
- **Fonts:** Fraunces (72pt Soft optical size, SemiBold and SemiBold Italic) for titles; Geist (Light, Regular, Medium, SemiBold) for everything else. Load them with `expo-font`.
- **Tokens:** the single source is the Figma variables `v2 · Primitives`, `v2 · Color` and `v2 · Layout`, plus the `v2/` text and effect styles. Port them into one `native/src/ui/tokens.ts`, and retire the duplicate `theme.ts` Colors/Brand and the `kit.tsx` palette.
- **Components:** mirror the Figma library on page `07 · 🧩 Components` (`v2 · Screen building blocks` and `v2 · Core components`), one RN component per Figma component, with the same names and variants.
- **Database reset (approved by Pema):** wipe the `roomie-dev` Supabase project and rebuild it from the migrations, which are now Sunday-first. Use the credentials already in `roomie-app/.env.local`. Never print any part of a secret. Read values with `grep '^KEY=' .env.local | cut -d= -f2- | tr -d '\r'`. The TLS chain on this network needs `NODE_EXTRA_CA_CERTS` pointing at the Cloudflare gateway root certificate.
- **Platform:** iPhone first. Respect the safe areas and the Dynamic Island, and support iOS swipe-back.

## Decided

- **Base:** keep the `native/` routes, the data layer (`state.ts`, `actions.ts`, RPCs) and the logic tests. Restyle and re-compose each screen against Figma.
- **Sign-in:** email code only (Supabase OTP). The code screen gets resend and a wrong-code state, matching frames 05 and 05b.
- **Identifiers:** bundle id and package `com.pemaghising.roomie`; the app icon is the Roomie app icon from the brand book.
- **Motion system** (Reanimated 4), with names for the defaults:
  - `press`: scale to 0.97, spring with damping 18 and stiffness 320.
  - `enter`: fade plus 12 px rise over 260 ms; lists stagger 40 ms per item, capped at 8 items.
  - `sheet`: spring with damping 22, plus a background blur and scrim like the Figma sheets.
  - `tab`: the active pill slides between tabs as a shared layout animation.
  - `celebrate`: the streak number counts up, the plant grows to its milestone stage, and light confetti plays only on "All done today" and on milestones.
  - Haptics: light impact on press-to-complete, success on all done, selection on segmented and day pickers.
  - With Reduce Motion on, everything becomes a simple fade.
- **Scroll:** large-title collapse on tab screens; the nav fades at the bottom the way the Figma nav fade does; pull-to-refresh on Home and Chores.
- **References:** Figma frames are the source of truth for layout. Mobbin (Tiimo, Things, Revolut, Duolingo) is a reference for motion timing only, never for layout or colour.

## Process

The work goes in phases, each ending with a check against the Figma screenshots:

0. Setup: EAS config, ids, icon, fonts, tokens, dead template code removed, ledger created.
1. v2 components in RN.
2. Auth and onboarding (01–13, J1–J4).
3. Home (H0–H8, W-states).
4. Chores and calendar (C1–C4).
5. Pantry (P1–P3).
6. Profile and settings (R1–R15).
7. Motion pass.
8. Device QA in Expo Go, plus an Expo web screenshot sweep at phone widths.
9. Builds (APK now, IPA when Apple is ready).

Ledger: `native/PROGRESS.md`. It replaces the stale `migration-progress.md`. Every phase records what's done, what's next, and any open questions. To resume, Pema says "continue".

Skills used along the way:
- `superpowers:writing-plans` for the plan.
- `figma-use` for references.
- `mobile-app-ui-design` and `impeccable` for craft and audit passes.
- `copywriting` for any new microcopy.
- Mobbin search for motion references.

## Answers (2026-10-21)

**Decided by Pema:**
- **Screens with no Figma frame** (kudos, recap, activity, request sent): restyle them in the v2 language from the same components, and add their designs to Figma afterwards. The paywall is hidden.
- **Not Roomie features (removed, 2026-10-21):** the Sunday plan-review step and chore swaps. Plans are generated already locked (`plan_mode = 'auto'`, migration 21). The `plan` and `swap` routes and every entry point to them go. The activity feed stays.
- **Testing:** on Pema's iPhone, with a seed script for a demo household (Pema/Ramesh, Priya, Aman, chores, pantry, a few weeks of history). Creating a fresh home still works.
- **Review:** per phase. At the end of each phase, show screenshots plus an Expo Go QR code, then continue.

**Builder's calls:**
- New data that a frame needs, such as pantry item icons, comes from new migrations.
- The nav follows Figma: four tabs plus the gradient + button that opens the Add menu. Calendar opens from Chores (C2, C3).
- J2 QR join is in scope (expo-camera works in Expo Go).
- "01 · Welcome" is canonical; the Fraunces variation frame is an exploration.
- Nudges and pantry alerts are local notifications in Expo Go. Remote push waits for the dev build.
- The reset covers the database, edge functions, the OTP email template (a code, not a link) and scheduled jobs. Confirm `native/.env` targets the same project first.
- The Fraunces 72pt Soft static instances are generated from the variable font with fontTools.

## Left to the builder

- Component APIs and file layout under `native/src/ui/`.
- Exact spring values within the motion system's character.
- How to reproduce glass surfaces in Expo Go: expo-blur if bundled, otherwise a translucent fill plus a hairline.
- How screenshot comparison against Figma is automated.
