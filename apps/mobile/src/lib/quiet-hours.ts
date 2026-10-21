// Quiet hours live on the phone: they only shape the reminders this phone schedules.
export const QUIET = [
  { id: '22-8', label: '10 pm – 8 am', from: 22, to: 8 },
  { id: '23-7', label: '11 pm – 7 am', from: 23, to: 7 },
  { id: 'off', label: 'Off', from: 0, to: 0 },
] as const;
export type Quiet = (typeof QUIET)[number];

const KEY = 'roomie-quiet-hours';
export const getQuiet = (): Quiet => {
  try { return QUIET.find((q) => q.id === localStorage.getItem(KEY)) ?? QUIET[0]; } catch { return QUIET[0]; }
};
export const setQuiet = (q: Quiet) => { try { localStorage.setItem(KEY, q.id); } catch { /* falls back to the default */ } };

/** True when the hour falls inside the window, which may wrap past midnight. */
export const isQuiet = (q: Quiet, hour: number) => q.from !== q.to && (q.from < q.to ? hour >= q.from && hour < q.to : hour >= q.from || hour < q.to);
