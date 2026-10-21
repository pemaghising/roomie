// The motion system as plain numbers (testable without Reanimated). motion.ts turns these into animations.
// Snappy by design: short timings, stiff springs with little overshoot (Pema, 2026-10-22).

export const durations = { press: 90, enter: 200, fade: 150, tab: 220, sheetFade: 180, countUp: 320 } as const;

export const motion = {
  press: { scale: 0.96, spring: { damping: 22, stiffness: 520, mass: 0.6 } },
  sheet: { damping: 28, stiffness: 420, mass: 0.8 },
  tab: { damping: 26, stiffness: 480, mass: 0.7 },
  pop: { damping: 16, stiffness: 420, mass: 0.6 },
} as const;

export const stagger = (i: number) => Math.min(i, 8) * 30;

export type EnterConfig = { kind: 'rise' | 'fade'; duration: number; delay: number; distance: number };

/** List item i enters with a rise; with Reduce Motion it is a quick fade with no delay. */
export const enterConfig = (i: number, reduced: boolean): EnterConfig =>
  reduced ? { kind: 'fade', duration: durations.fade, delay: 0, distance: 0 }
          : { kind: 'rise', duration: durations.enter, delay: stagger(i), distance: 10 };
