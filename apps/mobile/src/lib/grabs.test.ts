import { expect, test } from 'vitest';
import { grabbable, myRestocks, myTasksOn } from './selectors';
import type { AppState } from './types';

const chore = (id: string, user: string, status: string, day = '2026-10-07', claimed_by: string | null = null) =>
  ({ id, plan_id: 'p', chore_id: 'c', user_id: user, day, effort: 1, status, claimed_by, done_at: null, reason: null });
const restock = (id: string, status: string, claimed_by: string | null = null, created = id) =>
  ({ id, item_id: null, name: id, effort: 1, requested_by: 'pri', claimed_by, status, done_by: null, done_day: null, created_at: created });

const state = (assignments: unknown[], restocks: unknown[]) => ({ today: '2026-10-07', assignments, restocks }) as unknown as AppState;

test('up for grabs is other people\'s missed chores plus restock requests nobody has claimed', () => {
  const s = state(
    [chore('a', 'pri', 'missed'), chore('b', 'me', 'missed'), chore('c', 'pri', 'todo')],
    [restock('milk', 'open'), restock('rice', 'open', 'pri'), restock('eggs', 'done'), restock('oil', 'cancelled')],
  );
  const g = grabbable(s, 'me');
  expect(g.chores.map((a) => a.id)).toEqual(['a']);
  expect(g.restocks.map((r) => r.id)).toEqual(['milk']);
  expect(g.count).toBe(2);
});

test('once a restock is claimed it leaves the pool and becomes one of my tasks', () => {
  const s = state([], [restock('milk', 'open', 'me'), restock('rice', 'open', 'pri')]);
  expect(grabbable(s, 'me').count).toBe(0);
  expect(myRestocks(s, 'me').map((r) => r.id)).toEqual(['milk']);
});

test('a finished restock is no longer a task', () => {
  expect(myRestocks(state([], [restock('milk', 'done', 'me')]), 'me')).toEqual([]);
});

test('once a chore is claimed it leaves the pool and shows in today\'s tasks, even if it was missed on an earlier day', () => {
  const s = state([chore('a', 'pri', 'claimed', '2026-10-07', 'me'), chore('b', 'pri', 'claimed', '2026-10-06', 'me')], []);
  expect(grabbable(s, 'me').count).toBe(0);
  expect(myTasksOn(s, 'me', '2026-10-07').map((a) => a.id).sort()).toEqual(['a', 'b']);
});
