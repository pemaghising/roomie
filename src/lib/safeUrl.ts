/** Only same-origin targets are allowed; anything else (other origin, garbage) falls back to the app root. */
export function safeTarget(raw: unknown, origin: string): string {
  const root = new URL('/', origin);
  try {
    const t = new URL(typeof raw === 'string' ? raw : '/', origin);
    return (t.origin === root.origin ? t : root).href;
  } catch { return root.href; }
}
