/** Fair-share balance in words only (no points, ever): frame H2 "Your effort this week". */
export function balanceWords(balance: number): { label: 'On track' | 'Catching up'; sentence: string } {
  if (balance < 0) return { label: 'Catching up', sentence: 'A little more comes your way this week, never on busy days.' };
  if (balance > 0) return { label: 'On track', sentence: 'You’ve done a bit extra. Your next week gets lighter.' };
  return { label: 'On track', sentence: 'You’re all square with the house.' };
}

/** How many of the 9 bar segments to fill: this week's effort done out of what's on your plan (all full when nothing is due). */
export const effortSegments = (done: number, planned: number) => (planned <= 0 ? 9 : Math.round(Math.min(1, done / planned) * 9));
