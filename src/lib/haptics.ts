import { isIOS } from './platform';

const PATTERNS = { light: 8, success: [10, 60, 14], warning: [24, 80, 24] } as const;
export type Haptic = keyof typeof PATTERNS;

/**
 * A very light buzz on Android. iOS Safari has no web vibration API, so it (and anything else without
 * navigator.vibrate) is a silent no-op.
 */
export function haptic(kind: Haptic = 'light') {
  if (isIOS() || typeof navigator.vibrate !== 'function') return;
  try { navigator.vibrate(PATTERNS[kind] as number | number[]); } catch { /* blocked by the browser: fine */ }
}
