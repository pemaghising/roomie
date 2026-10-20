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
| 6 | Auth + onboarding · phase review | next |
| 7 | Home + nudges · phase review | todo |
| 8 | Chores + calendar · phase review | todo |
| 9 | Pantry + icons · phase review | todo |
| 10 | Profile, settings, frameless screens · phase review | todo |
| 11 | Motion + scroll pass · phase review | todo |
| 12 | QA sweep · phase review | todo |
| 13 | Packages (APK now, IPA later) | todo |

## Notes
- App id `com.pemaghising.roomie`. Icon and splash from the brand mascot (`assets/brand/`).
- expo-doctor: all checks pass except the config-schema check, which needs exp.host (unreachable from this machine's network).
- Dev database reset 2026-10-21 and seeded (Parijat Chowk Flat, streak 23). Re-seed: `npx vite-node scripts/seed-demo.ts <email>` from roomie-app.
- No weekly plan review and no chore swap (Pema, 2026-10-21): plans lock automatically.
- **Waiting on Pema (before Fri 2026-10-23 18:00 NPT):** new SUPABASE_ACCESS_TOKEN in .env.local (to redeploy `tick`), and the two Vault SQL lines.
- Component kit: run the app and open `/kit` (dev builds only).
