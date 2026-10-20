import type { Restock } from './pantry.ts';
import { addDays } from './time.ts';

/**
 * Effort from restocks completed in a week, credited to whoever completed them (it counts toward the fair share;
 * nobody gets debt, since nobody missed anything). Kept apart from pantry.ts: weekTotals in the app's entry chunk
 * imports this, and must not pull in the icon dictionary.
 */
export function restockTotals(
  restocks: Pick<Restock, 'status' | 'done_by' | 'done_day' | 'effort'>[], weekStart: string,
): Record<string, number> {
  const end = addDays(weekStart, 6);
  const totals: Record<string, number> = {};
  for (const r of restocks) {
    if (r.status !== 'done' || !r.done_by || !r.done_day || r.done_day < weekStart || r.done_day > end) continue;
    totals[r.done_by] = (totals[r.done_by] ?? 0) + r.effort;
  }
  return totals;
}
