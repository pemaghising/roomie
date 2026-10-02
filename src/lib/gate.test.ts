import { expect, test } from 'vitest';
import { gateFor } from './gate';
import type { AppState } from './types';

const session = { user: { id: 'u' } } as never;
const st = (over: Partial<AppState>): AppState => ({
  profile: { id: 'u', name: 'Aarav', color: '#ffedd5', nudge_style: 'motivate', activity_seen_at: '' },
  household: { id: 'h', name: 'Flat', invite_code: 'ABC123', plan_mode: 'review', tz: 'Asia/Kathmandu', day_ends_at: '22:00:00' },
  members: [], chores: [], plans: [], assignments: [], swaps: [], streak: null, balance: 0, activity: [], today: '2026-10-01',
  ...over,
});

test('gates', () => {
  expect(gateFor({ session: null, loading: true }, { isLoading: false })).toBe('loading');
  expect(gateFor({ session: null, loading: false }, { isLoading: false })).toBe('signed_out');
  expect(gateFor({ session, loading: false }, { isLoading: true })).toBe('loading');
  expect(gateFor({ session, loading: false }, { isLoading: false, error: new Error('x') })).toBe('error');
  expect(gateFor({ session, loading: false }, { isLoading: false, data: st({ profile: { ...st({}).profile, name: '' } }) })).toBe('needs_profile');
  expect(gateFor({ session, loading: false }, { isLoading: false, data: st({ household: null }) })).toBe('needs_household');
  expect(gateFor({ session, loading: false }, { isLoading: false, data: st({}) })).toBe('ready');
});
