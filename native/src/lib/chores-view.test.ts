import { describe, expect, test } from 'vitest';
import { choresView } from './chores-view';
import type { AppState, Assignment } from './types';

const A = (id: string, day: string, status: Assignment['status'], user = 'me'): Assignment =>
  ({ id, plan_id: 'p', chore_id: 'c', user_id: user, day, effort: 1, status, claimed_by: null, done_at: null, reason: null });
const S = (assignments: Assignment[]) => ({ today: '2026-10-14', assignments, members: [], chores: [] }) as unknown as AppState;

describe('choresView (C1 / C1b)', () => {
  const s = S([
    A('t1', '2026-10-14', 'todo'), A('t2', '2026-10-14', 'done'),
    A('l1', '2026-10-16', 'todo'), A('l2', '2026-10-17', 'todo'),
    A('p1', '2026-10-13', 'done'),
    A('o1', '2026-10-14', 'todo', 'pri'), A('m1', '2026-10-15', 'missed', 'aman'),
    A('n1', '2026-10-19', 'todo'), // next week: not "later this week"
  ]);

  test('Mine: today and later this week are still to do; done ones collapse into "Done · N"', () => {
    const v = choresView(s, 'me', 'me');
    expect(v.today.map((a) => a.id)).toEqual(['t1']);
    expect(v.later.map((a) => a.id)).toEqual(['l1', 'l2']);
    expect(v.done.map((a) => a.id).sort()).toEqual(['p1', 't2']);
    expect(v.todayLeft).toBe(1);
  });

  test('Whole house shows everyone, done ones stay in place, missed ones say In the pool', () => {
    const v = choresView(s, 'me', 'all');
    expect(v.today.map((a) => a.id)).toEqual(['t1', 'o1', 't2']);
    expect(v.later.map((a) => a.id)).toEqual(['m1', 'l1', 'l2']);
    expect(v.todayLeft).toBe(2);
  });
});
