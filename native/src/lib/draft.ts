// In-memory onboarding draft (the web keeps this in sessionStorage). Lost on app kill, which is fine for a 2-minute flow.
import { useSyncExternalStore } from 'react';
import type { Cadence, Effort } from '@domain/types.ts';
import type { Weekday } from '@domain/time.ts';

export const PASTELS = ['#ffedd5', '#dbeafe', '#d1fae5', '#fce7f3', '#fef3c7', '#e0e7ff'];

export interface DraftChore { key: string; name: string; icon: string; effort: Effort; cadence: Cadence; selected: boolean }
export interface Draft { name: string; email: string; mode: 'create' | 'join'; homeName: string; code: string; busyDays: Weekday[]; chores: DraftChore[] }

export const SUGGESTED: DraftChore[] = [
  { key: 'trash', name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily', selected: true },
  { key: 'sweep', name: 'Sweep living room', icon: '🧹', effort: 2, cadence: 'weekly', selected: true },
  { key: 'laundry', name: 'Do the laundry', icon: '🧺', effort: 2, cadence: 'weekly', selected: true },
  { key: 'vacuum', name: 'Vacuum rugs', icon: '🧽', effort: 2, cadence: 'weekly', selected: false },
  { key: 'dishes', name: 'Wash dishes', icon: '🍽️', effort: 1, cadence: 'daily', selected: false },
];

const fresh = (): Draft => ({ name: '', email: '', mode: 'create', homeName: '', code: '', busyDays: [], chores: SUGGESTED.map((c) => ({ ...c })) });

let draft = fresh();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const updateDraft = (patch: Partial<Draft>) => { draft = { ...draft, ...patch }; listeners.forEach((l) => l()); };
export const resetDraft = () => updateDraft(fresh());
export const useDraft = (): Draft => useSyncExternalStore(subscribe, () => draft);

/** Same rule as SQL normalize_code: letters/digits, uppercase, last 6 (so pasted links work). */
export function normalizeCode(input: string): string {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length > 6 ? s.slice(-6) : s;
}
