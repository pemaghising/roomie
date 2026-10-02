import type { HouseholdSnapshot, TickAction } from '../_shared/domain/tick.ts';
import { generatePlan } from '../_shared/domain/rotation.ts';
import { settleDay, type Streak } from '../_shared/domain/streak.ts';
import { addDays, dateOfWeekday, localParts, type Weekday, weekStartOf } from '../_shared/domain/time.ts';
import type { ChoreInput, HistoryItem, MemberInput } from '../_shared/domain/types.ts';

/** The slice of supabase-js the tick needs — keeps this file testable without Deno. */
export interface RpcClient {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export async function call<T = unknown>(db: RpcClient, fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

interface PlanInputs { members: MemberInput[]; chores: ChoreInput[]; history: HistoryItem[]; existingTotals: Record<string, number> }

export async function planWeek(
  db: RpcClient, householdId: string, weekStart: string, status: 'draft' | 'locked',
  opts: { fromDay: Weekday; choreIds?: string[]; onlyIfNew: boolean; consume: boolean },
) {
  const inputs = await call<PlanInputs>(db, 'srv_plan_inputs', { p_household: householdId, p_week: weekStart });
  const chores = opts.choreIds ? inputs.chores.filter((c) => opts.choreIds!.includes(c.id)) : inputs.chores;
  const result = generatePlan({
    householdId, weekStart, members: inputs.members, chores, history: inputs.history, fromDay: opts.fromDay,
    existingTotals: opts.choreIds ? inputs.existingTotals : undefined,
  });
  await call(db, 'srv_insert_plan', {
    p_household: householdId, p_week: weekStart, p_status: status,
    p_assignments: result.assignments.map((a) => ({
      choreId: a.choreId, userId: a.userId, day: dateOfWeekday(weekStart, a.day), effort: a.effort, reason: a.reason,
    })),
    p_consume: opts.consume, p_only_if_new: opts.onlyIfNew,
  });
  return result;
}

export async function runActions(db: RpcClient, s: HouseholdSnapshot, actions: TickAction[]) {
  let streak: Streak = s.streak;
  for (const a of actions) {
    switch (a.kind) {
      case 'generate':
        await planWeek(db, s.id, a.weekStart, a.status, { fromDay: a.fromDay, onlyIfNew: true, consume: true });
        break;
      case 'lock':
        await call(db, 'srv_lock_plan', { p_plan: a.planId });
        break;
      case 'sweep':
        await call(db, 'srv_sweep_day', { p_household: s.id, p_day: a.date });
        break;
      case 'expire':
        await call(db, 'srv_expire_day', { p_household: s.id, p_day: a.date });
        break;
      case 'settle':
        streak = settleDay(streak, a.date, a.outcome);
        await call(db, 'srv_set_streak', {
          p_household: s.id, p_current: streak.current, p_best: streak.best, p_day: a.date, p_kept: a.outcome === 'kept',
        });
        break;
      case 'digest':
        await call(db, 'srv_queue_digest', { p_household: s.id, p_day: a.date });
        break;
    }
  }
}

/** A chore added mid-week joins the rest of this week (and next week's plan, if it already exists). */
export async function planNewChore(db: RpcClient, s: HouseholdSnapshot, choreId: string, now: Date) {
  const local = localParts(now, s.tz);
  const thisWeek = weekStartOf(local.date);
  if (!s.plans.some((p) => p.weekStart === thisWeek)) {
    await planWeek(db, s.id, thisWeek, 'locked', { fromDay: local.weekday, onlyIfNew: true, consume: true });
    return;
  }
  await planWeek(db, s.id, thisWeek, 'locked', { fromDay: local.weekday, choreIds: [choreId], onlyIfNew: false, consume: false });
  const next = s.plans.find((p) => p.weekStart === addDays(thisWeek, 7));
  if (next) await planWeek(db, s.id, next.weekStart, next.status, { fromDay: 0, choreIds: [choreId], onlyIfNew: false, consume: false });
}
