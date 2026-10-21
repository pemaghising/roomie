# Roomie native v2 — progress

Plan: `../docs/superpowers/plans/2026-10-21-roomie-native-v2.md` · Spec: `../docs/superpowers/specs/2026-10-21-roomie-native-v2-design.md`
Branch: `feat/native-v2`. Detailed ledger: `../.superpowers/sdd/2026-10-21-roomie-native-v2/progress.md`.

**Resume here:** Task 6 onward, no phase stops (Pema 2026-10-22): build through to a working app.

| # | Task | Status |
|---|---|---|
| 1 | Identity, EAS profiles, cleanup | done |
| 2 | Reset roomie-dev + demo seed | done |
| 3 | Tokens + fonts | done |
| 4 | Motion, haptics, logic tests | done |
| 5 | v2 component library + kit route | done |
| 6 | Auth + onboarding · phase review | done |
| 7 | Home + nudges · phase review | done |
| 8 | Chores + calendar · phase review | done |
| 9 | Pantry + icons · phase review | done |
| 10 | Profile, settings, frameless screens · phase review | done |
| 11 | Motion + scroll pass · phase review | done |
| 12 | QA sweep · phase review | done |
| 13 | Packages (APK now, IPA later) | APK done · IPA waits for Pema's Apple Developer account |

## Motion values (snappy, per Pema 2026-10-22)

Timing only; layout always comes from Final app v2. All in `src/ui/motion-config.ts`.

| Moment | Value |
|---|---|
| Press | scale 0.96, spring damping 22 / stiffness 520 / mass 0.6 |
| List entrance | 200 ms rise of 10 pt, 30 ms stagger capped at 8; Reduce Motion = 150 ms fade |
| Tab pill, layout moves | spring 26 / 480 / 0.7 |
| Sheets | spring 28 / 420 / 0.8 over a 180 ms blurred scrim; drag down past 120 pt or flick to close |
| Pops (check, plant stage, day pill, menu) | spring 16 / 420 / 0.6 |
| Done row | fades to 55 % over 200 ms |
| Streak number | counts up over 320 ms, ease-out cubic |
| Title bar | fades in between 24 and 64 pt of scroll |

## Where things stand (2026-10-22 morning)

- Android APK (preview): https://expo.dev/artifacts/eas/7iqB4QPGm9v_opcK2md0k-AVq9K_HIEB9LVs4QVlqhM.apk
- iPhone: Expo Go on the same Wi-Fi as the dev PC, `exp://192.168.1.90:8081` (tunnel is blocked by the office network).
- Waiting on Pema: a new SUPABASE_ACCESS_TOKEN in .env.local to redeploy `tick` (the live build is still Monday-first;
  migrations 26–27 keep it from doubling chores), the Vault SQL for tick_url / cron_secret, an Apple Developer account for the IPA,
  and the Expo Go device pass (four usability scenarios, Reduce Motion on and off).

## Notes
- App id `com.pemaghising.roomie`. Icon and splash from the brand mascot (`assets/brand/`).
- expo-doctor: all checks pass except the config-schema check, which needs exp.host (unreachable from this machine's network).
- Dev database reset 2026-10-21 and seeded (Parijat Chowk Flat, streak 23). Re-seed: `npx vite-node scripts/seed-demo.ts <email>` from roomie-app.
- No weekly plan review and no chore swap (Pema, 2026-10-21): plans lock automatically.
- **Waiting on Pema (before Fri 2026-10-23 18:00 NPT):** new SUPABASE_ACCESS_TOKEN in .env.local (to redeploy `tick`), and the two Vault SQL lines.
- Component kit: run the app and open `/kit` (dev builds only).
