import { describe, expect, test } from 'vitest';
import { memberShares } from './roommates';
import type { AppState, Assignment } from './types';

const A = (id: string, user: string, day: string, effort: 1 | 2 | 3, status: Assignment['status'], claimed_by: string | null = null): Assignment =>
  ({ id, plan_id: 'p', chore_id: 'c', user_id: user, day, effort, status, claimed_by, done_at: null, reason: null });
const S = (assignments: Assignment[]) => ({
  today: '2026-10-21', assignments,
  members: [{ user_id: 'me' }, { user_id: 'aman' }, { user_id: 'pri' }],
}) as unknown as AppState;

describe('memberShares (R4)', () => {
  const s = S([
    A('1', 'me', '2026-10-19', 2, 'done'), A('2', 'me', '2026-10-23', 2, 'todo'),
    A('3', 'aman', '2026-10-20', 3, 'done'), A('4', 'aman', '2026-10-24', 1, 'todo'),
    A('5', 'pri', '2026-10-20', 2, 'missed'), A('6', 'pri', '2026-10-22', 2, 'todo'),
    A('7', 'pri', '2026-10-18', 1, 'done', 'me'), // Priya's chore I covered counts for me
    A('8', 'me', '2026-10-12', 3, 'done'), // last week
  ]);
  const by = Object.fromEntries(memberShares(s).map((m) => [m.user_id, m]));
  test('the bar is done effort out of planned effort this week', () => {
    expect(by.me.fill).toBeCloseTo(3 / 5);
    expect(by.aman.fill).toBeCloseTo(3 / 4);
    expect(by.pri.fill).toBe(0);
  });
  test('a missed chore this week means catching up; otherwise on track', () => {
    expect(by.me.label).toBe('On track');
    expect(by.pri.label).toBe('Catching up');
  });
  test('nobody planned yet reads on track with a full bar', () => expect(memberShares(S([]))[0]).toEqual({ user_id: 'me', fill: 1, label: 'On track' }));
});
