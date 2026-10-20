// The motion system as plain numbers (testable without Reanimated). motion.ts turns these into animations.

export const durations = { press: 120, enter: 260, fade: 180, tab: 280, sheetFade: 220, countUp: 420 } as const;

export const motion = {
  press: { scale: 0.97, spring: { damping: 18, stiffness: 320 } },
  sheet: { damping: 22, stiffness: 260 },
  tab: { damping: 20, stiffness: 300 },
  pop: { damping: 14, stiffness: 260 },
} as const;

export const stagger = (i: number) => Math.min(i, 8) * 40;

export type EnterConfig = { kind: 'rise' | 'fade'; duration: number; delay: number; distance: number };

/** List item i enters with a rise; with Reduce Motion it is a quick fade with no delay. */
export const enterConfig = (i: number, reduced: boolean): EnterConfig =>
  reduced ? { kind: 'fade', duration: durations.fade, delay: 0, distance: 0 }
          : { kind: 'rise', duration: durations.enter, delay: stagger(i), distance: 12 };
