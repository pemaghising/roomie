const STAGES = 8;

/** One growth stage per streak day: the egg at 0, fully grown from day 7 (same art and rule as web). */
export const stageFor = (streak: number) => Math.min(STAGES, Math.max(1, Math.floor(streak) + 1));

export const MILESTONES = [3, 7, 14, 30, 50, 100] as const;

/**
 * Which milestone (if any) to celebrate now. `seen` is the highest one already celebrated in this run;
 * if the streak has dropped below it the run was broken, so the baseline resets and milestones can be earned again.
 */
export function milestoneState(streak: number, seen: number): { celebrate: number | null; seen: number } {
  const base = seen > streak ? 0 : seen;
  const reached = [...MILESTONES].filter((m) => m <= streak && m > base).pop() ?? null;
  return { celebrate: reached, seen: base };
}
