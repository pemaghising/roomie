// Sections for the Chores tab (C1 Mine / C1b Whole house): Today, Later this week, and the collapsed Done list.
import { addDays, weekStartOf } from '@domain/time.ts';
import { tasksOn, type Who } from './selectors';
import type { AppState, Assignment } from './types';

export function choresView(s: AppState, me: string, who: Who) {
  const start = weekStartOf(s.today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const on = (d: string) => tasksOn(s, me, who, d);
  const open = (a: Assignment) => a.status !== 'done';
  const todayAll = on(s.today);
  const mine = who === 'me';
  return {
    today: mine ? todayAll.filter(open) : todayAll,
    later: days.filter((d) => d > s.today).flatMap((d) => (mine ? on(d).filter(open) : on(d))),
    done: mine ? days.filter((d) => d <= s.today).flatMap((d) => on(d).filter((a) => !open(a))) : [],
    todayLeft: todayAll.filter(open).length,
    laterLeft: days.filter((d) => d > s.today).flatMap(on).filter(open).length,
  };
}
