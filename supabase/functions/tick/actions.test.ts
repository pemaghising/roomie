import { describe, expect, test, vi } from 'vitest';
import { planNewChore, runActions, type RpcClient } from './actions.ts';
import type { HouseholdSnapshot } from '../_shared/domain/tick.ts';

function fakeDb(responses: Record<string, unknown> = {}) {
  const calls: { fn: string; args?: Record<string, unknown> }[] = [];
  const db: RpcClient = {
    rpc: vi.fn(async (fn: string, args?: Record<string, unknown>) => {
      calls.push({ fn, args });
      return { data: responses[fn] ?? null, error: null };
    }),
  };
  return { db, calls };
}

const inputs = {
  members: [{ userId: 'a', busyDays: [], balance: 0 }, { userId: 'b', busyDays: [], balance: 0 }],
  chores: [{ id: 'c1', effort: 1, cadence: 'weekly', createdWeek: '2026-09-28' }, { id: 'c2', effort: 3, cadence: 'weekly', createdWeek: '2026-09-28' }],
  history: [],
  existingTotals: { a: 4, b: 0 },
};
const snap = (over: Partial<HouseholdSnapshot> = {}): HouseholdSnapshot => ({
  id: 'h1', tz: 'Asia/Kathmandu', planMode: 'review', dayEndsAt: '22:00:00', activeMembers: 2,
  plans: [{ id: 'cur', weekStart: '2026-09-28', status: 'locked', approvals: 0, lockAt: '2026-09-27T12:15:00Z' }],
  days: [], streak: { current: 1, best: 1, lastSettledDay: null }, digestSentFor: null, ...over,
});

describe('runActions', () => {
  test('generate plans the whole week with dates, consuming debt, only if new', async () => {
    const { db, calls } = fakeDb({ srv_plan_inputs: inputs });
    await runActions(db, snap(), [{ kind: 'generate', weekStart: '2026-10-05', status: 'draft', fromDay: 0 }]);
    const insert = calls.find((c) => c.fn === 'srv_insert_plan')!;
    expect(insert.args).toMatchObject({ p_household: 'h1', p_week: '2026-10-05', p_status: 'draft', p_consume: true, p_only_if_new: true });
    const rows = insert.args!.p_assignments as { day: string; userId: string }[];
    expect(rows).toHaveLength(2);
    for (const r of rows) expect(r.day >= '2026-10-05' && r.day <= '2026-10-11').toBe(true);
  });

  test('settle applies streak days in order', async () => {
    const { db, calls } = fakeDb();
    await runActions(db, snap(), [
      { kind: 'settle', date: '2026-09-29', outcome: 'kept' },
      { kind: 'settle', date: '2026-09-30', outcome: 'kept' },
    ]);
    const sets = calls.filter((c) => c.fn === 'srv_set_streak').map((c) => c.args);
    expect(sets).toEqual([
      { p_household: 'h1', p_current: 2, p_best: 2, p_day: '2026-09-29', p_kept: true },
      { p_household: 'h1', p_current: 3, p_best: 3, p_day: '2026-09-30', p_kept: true },
    ]);
  });

  test('simple actions map to their srv_ functions', async () => {
    const { db, calls } = fakeDb();
    await runActions(db, snap(), [
      { kind: 'lock', planId: 'p9' }, { kind: 'sweep', date: '2026-10-01' }, { kind: 'expire', date: '2026-09-30' }, { kind: 'digest', date: '2026-10-01' },
    ]);
    expect(calls.map((c) => c.fn)).toEqual(['srv_lock_plan', 'srv_sweep_day', 'srv_expire_day', 'srv_queue_digest']);
  });
});

describe('planNewChore', () => {
  const THU = new Date('2026-10-01T09:15:00Z'); // 15:00 Thursday in Kathmandu

  test('adds only that chore to the rest of this week, counting existing totals', async () => {
    const { db, calls } = fakeDb({ srv_plan_inputs: inputs });
    await planNewChore(db, snap(), 'c1', THU);
    const insert = calls.find((c) => c.fn === 'srv_insert_plan')!;
    expect(insert.args).toMatchObject({ p_week: '2026-09-28', p_status: 'locked', p_consume: false, p_only_if_new: false });
    const rows = insert.args!.p_assignments as { choreId: string; userId: string; day: string }[];
    expect(rows).toEqual([expect.objectContaining({ choreId: 'c1', userId: 'b' })]);
    expect(rows[0].day >= '2026-10-01').toBe(true);
  });

  test("also adds it to next week's draft when one exists", async () => {
    const { db, calls } = fakeDb({ srv_plan_inputs: inputs });
    const s = snap({ plans: [...snap().plans, { id: 'n', weekStart: '2026-10-05', status: 'draft', approvals: 0, lockAt: '2026-10-04T12:15:00Z' }] });
    await planNewChore(db, s, 'c1', THU);
    expect(calls.filter((c) => c.fn === 'srv_insert_plan').map((c) => c.args!.p_week)).toEqual(['2026-09-28', '2026-10-05']);
  });

  test('falls back to a full plan when this week has none yet', async () => {
    const { db, calls } = fakeDb({ srv_plan_inputs: inputs });
    await planNewChore(db, snap({ plans: [] }), 'c1', THU);
    const insert = calls.find((c) => c.fn === 'srv_insert_plan')!;
    expect(insert.args).toMatchObject({ p_only_if_new: true, p_consume: true });
    expect((insert.args!.p_assignments as unknown[]).length).toBe(2);
  });
});
