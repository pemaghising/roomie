const PATTERNS = { tap: 10, warning: [20, 40, 20] } as const;

export function haptic(kind: keyof typeof PATTERNS = 'tap'): void {
  try { navigator.vibrate?.(PATTERNS[kind] as number | number[]); } catch { /* unsupported device */ }
}
