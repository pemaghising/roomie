import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
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
