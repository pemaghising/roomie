import { expect, test } from 'vitest';
import { achievements } from './achievements';
import type { AppState } from './types';

const row = (id: string, user: string, status: string, claimed_by: string | null = null) =>
  ({ id, plan_id: 'p', chore_id: 'c', user_id: user, day: '2026-10-07', effort: 1, status, claimed_by, done_at: null, reason: null });

const state = (over: { best?: number; assignments?: unknown[]; restocks?: unknown[] } = {}) => ({
  today: '2026-10-07',
  streak: { current: 0, best: over.best ?? 0, last_settled_day: null },
  assignments: over.assignments ?? [],
  restocks: over.restocks ?? [],
}) as unknown as AppState;

const earned = (s: AppState) => achievements(s, 'me').filter((a) => a.earned).map((a) => a.id);

test('a new profile has earned nothing, and every locked badge says how to earn it', () => {
  const all = achievements(state(), 'me');
  expect(all.every((a) => !a.earned && a.hint.length > 0)).toBe(true);
});

test('streak badges are earned from the best streak, so they stay earned after a break', () => {
  expect(earned(state({ best: 3 }))).toEqual(['sprout']);
  expect(earned(state({ best: 14 }))).toEqual(['sprout', 'week', 'fortnight']);
});

test('clean sweep needs at least one chore today and all of them done', () => {
  expect(earned(state({ assignments: [] }))).toEqual([]);
  expect(earned(state({ assignments: [row('1', 'me', 'done'), row('2', 'me', 'todo')] }))).toEqual([]);
  expect(earned(state({ assignments: [row('1', 'me', 'done'), row('2', 'me', 'done')] }))).toEqual(['sweep']);
});

test('team player is covering a roommate chore, not finishing your own', () => {
  expect(earned(state({ assignments: [row('1', 'pri', 'done', 'me')] }))).toContain('team');
  expect(earned(state({ assignments: [row('1', 'me', 'done', 'me')] }))).not.toContain('team');
});

test('earned badges come first, locked ones after', () => {
  const ids = achievements(state({ best: 7 }), 'me').map((a) => a.id);
  expect(ids.slice(0, 2)).toEqual(['sprout', 'week']);
});
