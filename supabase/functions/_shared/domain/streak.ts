import type { AssignmentStatus } from './types.ts';

export type DayOutcome = 'kept' | 'broken' | 'pending' | 'empty';

export function dayOutcome(statuses: AssignmentStatus[]): DayOutcome {
  if (statuses.length === 0) return 'empty';
  if (statuses.includes('expired')) return 'broken';
  if (statuses.every((s) => s === 'done')) return 'kept';
  return 'pending';
}

/** The household's shared streak. Never per person. */
export interface Streak { current: number; best: number; lastSettledDay: string | null }

export function settleDay(s: Streak, day: string, outcome: 'kept' | 'broken' | 'empty'): Streak {
  if (s.lastSettledDay && day <= s.lastSettledDay) return s;
  if (outcome === 'empty') return { ...s, lastSettledDay: day };
  if (outcome === 'broken') return { ...s, current: 0, lastSettledDay: day };
  const current = s.current + 1;
  return { current, best: Math.max(s.best, current), lastSettledDay: day };
}
