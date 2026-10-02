import { useEffect, useState } from 'react';

/** Arrivals decelerate hard; exits use the plain ease-in and run faster. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;
/** Damping ratio ~0.97: settles without overshoot. */
export const SPRING = { type: 'spring', stiffness: 380, damping: 38 } as const;

export const loadMotionFeatures = () => import('./motionFeatures').then((m) => m.default);

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
