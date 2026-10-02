import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { STATE_KEY } from '../../lib/state';
import { fixture, renderWithState } from '../../test-utils';
import { ToastProvider } from '../../ui/Toast';
import { useChoreActions } from '../chores/useChoreActions';
import Home from './Home';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

test('greets me, shows the household streak and today’s tasks', () => {
  renderWithState(<Home />, { state: fixture() });
  expect(screen.getByRole('heading', { name: 'Hello, Rahul.' })).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
  const today = screen.getByRole('region', { name: "Today's tasks" });
  expect(within(today).getByText('Sweep living room')).toBeInTheDocument();
  expect(within(today).getByText('Take out trash')).toBeInTheDocument();
});

test('roommate cards count today’s tasks, with no ranking', () => {
  renderWithState(<Home />, { state: fixture() });
  expect(screen.getByText('Priya')).toBeInTheDocument();
  expect(screen.getByText('1 task')).toBeInTheDocument();
  expect(screen.queryByText(/rank|#1|leader/i)).toBeNull();
});

test('completing a task updates instantly and offers undo', async () => {
  renderWithState(<Home />, { state: fixture() });
  await userEvent.click(screen.getByRole('button', { name: 'Mark Take out trash done' }));
  expect(screen.getByRole('button', { name: 'Take out trash done' })).toHaveAttribute('aria-pressed', 'true');
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('complete_assignment', { p_id: 'a-trash' }));
  expect(await screen.findByRole('button', { name: 'Undo' })).toBeInTheDocument();
});

test('finishing the last task of the day celebrates', async () => {
  const s = fixture();
  s.assignments = s.assignments.map((a) => (a.id === 'a-sweep' ? { ...a, status: 'done' as const } : a));
  renderWithState(<Home />, { state: s });
  await userEvent.click(screen.getByRole('button', { name: 'Mark Take out trash done' }));
  expect(await screen.findByRole('dialog', { name: 'Wonderful job.' })).toBeInTheDocument();
});

test('tapping a task explains why it is mine', async () => {
  renderWithState(<Home />, { state: fixture() });
  await userEvent.click(screen.getByRole('button', { name: 'Sweep living room: why this is yours' }));
  const sheet = await screen.findByRole('dialog', { name: 'Sweep living room' });
  expect(within(sheet).getByText("Evens out effort: you're at 5 of 5 points this week.")).toBeInTheDocument();
  expect(within(sheet).getByText(/only you can see/i)).toBeInTheDocument();
});

test('shows the claim-pool teaser and a pending plan banner', () => {
  const s = fixture({ plans: [...fixture().plans, { id: 'n', week_start: '2026-10-05', status: 'draft', lock_at: '2026-10-04T12:15:00Z', approved_by: [] }] });
  renderWithState(<Home />, { state: s });
  expect(screen.getByRole('link', { name: /1 chore up for grabs/i })).toHaveAttribute('href', '/chores');
  expect(screen.getByRole('link', { name: /next week's plan is ready/i })).toHaveAttribute('href', '/plan');
});

test('a failed completion rolls back and never celebrates', async () => {
  const s = fixture();
  s.assignments = s.assignments.map((a) => (a.id === 'a-sweep' ? { ...a, status: 'done' as const } : a));
  db.rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } } as never);
  renderWithState(<Home />, { state: s });
  await userEvent.click(screen.getByRole('button', { name: 'Mark Take out trash done' }));
  expect(await screen.findByText("Something went wrong. We'll keep trying.")).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('button', { name: 'Mark Take out trash done' })).toBeInTheDocument();
});

test('the celebration waits for the RPC to resolve', async () => {
  const s = fixture();
  s.assignments = s.assignments.map((a) => (a.id === 'a-sweep' ? { ...a, status: 'done' as const } : a));
  let resolve!: (v: { data: null; error: null }) => void;
  db.rpc.mockImplementationOnce((() => new Promise((r) => { resolve = r; })) as never);
  renderWithState(<Home />, { state: s });
  await userEvent.click(screen.getByRole('button', { name: 'Mark Take out trash done' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('complete_assignment', { p_id: 'a-trash' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  resolve({ data: null, error: null });
  expect(await screen.findByRole('dialog', { name: 'Wonderful job.' })).toBeInTheDocument();
});

test('completing an already-done task does nothing (guard is unreachable via the UI)', async () => {
  const s = fixture();
  const done = { ...s.assignments[1], status: 'done' as const };
  s.assignments = s.assignments.map((a) => (a.id === done.id ? done : a));
  const qc = new QueryClient();
  qc.setQueryData(STATE_KEY, s);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}><ToastProvider>{children}</ToastProvider></QueryClientProvider>
  );
  const { result } = renderHook(() => useChoreActions(), { wrapper });
  act(() => result.current.complete(done));
  await new Promise((r) => setTimeout(r, 20));
  expect(db.rpc).not.toHaveBeenCalled();
  expect(result.current.celebration).toBeNull();
});

test('an incoming swap request shows a banner to the plan, even without push', () => {
  const s = fixture();
  s.swaps = [{ id: 'sw1', from_assignment: 'a-p-trash', to_assignment: 'a-sweep', from_user: 'p', to_user: 'me', status: 'pending' }];
  renderWithState(<Home />, { state: s });
  expect(screen.getByRole('link', { name: /priya wants to swap/i })).toHaveAttribute('href', '/plan');
});

test('no swap banner for my own outgoing requests', () => {
  const s = fixture();
  s.swaps = [{ id: 'sw1', from_assignment: 'a-sweep', to_assignment: 'a-p-trash', from_user: 'me', to_user: 'p', status: 'pending' }];
  renderWithState(<Home />, { state: s });
  expect(screen.queryByRole('link', { name: /wants to swap/i })).toBeNull();
});
