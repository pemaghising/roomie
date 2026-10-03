const KEY = 'roomie:streak-goal';

export function getStreakGoal(): number | null {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function setStreakGoal(days: number): void {
  try { localStorage.setItem(KEY, String(days)); } catch { /* storage unavailable: goal just won't persist */ }
}

export function clearStreakGoal(): void {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
