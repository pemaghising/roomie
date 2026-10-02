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
