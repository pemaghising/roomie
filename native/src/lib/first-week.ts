import { addDays, weekStartOf } from '@domain/time.ts';
import type { AppState } from './types';

/** The numbers for the "your first week is ready" screen. `planned` is false until the first plan has been generated. */
export function firstWeek(s: AppState, me: string) {
  const start = weekStartOf(s.today);
  const end = addDays(start, 6);
  const week = s.assignments.filter((a) => a.status !== 'expired' && a.day >= start && a.day <= end);
  return {
    chores: s.chores.filter((c) => c.active).length,
    roommates: s.members.length,
    myTurns: week.filter((a) => a.user_id === me).length,
    planned: week.length > 0,
  };
}
