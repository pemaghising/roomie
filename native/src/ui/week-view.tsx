import { myTasksOn } from '@/lib/selectors';
import type { AppState, Assignment } from '@/lib/types';

export type Who = 'me' | 'all';

/** My chores on a date, or everyone's. */
export function tasksOn(state: AppState, me: string, who: Who, d: string): Assignment[] {
  if (who === 'me') return myTasksOn(state, me, d);
  return state.assignments
    .filter((a) => a.day === d && a.status !== 'expired')
    .sort((x, y) => Number(y.status !== 'done') - Number(x.status !== 'done') || y.effort - x.effort);
}
