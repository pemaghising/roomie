// R4 Roommates: everyone's share this week in words and a bar, never in points.
import { addDays, weekStartOf } from '@domain/time.ts';
import type { AppState } from './types';

export function memberShares(s: AppState): { user_id: string; fill: number; label: 'On track' | 'Catching up' }[] {
  const start = weekStartOf(s.today);
  const end = addDays(start, 7);
  const week = s.assignments.filter((a) => a.day >= start && a.day < end && a.status !== 'expired');
  return s.members.map(({ user_id }) => {
    const mine = week.filter((a) => (a.claimed_by ?? a.user_id) === user_id);
    const planned = mine.reduce((n, a) => n + a.effort, 0);
    const done = mine.filter((a) => a.status === 'done').reduce((n, a) => n + a.effort, 0);
    const missed = week.some((a) => a.user_id === user_id && a.status === 'missed');
    return { user_id, fill: planned ? done / planned : 1, label: missed ? 'Catching up' : 'On track' };
  });
}
