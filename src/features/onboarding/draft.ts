import { useState } from 'react';
import type { Cadence, Effort } from '@domain/types.ts';
import type { Weekday } from '@domain/time.ts';

export const PASTELS = ['#ffedd5', '#dbeafe', '#d1fae5', '#fce7f3', '#fef3c7', '#e0e7ff'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface DraftChore { key: string; name: string; icon: string; effort: Effort; cadence: Cadence; selected: boolean }
export interface Draft { mode: 'create' | 'join'; homeName: string; code: string; busyDays: Weekday[]; chores: DraftChore[] }

export const SUGGESTED: DraftChore[] = [
  { key: 'trash', name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily', selected: true },
  { key: 'sweep', name: 'Sweep living room', icon: '🧹', effort: 2, cadence: 'weekly', selected: true },
  { key: 'laundry', name: 'Do the laundry', icon: '🧺', effort: 2, cadence: 'weekly', selected: true },
  { key: 'vacuum', name: 'Vacuum rugs', icon: '🧽', effort: 2, cadence: 'weekly', selected: false },
  { key: 'dishes', name: 'Wash dishes', icon: '🍽️', effort: 1, cadence: 'daily', selected: false },
];

const KEY = 'roomie-onboarding';
const fresh = (): Draft => ({ mode: 'create', homeName: '', code: '', busyDays: [], chores: SUGGESTED.map((c) => ({ ...c })) });

export const loadDraft = (): Draft => {
  try { return { ...fresh(), ...JSON.parse(sessionStorage.getItem(KEY) ?? '{}') }; } catch { return fresh(); }
};
export const saveDraft = (d: Draft) => sessionStorage.setItem(KEY, JSON.stringify(d));
export const clearDraft = () => sessionStorage.removeItem(KEY);

export function useDraft(): [Draft, (patch: Partial<Draft>) => void] {
  const [draft, setDraft] = useState(loadDraft);
  const update = (patch: Partial<Draft>) => setDraft((d) => { const next = { ...d, ...patch }; saveDraft(next); return next; });
  return [draft, update];
}
