type AuthErr = { status?: number; message?: string };

/** Friendly copy for email-code errors, matching frame 05b. */
export function otpMessage(error: unknown): string {
  const e = (error ?? {}) as AuthErr;
  if (e.status === 429 || /rate limit/i.test(e.message ?? '')) return 'Too many tries. Wait a minute, then send a new one.';
  if ((e.status && e.status < 500) || /expired|invalid|token/i.test(e.message ?? '')) return 'Hmm, wrong code.';
  return 'Couldn’t reach Roomie. Check your connection and try again.';
}

/** Seconds until "Send a new one" is allowed again (30 s after the last code). */
export const resendCooldown = (lastSentAt: number, now: number) =>
  Math.max(0, 30 - Math.floor((now - lastSentAt) / 1000));
