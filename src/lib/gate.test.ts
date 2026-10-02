import { expect, test } from 'vitest';
import { confirmedSince, gateFor, guardAction } from './gate';
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

test('a stale persisted cache never bounces a deep link: wait for the first fetch of this page load', () => {
  const loadedAt = 1_000;
  // cache restored from onboarding still says needs_household; the refetch is in flight
  const restoring = { dataUpdatedAt: 500, fetchStatus: 'fetching' };
  expect(confirmedSince(restoring, loadedAt)).toBe(false);
  expect(guardAction('needs_household', ['ready'], confirmedSince(restoring, loadedAt))).toBe('wait');
  // once the server answers, the gate is trusted again
  expect(guardAction('ready', ['ready'], confirmedSince({ dataUpdatedAt: 1_200, fetchStatus: 'idle' }, loadedAt))).toBe('render');
  expect(guardAction('needs_household', ['ready'], confirmedSince({ dataUpdatedAt: 1_200, fetchStatus: 'idle' }, loadedAt))).toBe('redirect');
  // a stale cache that already allows the route renders straight away (offline-first)
  expect(guardAction('ready', ['ready'], false)).toBe('render');
  // offline (paused) or a failed fetch falls back to the cache rather than spinning forever
  expect(confirmedSince({ dataUpdatedAt: 500, fetchStatus: 'paused' }, loadedAt)).toBe(true);
  expect(confirmedSince({ dataUpdatedAt: 500, errorUpdatedAt: 1_100, fetchStatus: 'idle' }, loadedAt)).toBe(true);
  // signed out comes from auth, not the cache: redirect immediately
  expect(guardAction('signed_out', ['ready'], false)).toBe('redirect');
  expect(guardAction('loading', ['ready'], true)).toBe('wait');
});
