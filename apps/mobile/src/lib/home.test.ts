import { describe, expect, test } from 'vitest';
import { homeView } from './home';
import type { AppState, Assignment } from './types';

const A = (id: string, day: string, status: Assignment['status'], user = 'me', chore = 'c1'): Assignment =>
  ({ id, plan_id: 'p', chore_id: chore, user_id: user, day, effort: 1, status, claimed_by: null, done_at: null, reason: null });
const S = (over: Partial<AppState>): AppState => ({
  profile: { id: 'me', name: 'Ramesh' }, household: { id: 'h', name: 'Parijat Chowk Flat', invite_code: 'A3F92K', tz: 'Asia/Kathmandu' },
  members: [{ user_id: 'me', name: 'Ramesh' }, { user_id: 'pri', name: 'Priya' }, { user_id: 'aman', name: 'Aman' }],
  chores: [{ id: 'c1', name: 'Sweep living room', icon: '🧹', effort: 1, cadence: 'daily', active: true }],
  plans: [], assignments: [], swaps: [], streak: { current: 23, best: 23, last_settled_day: '2026-10-16' },
  balance: 0, activity: [], pantry: [], restocks: [], asks: [], today: '2026-10-17', ...over,
} as unknown as AppState);

describe('homeView', () => {
  test('the week runs Sunday to Saturday: past days done, today outlined, later days empty', () => {
    const v = homeView(S({ today: '2026-10-14' }), 'me'); // Wednesday
    expect(v.week).toEqual(['done', 'done', 'done', 'today', 'future', 'future', 'future']);
  });

  test('a chore waiting in the pool droops the plant and marks its day', () => {
    const v = homeView(S({ today: '2026-10-17', assignments: [A('x', '2026-10-16', 'missed', 'aman')] }), 'me');
    expect(v.drooped).toBe(true);
    expect(v.poolCount).toBe(1);
    expect(v.week[5]).toBe('missed');
  });

  test('pool chores never appear in my tasks; they stay in the shared pool', () => {
    const v = homeView(S({ assignments: [A('a', '2026-10-17', 'todo'), A('x', '2026-10-16', 'missed', 'aman')] }), 'me');
    expect(v.tasks.map((t) => t.id)).toEqual(['a']);
  });

  test('all done today hides the pool banner (H6) and says so', () => {
    const v = homeView(S({ assignments: [A('a', '2026-10-17', 'done')] }), 'me');
    expect(v.state).toBe('allDone');
    expect(v.showPool).toBe(false);
  });

  test('nothing due today shows the quiet card and what is coming up (H7)', () => {
    const v = homeView(S({ assignments: [A('n', '2026-10-18', 'todo')] }), 'me');
    expect(v.state).toBe('nothingDue');
    expect(v.upcoming.map((a) => a.id)).toEqual(['n']);
  });

  test('alone in a new home (H0): first-day state with the invite code', () => {
    const v = homeView(S({ members: [{ user_id: 'me', name: 'Ramesh' }] as AppState['members'], streak: { current: 1, best: 1, last_settled_day: null }, assignments: [A('a', '2026-10-17', 'todo')] }), 'me');
    expect(v.alone).toBe(true);
    expect(v.streakDays).toBe(1);
  });

  test('the greeting uses the first name and a sentence-case date', () => {
    const v = homeView(S({}), 'me', 9);
    expect(v.hello).toBe('Morning');
    expect(v.dateLabel).toBe('Saturday, 17 October');
  });
});
