# Roomie Native — Migration Progress

Web app: `C:\Leapfrog\Bootcamp\roomie-app` (React + Vite SPA, Supabase backend)
Native app: `C:\Leapfrog\Bootcamp\roomie-app\native\` (Expo SDK 57, Expo Router, React 19)

## Backend decision

**Keep Supabase deployed** — the native app is a direct Supabase client, same as the web app.
No RSC, no server actions, no ORM on the client (it was always an SPA talking to Supabase).
Migrations 000011-000014 (pantry) will be shared between web and native.

## Third-party services

| Service | Web | Native | Action |
|---|---|---|---|
| Supabase JS SDK | ✓ | ✓ | Reuse — works on native unchanged |
| Auth: email OTP | ✓ | ✓ | Reuse — works in Expo Go |
| Auth: Google OAuth | ✓ | later | Needs dev build; defer to phase 5 |
| Push: VAPID web push | ✓ | replace | expo-notifications + Expo Push Service |
| Service worker | ✓ | skip | No SW on native |
| localStorage (auth token) | ✓ | replace | expo-secure-store (done) |
| TanStack Query + IndexedDB | ✓ | replace | TanStack Query + AsyncStorage |

## Shared code (reused unchanged)

- `supabase/` — all migrations, Edge Functions, domain logic
- `supabase/functions/_shared/domain/` — pure TS: rotation, streak, copy, pantry
- Type definitions (copy from web to native/src/lib/types.ts)
- All RPCs and get_state shape

## Screen worklist

Status: ✅ done | 🔨 in-progress | ⬜ todo

### Phase 1 — Foundation (scaffold + auth + data)
- [x] ✅ Scaffold Expo app (SDK 57, Expo Router, NativeTabs)
- [x] ✅ 4-tab shell: Home · Chores · Pantry · Profile
- [x] ✅ Supabase client with expo-secure-store
- [x] ✅ Design tokens (Roomie brand colors)
- [x] ✅ TanStack Query + get_state + optimistic useAction + realtime (src/lib/state.ts)
- [x] ✅ Auth (email OTP), session in expo-sqlite localStorage, root gate redirects (src/app/_layout.tsx)
- [x] ✅ Shared domain imported via @domain alias + metro watchFolders (no copies)
- [x] ✅ Auth + onboarding screens, Home/Chores/Profile on real data, add-chore + busy-days sheets, celebration
- [ ] ⬜ Not ported yet: offline mutation persistence, Activity, Plan review/swaps, household settings, leave household, Google sign-in, push

### Phase 2 — Auth + Onboarding (first impression)

| Screen | Web file | Native route | Bucket | Status |
|---|---|---|---|---|
| Welcome | `features/auth/Welcome.tsx` | `app/welcome.tsx` | nativize-now | ⬜ |
| Contact entry | `features/auth/ContactEntry.tsx` | `app/auth/contact.tsx` | nativize-now | ⬜ |
| Verify OTP | `features/auth/VerifyCode.tsx` | `app/auth/verify.tsx` | nativize-now | ⬜ |
| Start step | `features/onboarding/StartStep.tsx` | `app/onboarding/start.tsx` | nativize-now | ⬜ |
| Profile step | `features/onboarding/ProfileStep.tsx` | `app/onboarding/profile.tsx` | nativize-now | ⬜ |
| Home name step | `features/onboarding/HomeNameStep.tsx` | `app/onboarding/home-name.tsx` | nativize-now | ⬜ |
| Chores step | `features/onboarding/ChoresStep.tsx` | `app/onboarding/chores.tsx` | nativize-now | ⬜ |
| Busy step | `features/onboarding/BusyStep.tsx` | `app/onboarding/busy.tsx` | nativize-now | ⬜ |
| Invite step | `features/onboarding/InviteStep.tsx` | `app/onboarding/invite.tsx` | nativize-now | ⬜ |
| Join step | `features/onboarding/JoinStep.tsx` | `app/onboarding/join.tsx` | nativize-now | ⬜ |

### Phase 3 — Core screens (Home + Chores)

| Screen | Web file | Native route | Bucket | Status |
|---|---|---|---|---|
| Home | `features/home/Home.tsx` | `app/index.tsx` | nativize-now | 🔨 shell done |
| Activity | `features/activity/Activity.tsx` | `app/activity.tsx` | nativize-now | ⬜ |
| Chores | `features/chores/Chores.tsx` | `app/chores.tsx` | nativize-now | 🔨 shell done |
| Celebration | `features/chores/Celebration.tsx` | native overlay | nativize-now | ⬜ |
| Plan review | `features/plan/PlanReview.tsx` | `app/plan.tsx` | nativize-later | ⬜ |
| Swap sheet | `features/plan/SwapSheet.tsx` | sheet in plan | nativize-later | ⬜ |

### Phase 4 — Pantry (native-first)

| Screen | Native route | Bucket | Status |
|---|---|---|---|
| Pantry shell (3 tabs) | `app/pantry.tsx` | native-new | 🔨 shell done |
| Item actions sheet | sheet in pantry | native-new | ⬜ |
| Add item sheet | sheet in pantry | native-new | ⬜ |
| Restock sheet + Request Sent | sheet in pantry | native-new | ⬜ |
| Chores: up-for-grabs restock rows | in chores | native-new | ⬜ |

### Phase 5 — Profile + notifications

| Screen | Web file | Native route | Bucket | Status |
|---|---|---|---|---|
| Profile | `features/profile/Profile.tsx` | `app/profile.tsx` | nativize-now | 🔨 shell done |
| Household settings | `features/profile/HouseholdSettings.tsx` | `app/profile/household.tsx` | nativize-later | ⬜ |
| Push token registration | (web: SW + VAPID) | expo-notifications | replace | ⬜ |
| Google OAuth | `features/auth/` | needs dev build | defer | ⬜ |

## Native-first decisions

- **Navigation**: NativeTabs (SF Symbols on iOS, Material on Android) + Stack per tab
- **Lists**: FlatList/FlashList for long lists (not .map())
- **Sheets**: `presentation: "formSheet"` via Expo Router
- **Animation**: Reanimated 4.5 for swipe-to-complete, celebration
- **Haptics**: expo-haptics (ImpactFeedbackStyle, not navigator.vibrate)
- **Gestures**: react-native-gesture-handler for chore swipe
- **Styling**: StyleSheet.create with Roomie design tokens (src/constants/theme.ts)
- **Auth storage**: expo-secure-store (not localStorage)
