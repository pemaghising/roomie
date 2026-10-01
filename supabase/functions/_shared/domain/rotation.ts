import type { ChoreInput, Effort, PlanInput, PlanResult, PlannedAssignment, Reason } from './types.ts';
import { addDays, type Weekday, weeksBetween } from './time.ts';

export const DEBT_CLAMP = 3;
export const clampDebt = (balance: number) => Math.max(-DEBT_CLAMP, Math.min(DEBT_CLAMP, balance));

/** Deterministic PRNG: the same household + week always produces the same plan. */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ChoreInstance { chore: ChoreInput; day: Weekday | null }

/** Daily chores get a fixed day each; weekly/biweekly chores float and are placed by the planner. */
export function expandChores(chores: ChoreInput[], weekStart: string, fromDay: Weekday = 0): ChoreInstance[] {
  const out: ChoreInstance[] = [];
  for (const chore of chores) {
    if (chore.cadence === 'daily') {
      for (let d = fromDay; d <= 6; d++) out.push({ chore, day: d as Weekday });
    } else if (chore.cadence === 'weekly' || Math.abs(weeksBetween(chore.createdWeek, weekStart)) % 2 === 0) {
      out.push({ chore, day: null });
    }
  }
  return out;
}

export function generatePlan(input: PlanInput): PlanResult {
  const { members, history, weekStart } = input;
  const fromDay: Weekday = input.fromDay ?? 0;
  const totals: Record<string, number> = Object.fromEntries(
    members.map((m) => [m.userId, input.existingTotals?.[m.userId] ?? 0]),
  );
  if (members.length === 0) return { assignments: [], totals, flags: [] };

  const rand = seededRandom(`${input.householdId}:${weekStart}:${fromDay}`);
  // Heaviest first; fixed-day instances before floating ones (floating ones fit around them); seeded tie-break.
  const instances = expandChores(input.chores, weekStart, fromDay)
    .map((inst) => ({ ...inst, tie: rand() }))
    .sort((a, b) => b.chore.effort - a.chore.effort || Number(a.day === null) - Number(b.day === null) || a.tie - b.tie);

  const sumNew = instances.reduce((s, i) => s + i.chore.effort, 0);
  const sumExisting = Object.values(totals).reduce((s, n) => s + n, 0);
  const fair = (sumNew + sumExisting) / members.length;
  const target = new Map(members.map((m) => [m.userId, fair + clampDebt(m.balance)]));
  const busy = new Map(members.map((m) => [m.userId, new Set<number>(m.busyDays)]));
  const prevWeek = addDays(weekStart, -7);
  const lastWeek = new Map(history.filter((h) => h.weekStart === prevWeek).map((h) => [h.choreId, h.userId]));
  const dayLoad = Array<number>(7).fill(0);
  const heavyOn = new Map(members.map((m) => [m.userId, Array<number>(7).fill(0)]));
  const allowedDays = Array.from({ length: 7 - fromDay }, (_, i) => (fromDay + i) as Weekday);
  const over = (userId: string) => totals[userId] - target.get(userId)!;

  const explain = (choreId: string, userId: string, day: Weekday, effort: Effort): Reason => {
    const m = members.find((x) => x.userId === userId)!;
    if (effort === 3) {
      const busyInRange = allowedDays.filter((d) => busy.get(userId)!.has(d));
      if (busyInRange.length > 0) {
        const nearest = busyInRange.reduce((a, b) => (Math.abs(b - day) < Math.abs(a - day) ? b : a));
        return { code: 'busy_moved', busyDay: nearest };
      }
    }
    const previous = lastWeek.get(choreId);
    if (previous && previous !== userId) return { code: 'turn', previousUserId: previous };
    const debt = clampDebt(m.balance);
    if (debt > 0) return m.coveredBy ? { code: 'debt', coveredBy: m.coveredBy } : { code: 'debt' };
    if (debt < 0) return { code: 'credit' };
    return { code: 'balance', points: 0, target: 0 }; // filled with final totals below
  };

  const assignments: PlannedAssignment[] = [];
  const flags: PlanResult['flags'] = [];

  for (const inst of instances) {
    const effort = inst.chore.effort;
    const days = inst.day === null ? allowedDays : [inst.day];
    let best: { userId: string; day: Weekday; cost: number } | null = null;
    for (const m of members) {
      for (const day of days) {
        const isBusy = busy.get(m.userId)!.has(day);
        if (effort === 3 && isBusy) continue; // hard rule: Heavy never on a busy day
        let cost = over(m.userId) + effort;
        if (effort === 2 && isBusy) cost += 1.5;
        if (lastWeek.get(inst.chore.id) === m.userId) cost += 1;
        if (effort === 3 && heavyOn.get(m.userId)![day] > 0) cost += 2;
        cost += dayLoad[day] * 0.05;
        if (!best || cost < best.cost - 1e-9) best = { userId: m.userId, day, cost };
      }
    }
    let reason: Reason | null = null;
    if (!best) {
      // Heavy chore and everyone is busy on every allowed day: whoever is furthest under target takes it.
      const day = days[0];
      const m = members.reduce((a, b) => (over(b.userId) < over(a.userId) ? b : a));
      best = { userId: m.userId, day, cost: 0 };
      reason = { code: 'everyone_busy', day };
      flags.push({ choreId: inst.chore.id, day });
    }
    totals[best.userId] += effort;
    dayLoad[best.day] += effort;
    if (effort === 3) heavyOn.get(best.userId)![best.day] += 1;
    assignments.push({
      choreId: inst.chore.id, userId: best.userId, day: best.day, effort,
      reason: reason ?? explain(inst.chore.id, best.userId, best.day, effort),
    });
  }

  for (const a of assignments) {
    if (a.reason.code === 'balance') a.reason = { code: 'balance', points: totals[a.userId], target: Math.round(target.get(a.userId)!) };
  }
  return { assignments, totals, flags };
}
