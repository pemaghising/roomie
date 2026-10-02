import { m, type Transition } from 'motion/react';
import { SPRING } from '../lib/motion';

/** 'grow': the all-done sequence (stem rises, leaves unfurl). 'unfurl': the shorter covered variant, leaves only. */
export type SproutPlay = 'grow' | 'unfurl';

// the one place a spring may overshoot: leaves settle like something alive
const leaf = (delay: number): Transition => ({ ...SPRING.gentle, delay });
const PLAY = {
  grow: { stem: SPRING.smooth, l: leaf(0.22), r: leaf(0.36) },
  unfurl: { stem: undefined, l: leaf(0.05), r: leaf(0.14) },
} as const;

export function Sprout({ size = 56, grow = 1, play }: { size?: number; grow?: number; play?: SproutPlay }) {
  const p = play ? PLAY[play] : null;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="sprout">
      <m.path d="M32 58V30" stroke="#065F46" strokeWidth="4" strokeLinecap="round" style={{ originX: 0.5, originY: 1 }}
        initial={p?.stem ? { scaleY: 0 } : false} animate={{ scaleY: 1 }} transition={p?.stem} />
      {/* each leaf turns from where it meets the stem */}
      <m.path d="M31 34C21 34 14 27 13 18c10 0 17 6 18 16Z" fill="#34D399" style={{ originX: 1, originY: 1 }}
        initial={p ? { scale: 0, rotate: 35 } : false} animate={{ scale: grow, rotate: 0 }} transition={p ? p.l : SPRING.gentle} />
      <m.path d="M33 30c7 0 12-5 13-11-7 0-12 4-13 11Z" fill="#6EE7B7" style={{ originX: 0, originY: 1 }}
        initial={p ? { scale: 0, rotate: -35 } : false} animate={{ scale: grow, rotate: 0 }} transition={p ? p.r : SPRING.gentle} />
    </svg>
  );
}
