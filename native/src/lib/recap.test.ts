import { expect, test } from 'vitest';
import { houseWeek, memberWeek, weekRecap, weekStates } from './recap';
import type { AppState } from './types';

const member = (id: string, name: string) => ({ user_id: id, name, color: '#fff', role: 'member' as const, busy_days: [] });
const a = (id: string, user: string, day: string, status: string, claimed_by: string | null = null) =>
  ({ id, plan_id: 'p', chore_id: 'c', user_id: user, day, effort: 1, status, claimed_by, done_at: null, reason: null });

// 2026-10-07 is a Wednesday; its week starts Sunday 2026-10-04.
const base = (assignments: unknown[], streak = 4) => ({
  today: '2026-10-07', streak: { current: streak, best: streak, last_settled_day: null },
  members: [member('me', 'Rahul'), member('pri', 'Priya')], assignments,
  plans: [{ id: 'p', week_start: '2026-10-04', status: 'locked', lock_at: '', approved_by: [] }],
}) as unknown as AppState;

test('counts done vs due so far this week, ignoring future days and expired', () => {
  const r = weekRecap(base([
    a('1', 'me', '2026-10-05', 'done'), a('2', 'pri', '2026-10-06', 'done'), a('3', 'pri', '2026-10-07', 'todo'),
    a('4', 'me', '2026-10-09', 'todo'), a('5', 'me', '2026-10-06', 'expired'),
  ]));
  expect(r).toMatchObject({ done: 2, due: 3, pct: 67, streak: 4 });
});

test('credits a covered chore to whoever claimed it, in member order with no ranking', () => {
  const r = weekRecap(base([a('1', 'me', '2026-10-05', 'done', 'pri'), a('2', 'pri', '2026-10-06', 'done'), a('3', 'pri', '2026-10-07', 'done')]));
  expect(r.byMember.map((m) => [m.user_id, m.done])).toEqual([['me', 0], ['pri', 3]]);
});

test('a week with nothing due is 0%, not NaN', () => {
  const r = weekRecap(base([]));
  expect(r).toMatchObject({ done: 0, due: 0, pct: 0 });
});


test('memberWeek marks each of the last 7 days kept, missed, open or none per member', () => {
  const s = base([
    a('1', 'me', '2026-10-05', 'done'), // Mon kept
    a('2', 'me', '2026-10-06', 'todo'), // Tue missed (past, not done)
    a('3', 'me', '2026-10-07', 'todo'), // Wed (today) still open
    a('4', 'pri', '2026-10-05', 'done', 'me'), // Mon: Priya's chore was covered by me, so it counts for me, not Priya
    a('5', 'me', '2026-10-06', 'expired'),
  ]);
  const me = memberWeek(s).find((m) => m.user_id === 'me')!;
  expect(me.days).toHaveLength(7);
  const byDate = Object.fromEntries(me.dates.map((d, i) => [d, me.days[i]]));
  expect(byDate['2026-10-05']).toBe('kept');
  expect(byDate['2026-10-06']).toBe('missed');
  expect(byDate['2026-10-07']).toBe('open');
  expect(byDate['2026-10-04']).toBe('none');
  expect(me.kept).toBe(1);
  const pri = memberWeek(s).find((m) => m.user_id === 'pri')!;
  expect(Object.fromEntries(pri.dates.map((d, i) => [d, pri.days[i]]))['2026-10-05']).toBe('none');
});

test('houseWeek shows Sunday to Saturday: kept, missed, open today, then future', () => {
  const s = base([
    a('1', 'me', '2026-10-05', 'done'), a('2', 'pri', '2026-10-05', 'done'), // Mon: everyone done
    a('3', 'me', '2026-10-06', 'done'), a('4', 'pri', '2026-10-06', 'todo'), // Tue: one left
    a('5', 'me', '2026-10-07', 'todo'), // Wed (today)
    a('6', 'me', '2026-10-08', 'todo'), // Thu: future
    a('7', 'me', '2026-10-06', 'expired'),
  ]);
  const w = houseWeek(s);
  expect(w.dates[0]).toBe('2026-10-04');
  expect(w.dates[6]).toBe('2026-10-10');
  expect(w.days).toEqual(['none', 'kept', 'missed', 'open', 'future', 'future', 'future']);
});

test('houseWeek marks a past day with no chores as none, and today with no chores as none', () => {
  const w = houseWeek(base([a('1', 'me', '2026-10-06', 'done')]));
  expect(w.days.slice(0, 4)).toEqual(['none', 'none', 'kept', 'none']);
});

test('weekStates judges any week with the given task source, never the future', () => {
  const s = base([]);
  const tasks: Record<string, unknown[]> = {
    '2026-09-27': [a('1', 'me', '2026-09-27', 'done')],
    '2026-09-28': [a('2', 'me', '2026-09-28', 'todo')],
  };
  const past = weekStates(s, '2026-09-27', (d) => (tasks[d] ?? []) as never);
  expect(past).toEqual(['kept', 'missed', 'none', 'none', 'none', 'none', 'none']);
  const next = weekStates(s, '2026-10-11', () => [a('3', 'me', '2026-10-11', 'todo')] as never);
  expect(next).toEqual(['future', 'future', 'future', 'future', 'future', 'future', 'future']);
});
