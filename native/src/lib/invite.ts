import { normalizeCode } from './draft';

const KEY = 'roomie:pending-invite';

/** Remember the code from an invite link while the person signs in or signs up. */
export function savePendingInvite(raw: string): void {
  const code = normalizeCode(raw);
  if (code.length !== 6) return;
  try { localStorage.setItem(KEY, code); } catch { /* the code can still be typed in */ }
}

/** The remembered code, once: reading it clears it. */
export function takePendingInvite(): string | null {
  try {
    const code = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    return code && code.length === 6 ? code : null;
  } catch {
    return null;
  }
}
