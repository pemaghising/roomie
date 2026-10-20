// Local reminders for today's chores, in the person's chosen tone. Scheduled on the phone, so they work in Expo Go.

export type NudgeStyle = 'motivate' | 'facts';
export interface Nudge { id: string; title: string; body: string; at: Date }

/** Minutes the zone is ahead of UTC on that date ("GMT+05:45" → 345). */
function offsetMinutes(tz: string, at: Date): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
}

/** 19:00 on `day` in the household's zone, as an absolute time. */
export function sevenPm(day: string, tz: string): Date {
  const [y, mo, d] = day.split('-').map(Number);
  const naive = Date.UTC(y, mo - 1, d, 19, 0);
  return new Date(naive - offsetMinutes(tz, new Date(naive)) * 60_000);
}

export function planNudges(items: { id: string; name: string; status: string }[], style: NudgeStyle, today: string, streak: number, tz: string): Nudge[] {
  const at = sevenPm(today, tz);
  return items.filter((i) => i.status !== 'done').map((i) => ({
    id: i.id,
    title: 'Roomie',
    body: style === 'facts' ? `${i.name} is due today at 7 pm.`
      : streak > 1 ? `${i.name} is yours tonight. Keep the ${streak}-day streak going! 🌱` : `${i.name} is yours tonight. You’ve got this! 🌱`,
    at,
  }));
}
