import type { AssignmentStatus } from './types.ts';
import type { NudgeKind } from './copy.ts';
import { dayOutcome, type Streak } from './streak.ts';
import { addDays, localParts, minutesOf, type Weekday, weekStartOf } from './time.ts';

export interface HouseholdSnapshot {
  id: string;
  tz: string;
  planMode: 'review' | 'auto';
  dayEndsAt: string;
  activeMembers: number;
  plans: { id: string; weekStart: string; status: 'draft' | 'locked'; approvals: number; lockAt: string }[];
  /** Recent days (up to 3 back) and today, ascending, with every assignment status on that day. */
  days: { date: string; statuses: AssignmentStatus[] }[];
  streak: Streak;
  digestSentFor: string | null;
}

export type TickAction =
  | { kind: 'generate'; weekStart: string; status: 'draft' | 'locked'; fromDay: Weekday }
  | { kind: 'lock'; planId: string }
  | { kind: 'sweep'; date: string }
  | { kind: 'expire'; date: string }
  | { kind: 'settle'; date: string; outcome: 'kept' | 'broken' | 'empty' }
  | { kind: 'digest'; date: string };

/**
 * First weekday of this week that can still get chores. Once today has ended its chores would be swept straight
 * to missed, so start tomorrow; on Sunday after the end nothing is left of this week (null).
 */
export function firstPlannableDay(weekday: Weekday, nowMin: number, endMin: number): Weekday | null {
  if (nowMin < endMin) return weekday;
  return weekday === 6 ? null : ((weekday + 1) as Weekday);
}

export function decideTick(s: HouseholdSnapshot, now: Date): TickAction[] {
  const local = localParts(now, s.tz);
  const nowMin = local.hour * 60 + local.minute;
  const endMin = minutesOf(s.dayEndsAt);
  const thisWeek = weekStartOf(local.date);
  const nextWeek = addDays(thisWeek, 7);
  const yesterday = addDays(local.date, -1);
  const hasPlan = (week: string) => s.plans.some((p) => p.weekStart === week);
  const ended = (date: string) => date < local.date || (date === local.date && nowMin >= endMin);
  const poolClosed = (date: string) => date < yesterday || (date === yesterday && nowMin >= endMin);
  const actions: TickAction[] = [];

  const fromDay = firstPlannableDay(local.weekday, nowMin, endMin);
  if (!hasPlan(thisWeek) && fromDay !== null) actions.push({ kind: 'generate', weekStart: thisWeek, status: 'locked', fromDay });
  const draftWindow = (local.weekday === 5 && local.hour >= 18) || local.weekday === 6;
  if (draftWindow && !hasPlan(nextWeek)) {
    actions.push({ kind: 'generate', weekStart: nextWeek, status: s.planMode === 'auto' ? 'locked' : 'draft', fromDay: 0 });
  }
  for (const p of s.plans) {
    if (p.status === 'draft' && (p.approvals >= s.activeMembers || now.getTime() >= Date.parse(p.lockAt))) {
      actions.push({ kind: 'lock', planId: p.id });
    }
  }

  for (const d of s.days) {
    if (ended(d.date) && d.statuses.includes('todo')) actions.push({ kind: 'sweep', date: d.date });
    if (poolClosed(d.date) && d.statuses.some((st) => st === 'todo' || st === 'missed' || st === 'claimed')) {
      actions.push({ kind: 'expire', date: d.date });
    }
  }

  // Settle streak days in order, as they would look after this tick's sweep/expire.
  for (const d of s.days) {
    if (s.streak.lastSettledDay && d.date <= s.streak.lastSettledDay) continue;
    const closed = poolClosed(d.date);
    const statuses = closed ? d.statuses.map((st): AssignmentStatus => (st === 'done' ? 'done' : 'expired')) : d.statuses;
    const outcome = dayOutcome(statuses);
    if (outcome === 'pending' || (!closed && outcome !== 'kept')) break;
    actions.push({ kind: 'settle', date: d.date, outcome });
  }

  if (local.hour >= 8 && local.hour < 12 && s.digestSentFor !== local.date) actions.push({ kind: 'digest', date: local.date });
  return actions;
}

export const PUSH_DAILY_CAP = 3;

export function pushDecision(localHour: number, sentToday: number, kind: NudgeKind): 'send' | 'defer' | 'skip' {
  if (localHour >= 22 || localHour < 7) return 'defer';
  // pool is exempt (and not counted): one per member per sweep, and its chores stay claimable after quiet hours
  if (sentToday >= PUSH_DAILY_CAP && kind !== 'covered' && kind !== 'pool') return 'skip';
  return 'send';
}
