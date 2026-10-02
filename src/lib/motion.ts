import { useEffect, useState } from 'react';

/**
 * Roomie's motion tokens. Springs, not durations, so every animation can be retargeted mid-flight without a jump.
 * Mirrored for CSS in tokens.css (--spring-snappy, --spring-smooth, --ease-ios, --ease-out).
 */
export const SPRING = {
  /** buttons, toggles, segmented controls: damping ratio ~0.78, settles in ~0.4 s, overshoot under 2% (not visible) */
  snappy: { type: 'spring', stiffness: 500, damping: 35 },
  /** sheets, navigation, the tab pill: damping ratio ~0.87, settles in ~0.5 s */
  smooth: { type: 'spring', stiffness: 300, damping: 30 },
  /** celebration only (the sprout, the streak, the badge): damping ratio ~0.56, a slight overshoot is the point */
  gentle: { type: 'spring', stiffness: 320, damping: 20 },
} as const;

/** iOS sheet curve, for the few tweens left (exits, fades). */
export const EASE_IOS = [0.32, 0.72, 0, 1] as const;
/** Arrivals decelerate hard. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

// fetched once the browser is idle, so the 28 kB of drag/layout code never competes with first paint
const whenIdle = () => new Promise<void>((done) => (window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1)))(() => done()));
export const loadMotionFeatures = () => whenIdle().then(() => import('./motionFeatures')).then((m) => m.default);

const seen = new Set<string>();
/**
 * True only while a list first mounts this session (then false), so lists stagger in once,
 * not on every tab switch, and rows added later don't replay the entrance.
 */
export function useFirstMount(key: string) {
  const [first, setFirst] = useState(() => !seen.has(key));
  useEffect(() => {
    seen.add(key);
    const t = setTimeout(() => setFirst(false), 500);
    return () => clearTimeout(t);
  }, [key]);
  return first;
}
