import { expect, test } from 'vitest';
import { firstWeek } from './first-week';
import type { AppState } from './types';

const row = (id: string, user: string, day: string, status = 'todo') =>
  ({ id, plan_id: 'p', chore_id: 'c', user_id: user, day, effort: 1, status, claimed_by: null, done_at: null, reason: null });

const state = (assignments: unknown[], chores = 3) => ({
  today: '2026-10-07', // Wednesday; the week is 4 to 10 October
  chores: Array.from({ length: chores }, (_, i) => ({ id: `c${i}`, active: i !== 2 })),
  members: [{ user_id: 'me' }, { user_id: 'pri' }],
  assignments,
}) as unknown as AppState;

test('counts the active chores, the roommates and my turns this week', () => {
  const s = state([row('1', 'me', '2026-10-05'), row('2', 'me', '2026-10-10'), row('3', 'pri', '2026-10-06'), row('4', 'me', '2026-10-11')]);
  expect(firstWeek(s, 'me')).toEqual({ chores: 2, roommates: 2, myTurns: 2, planned: true });
});

test('before the first plan exists it says so instead of showing zero turns as a plan', () => {
  expect(firstWeek(state([]), 'me')).toEqual({ chores: 2, roommates: 2, myTurns: 0, planned: false });
});

test('expired turns do not count', () => {
  expect(firstWeek(state([row('1', 'me', '2026-10-05', 'expired')]), 'me').myTurns).toBe(0);
});
