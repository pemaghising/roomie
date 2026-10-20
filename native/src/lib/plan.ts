/** "Draft · locks Saturday 6 pm" in the household's timezone, or "Draft · locking now" once the time has passed. */
export function lockCopy(lockAt: string, tz: string, now = new Date()): string {
  if (new Date(lockAt).getTime() <= now.getTime()) return 'Draft · locking now';
  const parts = new Intl.DateTimeFormat('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit', timeZone: tz }).formatToParts(new Date(lockAt));
  const g = (t: string) => parts.find((x) => x.type === t)?.value ?? '';
  const min = g('minute') === '00' ? '' : `:${g('minute')}`;
  return `Draft · locks ${g('weekday')} ${g('hour')}${min} ${g('dayPeriod').toLowerCase()}`;
}

/** What a swap does to your points: positive = you take on more. */
export function swapSentence(delta: number): string {
  const n = Math.abs(delta);
  const pts = `${n} point${n === 1 ? '' : 's'}`;
  if (delta > 0) return `You'd take on ${n} more point${n === 1 ? '' : 's'}. Your balance gets the credit.`;
  if (delta < 0) return `You'd hand off ${pts}. It evens out next week.`;
  return 'An even trade.';
}
