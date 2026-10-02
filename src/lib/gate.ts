import type { Session } from '@supabase/supabase-js';
import type { AppState } from './types';

export type Gate = 'loading' | 'error' | 'signed_out' | 'needs_profile' | 'needs_household' | 'ready';

export const HOME_OF: Record<Exclude<Gate, 'loading' | 'error'>, string> = {
  signed_out: '/welcome',
  needs_profile: '/onboarding/profile',
  needs_household: '/onboarding/start',
  ready: '/',
};

export function gateFor(
  auth: { session: Session | null; loading: boolean },
  state: { data?: AppState; isLoading: boolean; error?: unknown },
): Gate {
  if (auth.loading) return 'loading';
  if (!auth.session) return 'signed_out';
  if (!state.data) return state.error ? 'error' : 'loading';
  if (!state.data.profile?.name) return 'needs_profile';
  if (!state.data.household) return 'needs_household';
  return 'ready';
}

/**
 * Has the state been confirmed by the server since this page load? Data restored from the persisted cache may be
 * from an earlier session (e.g. still "needs_household" from onboarding), so it must not drive a redirect away
 * from a deep link until the first fetch settles. Offline (paused) or failed fetches fall back to the cache.
 */
export function confirmedSince(
  state: { dataUpdatedAt?: number; errorUpdatedAt?: number; fetchStatus?: string },
  since: number,
): boolean {
  return (state.dataUpdatedAt ?? 0) >= since || (state.errorUpdatedAt ?? 0) >= since || state.fetchStatus === 'paused';
}

/** What a route guard does: render, wait, or redirect. Only a confirmed gate may redirect. */
export function guardAction(gate: Gate, allow: Gate[], confirmed: boolean): 'render' | 'wait' | 'redirect' {
  if (gate === 'loading') return 'wait';
  if (allow.includes(gate)) return 'render';
  if (gate !== 'signed_out' && gate !== 'error' && !confirmed) return 'wait'; // signed_out comes from auth, not the cache
  return 'redirect';
}
