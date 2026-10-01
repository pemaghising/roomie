import { describe, expect, test } from 'vitest';
import { clampDebt, expandChores, generatePlan, seededRandom } from './rotation.ts';
import type { ChoreInput, MemberInput, PlanInput } from './types.ts';
import type { Weekday } from './time.ts';

const WEEK = '2026-10-05';
const chore = (id: string, effort: 1 | 2 | 3, cadence: ChoreInput['cadence'] = 'weekly'): ChoreInput =>
  ({ id, effort, cadence, createdWeek: '2026-09-28' });
const member = (userId: string, busyDays: Weekday[] = [], balance = 0, coveredBy?: string): MemberInput =>
  ({ userId, busyDays, balance, coveredBy });
const plan = (p: Partial<PlanInput>) =>
  generatePlan({ householdId: 'h1', weekStart: WEEK, members: [], chores: [], history: [], ...p });

describe('expandChores', () => {
  test('daily chores become one instance per remaining day', () => {
    const inst = expandChores([chore('trash', 1, 'daily')], WEEK, 3);
    expect(inst.map((i) => i.day)).toEqual([3, 4, 5, 6]);
  });
  test('biweekly chores appear on alternate weeks from their creation week', () => {
    const bi = [chore('windows', 2, 'biweekly')];
    expect(expandChores(bi, '2026-09-28')).toHaveLength(1);
    expect(expandChores(bi, '2026-10-05')).toHaveLength(0);
    expect(expandChores(bi, '2026-10-12')).toHaveLength(1);
  });
});

describe('generatePlan', () => {
  test('no members → nothing planned', () => {
    expect(plan({ chores: [chore('a', 1)] }).assignments).toEqual([]);
  });

  test('case-study household: heavy chores never land on a busy day, effort is balanced', () => {
    const result = plan({
      members: [member('aarav', [0, 2, 4]), member('priya'), member('you', [5, 6])],
      chores: [chore('trash', 1, 'daily'), chore('sweep', 2), chore('laundry', 2), chore('bathroom', 3), chore('kitchen', 3)],
    });
    expect(result.assignments).toHaveLength(11);
    const busy: Record<string, Weekday[]> = { aarav: [0, 2, 4], priya: [], you: [5, 6] };
    for (const a of result.assignments) if (a.effort === 3) expect(busy[a.userId]).not.toContain(a.day);
    const totals = Object.values(result.totals);
    expect(totals.reduce((s, n) => s + n, 0)).toBe(17);
    expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(3);
  });

  test('light-only chores split evenly', () => {
    const chores = Array.from({ length: 9 }, (_, i) => chore(`c${i}`, 1));
    const result = plan({ members: [member('a'), member('b'), member('c')], chores });
    expect(result.totals).toEqual({ a: 3, b: 3, c: 3 });
  });

  test('is deterministic for the same household and week', () => {
    const input = { members: [member('a', [1]), member('b')], chores: [chore('x', 3), chore('y', 2), chore('z', 1, 'daily')] };
    expect(plan(input)).toEqual(plan(input));
  });

  test('positive balance (owed effort) means more work, with a debt reason', () => {
    const chores = Array.from({ length: 6 }, (_, i) => chore(`c${i}`, 1));
    const result = plan({ members: [member('a', [], 2, 'b'), member('b')], chores });
    expect(result.totals.a).toBeGreaterThan(result.totals.b);
    expect(result.assignments.some((x) => x.userId === 'a' && x.reason.code === 'debt')).toBe(true);
  });

  test('negative balance (credit) means less work', () => {
    const chores = Array.from({ length: 6 }, (_, i) => chore(`c${i}`, 1));
    const result = plan({ members: [member('a', [], -2), member('b')], chores });
    expect(result.totals.a).toBeLessThan(result.totals.b);
  });

  test('debt is clamped to ±3 per week', () => {
    expect(clampDebt(9)).toBe(3);
    expect(clampDebt(-9)).toBe(-3);
    expect(clampDebt(2)).toBe(2);
  });

  test('rotates: whoever did a chore last week does not get it again, and the reason says so', () => {
    const result = plan({
      members: [member('a'), member('b')],
      chores: [chore('bins', 1)],
      history: [{ choreId: 'bins', userId: 'a', weekStart: '2026-09-28' }],
    });
    expect(result.assignments[0]).toMatchObject({ userId: 'b', reason: { code: 'turn', previousUserId: 'a' } });
  });

  test('spreads heavy chores: nobody gets two heavy chores on one day when avoidable', () => {
    const result = plan({ members: [member('a'), member('b')], chores: [chore('h1', 3), chore('h2', 3), chore('h3', 3), chore('h4', 3)] });
    const seen = new Set<string>();
    for (const a of result.assignments) {
      const key = `${a.userId}:${a.day}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  test('adds to an existing week using existing totals', () => {
    const result = plan({ members: [member('a'), member('b')], chores: [chore('new', 1)], existingTotals: { a: 5, b: 1 }, fromDay: 3 });
    expect(result.assignments[0].userId).toBe('b');
    expect(result.assignments[0].day).toBeGreaterThanOrEqual(3);
  });

  test('a heavy daily chore on a day everyone is busy is flagged, not dropped', () => {
    const result = plan({ members: [member('a', [2]), member('b', [2])], chores: [chore('deep', 3, 'daily')] });
    const wed = result.assignments.find((a) => a.day === 2)!;
    expect(wed.reason).toEqual({ code: 'everyone_busy', day: 2 });
    expect(result.flags).toEqual([{ choreId: 'deep', day: 2 }]);
  });

  test('balance reasons quote the final weekly totals', () => {
    const result = plan({ members: [member('a'), member('b')], chores: [chore('x', 2), chore('y', 1)] });
    for (const a of result.assignments) {
      if (a.reason.code === 'balance') expect(a.reason.points).toBe(result.totals[a.userId]);
    }
  });

  test('property: hard rules hold for 300 random households', () => {
    const rand = seededRandom('property');
    const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
    for (let run = 0; run < 300; run++) {
      const members = Array.from({ length: 1 + Math.floor(rand() * 6) }, (_, i) =>
        member(`m${i}`, ([0, 1, 2, 3, 4, 5, 6] as Weekday[]).filter(() => rand() < 0.3), Math.round(rand() * 10 - 5)));
      const chores = Array.from({ length: Math.floor(rand() * 16) }, (_, i) =>
        chore(`c${i}`, pick([1, 2, 3] as const), pick(['daily', 'weekly', 'biweekly'] as const)));
      const result = plan({ householdId: `h${run}`, members, chores });
      const expected = expandChores(chores, WEEK);
      expect(result.assignments).toHaveLength(expected.length);
      expect(Object.values(result.totals).reduce((s, n) => s + n, 0)).toBe(expected.reduce((s, i) => s + i.chore.effort, 0));
      for (const a of result.assignments) {
        if (a.effort !== 3) continue;
        const m = members.find((x) => x.userId === a.userId)!;
        if (a.reason.code === 'everyone_busy') {
          expect(members.every((x) => x.busyDays.includes(a.day))).toBe(true);
        } else {
          expect(m.busyDays).not.toContain(a.day);
        }
      }
    }
  });
});
