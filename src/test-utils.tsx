import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { STATE_KEY } from './lib/state';
import type { AppState, Assignment } from './lib/types';
import { ToastProvider } from './ui/Toast';

export function fixture(over: Partial<AppState> = {}): AppState {
  const today = '2026-10-01';
  const a = (id: string, chore_id: string, user_id: string, effort: 1 | 2 | 3, extra: Partial<Assignment> = {}): Assignment => ({
    id, plan_id: 'plan-cur', chore_id, user_id, day: today, effort, status: 'todo', claimed_by: null, done_at: null,
    reason: { code: 'balance', points: 5, target: 5 }, ...extra,
  });
  return {
    profile: { id: 'me', name: 'Rahul', color: '#d1fae5', nudge_style: 'motivate', activity_seen_at: '2026-10-01T00:00:00Z' },
    household: { id: 'h1', name: 'Flat 4B', invite_code: 'ABC123', plan_mode: 'review', tz: 'Asia/Kathmandu', day_ends_at: '22:00:00' },
    members: [
      { user_id: 'me', name: 'Rahul', color: '#d1fae5', role: 'owner', busy_days: [1, 3] },
      { user_id: 'p', name: 'Priya', color: '#dbeafe', role: 'member', busy_days: [] },
    ],
    chores: [
      { id: 'c-sweep', name: 'Sweep living room', icon: '🧹', effort: 2, cadence: 'weekly', active: true },
      { id: 'c-trash', name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily', active: true },
      { id: 'c-bath', name: 'Mop bathroom floor', icon: '🪣', effort: 3, cadence: 'weekly', active: true },
    ],
    plans: [{ id: 'plan-cur', week_start: '2026-09-27', status: 'locked', lock_at: '2026-09-26T12:15:00Z', approved_by: [] }],
    assignments: [
      a('a-sweep', 'c-sweep', 'me', 2),
      a('a-trash', 'c-trash', 'me', 1),
      a('a-p-trash', 'c-trash', 'p', 1),
      a('a-missed', 'c-bath', 'p', 3, { status: 'missed', day: '2026-09-30' }),
    ],
    swaps: [],
    streak: { current: 3, best: 5, last_settled_day: '2026-09-30' },
    balance: 0,
    activity: [],
    today,
    ...over,
  };
}

export function renderWithState(ui: ReactElement, opts: { state?: AppState; route?: string; path?: string } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  if (opts.state) qc.setQueryData(STATE_KEY, opts.state);
  const route = opts.route ?? '/';
  const result = render(
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={opts.path ?? route} element={ui} />
            <Route path="*" element={<p>navigated</p>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { qc, ...result };
}
