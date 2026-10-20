const KEY = 'roomie:streak-goal';

export function getStreakGoal(): number | null {
  try {
    const n = Number(localStorage.getItem(KEY));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

const SEEN_KEY = 'roomie:milestone-seen';

export function getMilestoneSeen(): number {
  try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; }
}

export function setMilestoneSeen(days: number): void {
  try { localStorage.setItem(SEEN_KEY, String(days)); } catch { /* storage unavailable: it may celebrate again next launch */ }
}

export function setStreakGoal(days: number): void {
  try { localStorage.setItem(KEY, String(days)); } catch { /* storage unavailable: goal just won't persist */ }
}
