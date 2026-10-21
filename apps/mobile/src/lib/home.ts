// Everything Home (frames H0–H8) needs, derived from the state snapshot. Pure, so every state is testable.
import { addDays, weekStartOf } from '@domain/time.ts';
import type { DayState } from '@/ui/v2/streak';
import { greeting } from './greeting';
import { pool, myTasksOn } from './selectors';
import type { AppState, Assignment } from './types';

const fmtDate = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`);
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return `${weekday}, ${date}`;
};

const localHour = (tz: string) => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(new Date()));

export interface HomeView {
  firstName: string; hello: string; dateLabel: string;
  streakDays: number; week: DayState[]; drooped: boolean;
  poolCount: number; showPool: boolean;
  tasks: Assignment[]; state: 'todo' | 'allDone' | 'nothingDue';
  upcoming: Assignment[]; alone: boolean;
}

export function homeView(s: AppState, me: string, hour = localHour(s.household?.tz ?? 'Asia/Kathmandu')): HomeView {
  const streakDays = s.streak?.current ?? 0;
  const start = weekStartOf(s.today);
  const live = s.assignments.filter((a) => a.status !== 'expired');
  const week = Array.from({ length: 7 }, (_, i): DayState => {
    const day = addDays(start, i);
    if (day > s.today) return 'future';
    if (day === s.today) return 'today';
    const rows = live.filter((a) => a.day === day);
    if (rows.some((a) => a.status === 'missed')) return 'missed';
    if (rows.length && rows.every((a) => a.status === 'done' || a.status === 'claimed')) return 'done';
    // nothing was due that day: it still counts while it sits inside the current streak
    return addDays(s.today, -streakDays) <= day ? 'done' : 'none';
  });
  const waiting = pool(s, me).length + s.assignments.filter((a) => a.status === 'missed' && a.user_id === me).length;
  const tasks = myTasksOn(s, me, s.today);
  const state = tasks.length === 0 ? 'nothingDue' : tasks.every((t) => t.status === 'done') ? 'allDone' : 'todo';
  return {
    firstName: (s.profile.name || '').split(' ')[0],
    hello: greeting(hour),
    dateLabel: fmtDate(s.today),
    streakDays,
    week,
    drooped: waiting > 0,
    poolCount: waiting,
    showPool: waiting > 0 && state !== 'allDone',
    tasks,
    state,
    upcoming: live.filter((a) => a.user_id === me && a.status === 'todo' && a.day > s.today).sort((a, b) => a.day.localeCompare(b.day)).slice(0, 3),
    alone: s.members.length <= 1,
  };
}
