import { addDays, weekStartOf } from '@domain/time.ts';
import type { AppState, Assignment } from './types';

export interface WeekRecap {
  weekStart: string;
  done: number;
  due: number;
  pct: number;
  streak: number;
  /** Member order, never sorted by count: the recap celebrates the house, it doesn't rank people. */
  byMember: { user_id: string; name: string; color: string; done: number }[];
}

/** The household's week so far: chores done vs. due up to today. A covered chore counts for whoever claimed it. */
export function weekRecap(s: AppState): WeekRecap {
  const weekStart = weekStartOf(s.today);
  const planIds = new Set(s.plans.filter((p) => p.week_start === weekStart).map((p) => p.id));
  const rows = s.assignments.filter((a) => planIds.has(a.plan_id) && a.status !== 'expired' && a.day <= s.today);
  const done = rows.filter((a) => a.status === 'done');
  return {
    weekStart,
    done: done.length,
    due: rows.length,
    pct: rows.length ? Math.round((done.length / rows.length) * 100) : 0,
    streak: s.streak?.current ?? 0,
    byMember: s.members.map((m) => ({
      user_id: m.user_id, name: m.name, color: m.color,
      done: done.filter((a) => (a.claimed_by ?? a.user_id) === m.user_id).length,
    })),
  };
}

export type DayState = 'kept' | 'missed' | 'open' | 'none' | 'future';

export interface MemberWeek {
  user_id: string; name: string; color: string;
  /** The last 7 days ending today, oldest first. */
  dates: string[];
  days: DayState[];
  kept: number;
}

/**
 * Each person's last 7 days: kept (all their chores done), missed (past day, something left), open (today, not finished) or none.
 * A covered chore counts for the person who claimed it. Derived from the 7 days of history get_state returns, so no migration;
 * shown in member order, never ranked.
 */
export function memberWeek(s: AppState): MemberWeek[] {
  const dates = Array.from({ length: 7 }, (_, i) => addDays(s.today, i - 6));
  const rows = s.assignments.filter((a) => a.status !== 'expired');
  return s.members.map((m) => {
    const days = dates.map((d): DayState => {
      const mine = rows.filter((a) => a.day === d && (a.claimed_by ?? a.user_id) === m.user_id);
      if (mine.length === 0) return 'none';
      if (mine.every((a) => a.status === 'done')) return 'kept';
      return d < s.today ? 'missed' : 'open';
    });
    return { user_id: m.user_id, name: m.name, color: m.color, dates, days, kept: days.filter((x) => x === 'kept').length };
  });
}

/** Sunday to Saturday for any week: a day is kept when every chore on it is done. Future days are never judged. */
export function weekStates(s: AppState, weekStart: string, tasksFor: (date: string) => Assignment[]): DayState[] {
  return Array.from({ length: 7 }, (_, i): DayState => {
    const d = addDays(weekStart, i);
    if (d > s.today) return 'future';
    const mine = tasksFor(d);
    if (mine.length === 0) return 'none';
    if (mine.every((a) => a.status === 'done')) return 'kept';
    return d < s.today ? 'missed' : 'open';
  });
}

/** The household's current week, every chore counted. */
export function houseWeek(s: AppState): { dates: string[]; days: DayState[] } {
  const start = weekStartOf(s.today);
  const rows = s.assignments.filter((a) => a.status !== 'expired');
  return { dates: Array.from({ length: 7 }, (_, i) => addDays(start, i)), days: weekStates(s, start, (d) => rows.filter((a) => a.day === d)) };
}
