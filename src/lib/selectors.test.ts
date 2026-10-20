import { describe, expect, test } from 'vitest';
import { myTasksOn, nextUp, pendingDraft, pool, roommates, unreadCount, weekDates, weekTotals } from './selectors';
import type { AppState, Assignment } from './types';

const a = (over: Partial<Assignment>): Assignment => ({
  id: crypto.randomUUID(), plan_id: 'p1', chore_id: 'c1', user_id: 'me', day: '2026-10-01', effort: 1,
  status: 'todo', claimed_by: null, done_at: null, reason: { code: 'credit' }, ...over,
});
const state = (assignments: Assignment[], over: Partial<AppState> = {}): AppState => ({
  profile: { id: 'me', name: 'Me', color: '#d1fae5', nudge_style: 'motivate', activity_seen_at: '2026-10-01T00:00:00Z' },
  household: { id: 'h', name: 'Flat', invite_code: 'ABC123', plan_mode: 'review', tz: 'Asia/Kathmandu', day_ends_at: '22:00:00' },
  members: [
    { user_id: 'me', name: 'Me', color: '#d1fae5', role: 'owner', busy_days: [] },
    { user_id: 'p', name: 'Priya', color: '#dbeafe', role: 'member', busy_days: [] },
  ],
  chores: [], plans: [{ id: 'p1', week_start: '2026-09-27', status: 'locked', lock_at: '', approved_by: [] }],
  assignments, swaps: [], streak: null, balance: 0, activity: [], today: '2026-10-01', ...over,
});

describe('selectors', () => {
  test('myTasksOn includes my todos and chores I claimed, open ones first', () => {
    const s = state([
      a({ id: 'done', status: 'done', done_at: 'x' }),
      a({ id: 'mine', effort: 2 }),
      a({ id: 'claimed', user_id: 'p', status: 'claimed', claimed_by: 'me' }),
      a({ id: 'theirs', user_id: 'p' }),
      a({ id: 'gone', status: 'expired' }),
    ]);
    expect(myTasksOn(s, 'me', '2026-10-01').map((x) => x.id)).toEqual(['mine', 'claimed', 'done']);
  });
  test("today's list includes chores I claimed from earlier days", () => {
    const s = state([a({ id: 'old', user_id: 'p', day: '2026-09-30', status: 'claimed', claimed_by: 'me' })]);
    expect(myTasksOn(s, 'me', '2026-10-01').map((x) => x.id)).toEqual(['old']);
    expect(myTasksOn(s, 'me', '2026-10-02')).toEqual([]);
  });
  test('pool shows other people’s missed chores only', () => {
    const s = state([a({ id: 'm1', user_id: 'p', status: 'missed', day: '2026-09-30' }), a({ id: 'm2', status: 'missed' })]);
    expect(pool(s, 'me').map((x) => x.id)).toEqual(['m1']);
  });
  test('weekTotals sums planned points per person, ignoring expired', () => {
    const s = state([a({ effort: 3 }), a({ effort: 1, user_id: 'p' }), a({ effort: 2, status: 'expired' })]);
    expect(weekTotals(s, '2026-09-27')).toEqual({ me: 3, p: 1 });
  });
  test('roommates counts today’s tasks', () => {
    const s = state([a({ status: 'done' }), a({}), a({ user_id: 'p' })]);
    expect(roommates(s, '2026-10-01').map((r) => [r.user_id, r.today, r.done])).toEqual([['me', 2, 1], ['p', 1, 0]]);
  });
  test('nextUp is my first future todo', () => {
    const s = state([a({ id: 'later', day: '2026-10-03' }), a({ id: 'soon', day: '2026-10-02' })]);
    expect(nextUp(s, 'me', '2026-10-01')?.id).toBe('soon');
  });
  test('pendingDraft finds next week’s draft', () => {
    const s = state([], { plans: [{ id: 'n', week_start: '2026-10-04', status: 'draft', lock_at: '', approved_by: [] }] });
    expect(pendingDraft(s)?.id).toBe('n');
  });
  test('unreadCount ignores my own activity', () => {
    const s = state([], { activity: [
      { id: 1, kind: 'completed', actor: 'p', payload: {}, created_at: '2026-10-01T05:00:00Z' },
      { id: 2, kind: 'completed', actor: 'me', payload: {}, created_at: '2026-10-01T05:00:00Z' },
      { id: 3, kind: 'completed', actor: 'p', payload: {}, created_at: '2026-09-30T05:00:00Z' },
    ] });
    expect(unreadCount(s, 'me')).toBe(1);
  });
  test('weekDates', () => {
    expect(weekDates('2026-09-27')).toEqual(['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03']);
  });
});
