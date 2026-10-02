/** The iOS-style navigation stack: tabs at depth 0, screens pushed from them at depth 1. */
const DEPTH: Record<string, number> = { '/': 0, '/chores': 0, '/profile': 0, '/plan': 1, '/activity': 1, '/profile/household': 1 };

export type Direction = 'push' | 'pop' | 'none';

/** Push when going deeper, pop when coming back up (or on back/navigate(-1) between equals); anything else just swaps. */
export function navDirection(from: string, to: string, navigationType: 'POP' | 'PUSH' | 'REPLACE'): Direction {
  const a = DEPTH[from], b = DEPTH[to];
  if (a === undefined || b === undefined || from === to) return 'none';
  if (b !== a) return b > a ? 'push' : 'pop';
  if (a === 0) return 'none'; // tab to tab: the tab layout crossfades
  return navigationType === 'POP' ? 'pop' : 'push';
}

/** All tabs share one stack entry, so switching tabs never pushes. */
export const stackKey = (path: string) => (DEPTH[path] === 0 ? 'tabs' : path);

/** Edge-swipe back completes past 35% of the width, or on a rightward fling. */
export const swipeBackCompletes = (offset: number, width: number, velocity: number) =>
  offset > 0 && (offset > width * 0.35 || velocity > 500);

/** The swipe only starts within this many px of the left edge. */
export const EDGE = 20;
