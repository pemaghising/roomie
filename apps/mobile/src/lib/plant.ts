export type PlantStage = 'seed' | 'sprout' | 'leafy' | 'bud' | 'bloom' | 'droop';

/** The house plant grows only at milestones (3, 7, 14, 30 days) and droops while a chore is waiting. */
export function plantFor(streakDays: number, drooped: boolean): PlantStage {
  if (drooped) return 'droop';
  return streakDays >= 30 ? 'bloom' : streakDays >= 14 ? 'bud' : streakDays >= 7 ? 'leafy' : streakDays >= 3 ? 'sprout' : 'seed';
}

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

/** The two words beside the streak number. A drooping plant never says "strong": the plant asks for help until someone catches the chore up. */
export function streakWords(days: number, drooped: boolean): [string, string] {
  if (days === 0) return ['day', 'let’s grow'];
  if (days === 1) return ['day', 'together'];
  return drooped ? ['days', 'water me'] : ['days', 'strong'];
}

const ORDER: PlantStage[] = ['seed', 'sprout', 'leafy', 'bud', 'bloom'];
/** True only when the plant climbs a growth stage; droops, recoveries and resets just swap quietly. */
export function grewInto(from: PlantStage, to: PlantStage): boolean {
  const a = ORDER.indexOf(from), b = ORDER.indexOf(to);
  return a >= 0 && b > a;
}
