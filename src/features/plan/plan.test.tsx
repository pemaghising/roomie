import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import type { AppState } from '../../lib/types';
import PlanReview from './PlanReview';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

const withDraft = (): AppState => {
  const s = fixture();
  s.plans.push({ id: 'plan-next', week_start: '2026-10-05', status: 'draft', lock_at: '2026-10-04T12:15:00Z', approved_by: ['p'] });
  const base = { plan_id: 'plan-next', status: 'todo' as const, claimed_by: null, done_at: null, reason: { code: 'credit' as const } };
  s.assignments.push(
    { ...base, id: 'n-mine', chore_id: 'c-trash', user_id: 'me', day: '2026-10-06', effort: 1 },
    { ...base, id: 'n-theirs', chore_id: 'c-bath', user_id: 'p', day: '2026-10-07', effort: 3 },
  );
  return s;
};

test('shows next week’s draft with each person’s points and approves it', async () => {
  renderWithState(<PlanReview />, { state: withDraft(), route: '/plan' });
  expect(screen.getByRole('heading', { name: 'Next week' })).toBeInTheDocument();
  expect(screen.getByText(/draft · locks sunday 6 pm/i)).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Priya' })).toHaveTextContent('3 pts');
  await userEvent.click(screen.getByRole('button', { name: 'Looks good' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('approve_plan', { p_plan: 'plan-next' }));
  expect(await screen.findByText(/you approved/i)).toBeInTheDocument();
});

test('incoming swap requests can be accepted', async () => {
  const s = withDraft();
  s.swaps = [{ id: 'sw1', from_assignment: 'n-theirs', to_assignment: 'n-mine', from_user: 'p', to_user: 'me', status: 'pending' }];
  renderWithState(<PlanReview />, { state: s, route: '/plan' });
  const card = screen.getByRole('region', { name: 'Swap request' });
  expect(card).toHaveTextContent('Priya wants to trade their Mop bathroom floor for your Take out trash');
  await userEvent.click(within(card).getByRole('button', { name: 'Accept' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('respond_swap', { p_swap: 'sw1', p_accept: true }));
});

test('requesting a swap shows the effort difference before sending', async () => {
  renderWithState(<PlanReview />, { state: withDraft(), route: '/plan' });
  await userEvent.click(screen.getByRole('button', { name: 'Request a swap' }));
  const sheet = await screen.findByRole('dialog', { name: 'Swap a chore' });
  await userEvent.click(within(sheet).getByRole('radio', { name: /take out trash · tue/i }));
  await userEvent.click(within(sheet).getByRole('radio', { name: /mop bathroom floor · wed · priya/i }));
  expect(within(sheet).getByText(/you'd take on 2 more points/i)).toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: 'Send request' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('request_swap', { p_from: 'n-mine', p_to: 'n-theirs' }));
});

test('with no draft it shows this week’s locked plan', () => {
  renderWithState(<PlanReview />, { state: fixture(), route: '/plan' });
  expect(screen.getByRole('heading', { name: 'This week' })).toBeInTheDocument();
  expect(screen.getByText('Locked')).toBeInTheDocument();
});
