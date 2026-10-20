import { weekStartOf } from '@domain/time.ts';
import { myTasksOn } from './selectors';
import type { AppState } from './types';

export interface Achievement { id: string; emoji: string; title: string; hint: string; earned: boolean }

/**
 * Badges derived only from data the app already has, so nothing is invented and nobody is ranked.
 * Streak badges use the best streak (they stay earned after a break); the rest reflect today and this week.
 */
export function achievements(s: AppState, me: string): Achievement[] {
  const best = s.streak?.best ?? 0;
  const mine = myTasksOn(s, me, s.today);
  const weekStart = weekStartOf(s.today);
  const covered = s.assignments.some((a) => a.status === 'done' && a.claimed_by === me && a.user_id !== me && a.day >= weekStart);
  const restocked = s.restocks.some((r) => r.status === 'done' && r.done_by === me && r.done_day !== null && r.done_day >= weekStart);
  const all: Achievement[] = [
    { id: 'sprout', emoji: '🌱', title: 'Sprout', hint: 'Reach a 3-day house streak', earned: best >= 3 },
    { id: 'week', emoji: '🔥', title: 'Week warrior', hint: 'Reach a 7-day house streak', earned: best >= 7 },
    { id: 'fortnight', emoji: '🏆', title: 'Two weeks strong', hint: 'Reach a 14-day house streak', earned: best >= 14 },
    { id: 'sweep', emoji: '✨', title: 'Clean sweep', hint: 'Finish all your chores in a day', earned: mine.length > 0 && mine.every((a) => a.status === 'done') },
    { id: 'team', emoji: '🤝', title: 'Team player', hint: "Cover a roommate's chore this week", earned: covered },
    { id: 'restock', emoji: '🛒', title: 'Restocker', hint: 'Complete a restock this week', earned: restocked },
  ];
  return [...all.filter((a) => a.earned), ...all.filter((a) => !a.earned)];
}
