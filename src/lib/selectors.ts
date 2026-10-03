import { restockTotals } from '@domain/restock.ts';
import { addDays } from '@domain/time.ts';
import type { AppState, Assignment, Chore, Plan, SwapRequest } from './types';

export const namesOf = (s: AppState): Record<string, string> =>
  Object.fromEntries(s.members.map((m) => [m.user_id, m.name || 'Roommate']));

export const choreMap = (s: AppState): Map<string, Chore> => new Map(s.chores.map((c) => [c.id, c]));

const open = (a: Assignment) => a.status !== 'done';

/**
 * What I'm responsible for on a date: my own chores (unless someone claimed them) and chores I claimed.
 * On today's list, chores I claimed from earlier days (the missed pile) show up too — they're today's work now.
 */
export function myTasksOn(s: AppState, me: string, date: string): Assignment[] {
  return s.assignments
    .filter((a) => a.status !== 'expired' && (
      (a.day === date && (
        (a.user_id === me && a.status !== 'claimed' && !(a.status === 'done' && a.claimed_by)) ||
        (a.claimed_by === me && (a.status === 'claimed' || a.status === 'done')))) ||
      (date === s.today && a.day < date && a.claimed_by === me && a.status === 'claimed')))
    .sort((x, y) => Number(open(y)) - Number(open(x)) || y.effort - x.effort);
}

/** Missed by roommates — claimable by me. */
export const pool = (s: AppState, me: string): Assignment[] =>
  s.assignments.filter((a) => a.status === 'missed' && a.user_id !== me).sort((x, y) => y.effort - x.effort);

export const planForWeek = (s: AppState, weekStart: string): Plan | undefined => s.plans.find((p) => p.week_start === weekStart);

export const weekDates = (weekStart: string): string[] => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

export function weekTotals(s: AppState, weekStart: string): Record<string, number> {
  const plan = planForWeek(s, weekStart);
  const totals: Record<string, number> = {};
  for (const a of s.assignments) {
    if (!plan || a.plan_id !== plan.id || a.status === 'expired') continue;
    totals[a.user_id] = (totals[a.user_id] ?? 0) + a.effort;
  }
  // a restock someone did this week counts toward their fair share (and creates no debt for anyone)
  for (const [user, pts] of Object.entries(restockTotals(s.restocks, weekStart))) totals[user] = (totals[user] ?? 0) + pts;
  return totals;
}

export function roommates(s: AppState, today: string) {
  return s.members.map((m) => {
    const mine = s.assignments.filter((a) => a.user_id === m.user_id && a.day === today && a.status !== 'expired');
    return { ...m, today: mine.length, done: mine.filter((a) => a.status === 'done').length };
  });
}

export const nextUp = (s: AppState, me: string, today: string): Assignment | undefined =>
  s.assignments.filter((a) => a.user_id === me && a.status === 'todo' && a.day > today).sort((x, y) => x.day.localeCompare(y.day))[0];

export const pendingDraft = (s: AppState): Plan | undefined =>
  s.plans.find((p) => p.status === 'draft' && p.week_start > s.today);

export const incomingSwaps = (s: AppState, me: string): SwapRequest[] => s.swaps.filter((w) => w.to_user === me);
export const outgoingSwaps = (s: AppState, me: string): SwapRequest[] => s.swaps.filter((w) => w.from_user === me);

/** New since I last opened Activity, and not something I did myself. */
export const isUnread = (s: AppState, me: string) => (x: AppState['activity'][number]) =>
  x.created_at > s.profile.activity_seen_at && x.actor !== me;

export const unreadCount = (s: AppState, me: string): number => s.activity.filter(isUnread(s, me)).length;
