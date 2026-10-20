import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import type { AppState } from '../../lib/types';
import PlanReview from './PlanReview';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
// freeze only Date: the fixture's draft locks 2026-10-03, so the lock copy must not depend on the real clock
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-01T09:15:00Z')); });
afterEach(() => vi.useRealTimers());

const withDraft = (): AppState => {
  const s = fixture();
  s.plans.push({ id: 'plan-next', week_start: '2026-10-04', status: 'draft', lock_at: '2026-10-03T12:15:00Z', approved_by: ['p'] });
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
  expect(screen.getByText('Draft · locks Saturday 6 pm')).toBeInTheDocument();
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

test('lock copy follows lock_at in the household timezone', () => {
  const s = withDraft();
  s.household!.tz = 'Europe/London';
  renderWithState(<PlanReview />, { state: s, route: '/plan' });
  expect(screen.getByText('Draft · locks Saturday 1:15 pm')).toBeInTheDocument();
});

test('a draft past its lock time says it is locking now', () => {
  const s = withDraft();
  s.plans.find((p) => p.id === 'plan-next')!.lock_at = '2020-01-01T00:00:00Z';
  renderWithState(<PlanReview />, { state: s, route: '/plan' });
  expect(screen.getByText('Draft · locking now')).toBeInTheDocument();
});

test('accepting a swap confirms with a toast', async () => {
  const s = withDraft();
  s.swaps = [{ id: 'sw1', from_assignment: 'n-theirs', to_assignment: 'n-mine', from_user: 'p', to_user: 'me', status: 'pending' }];
  renderWithState(<PlanReview />, { state: s, route: '/plan' });
  await userEvent.click(within(screen.getByRole('region', { name: 'Swap request' })).getByRole('button', { name: 'Accept' }));
  expect(await screen.findByText("Swapped — it's on your list.")).toBeInTheDocument();
});

test('a locked plan (auto mode, no draft) still takes swap requests', async () => {
  const s = fixture();
  s.household!.plan_mode = 'auto';
  s.assignments.push({ ...s.assignments[2], id: 'a-p-fri', day: '2026-10-02', effort: 1 });
  renderWithState(<PlanReview />, { state: s, route: '/plan' });
  expect(screen.getByText('Locked')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Swap a chore' }));
  const sheet = await screen.findByRole('dialog', { name: 'Swap a chore' });
  await userEvent.click(within(sheet).getByRole('radio', { name: /take out trash · thu/i }));
  await userEvent.click(within(sheet).getByRole('radio', { name: /take out trash · fri · priya/i }));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Send request' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('request_swap', { p_from: 'a-trash', p_to: 'a-p-fri' }));
});

test('with a draft and this week both around, I can switch back to this week', async () => {
  const s = withDraft();
  s.plans.find((p) => p.id === 'plan-next')!.approved_by = ['p', 'me'];
  s.swaps = [{ id: 'sw1', from_assignment: 'a-p-trash', to_assignment: 'a-trash', from_user: 'p', to_user: 'me', status: 'pending' }];
  renderWithState(<PlanReview />, { state: s, route: '/plan' });
  expect(screen.getByText(/you approved · locking soon/i)).toBeInTheDocument(); // approver status stays visible after I approve
  expect(screen.getByRole('region', { name: 'Swap request' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'This week' }));
  expect(screen.getByRole('heading', { name: 'This week' })).toBeInTheDocument();
  expect(screen.getByText('Locked')).toBeInTheDocument();
});
