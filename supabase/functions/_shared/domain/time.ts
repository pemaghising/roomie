/** 0 = Sunday … 6 = Saturday — the one weekday convention used across the app and database. Weeks start on Sunday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const DAY_MS = 86_400_000;
const toUtc = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function addDays(date: string, n: number): string {
  return fromUtc(toUtc(date) + n * DAY_MS);
}

export function weekdayOf(date: string): Weekday {
  return new Date(toUtc(date)).getUTCDay() as Weekday;
}

export function weekStartOf(date: string): string {
  return addDays(date, -weekdayOf(date));
}

export function dateOfWeekday(weekStart: string, day: Weekday): string {
  return addDays(weekStart, day);
}

export function weeksBetween(fromWeek: string, toWeek: string): number {
  return Math.round((toUtc(toWeek) - toUtc(fromWeek)) / (7 * DAY_MS));
}

export interface LocalParts { date: string; weekday: Weekday; hour: number; minute: number }

export function localParts(now: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const date = `${get('year')}-${get('month')}-${get('day')}`;
  return { date, weekday: weekdayOf(date), hour: Number(get('hour')), minute: Number(get('minute')) };
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
