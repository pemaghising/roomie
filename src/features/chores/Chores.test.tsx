import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import Chores from './Chores';

const db = vi.hoisted(() => ({
  rpc: vi.fn(async (fn: string) => ({ data: fn === 'add_chore' ? 'new-chore' : null, error: null })),
  functions: { invoke: vi.fn(async () => ({ data: null, error: null })) },
}));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

test('missed by roommates can be claimed, and moves into my tasks', async () => {
  renderWithState(<Chores />, { state: fixture(), route: '/chores' });
  const pool = screen.getByRole('region', { name: 'Missed by roommates' });
  await userEvent.click(within(pool).getByRole('button', { name: 'Claim Mop bathroom floor' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('claim_assignment', { p_id: 'a-missed' }));
  expect(within(screen.getByRole('region', { name: 'My tasks' })).getByText('Mop bathroom floor')).toBeInTheDocument();
});

test('this week lists my days with their chores', async () => {
  const s = fixture();
  s.assignments.push({ ...s.assignments[0], id: 'a-fri', day: '2026-10-02' });
  renderWithState(<Chores />, { state: s, route: '/chores' });
  await userEvent.click(screen.getByRole('tab', { name: 'This week' }));
  expect(screen.getByRole('heading', { name: /friday/i })).toBeInTheDocument();
});

test('adding a chore asks for effort first, then plans it into this week', async () => {
  renderWithState(<Chores />, { state: fixture(), route: '/chores' });
  await userEvent.click(screen.getByRole('button', { name: 'Add chore' }));
  const sheet = await screen.findByRole('dialog', { name: 'Add new chore' });
  await userEvent.click(within(sheet).getByRole('radio', { name: 'Heavy' }));
  await userEvent.type(within(sheet).getByLabelText('Chore name'), 'Deep clean fridge');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Add to rotation' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('add_chore', { p_name: 'Deep clean fridge', p_icon: '🧽', p_effort: 3, p_cadence: 'weekly' }));
  await waitFor(() => expect(db.functions.invoke).toHaveBeenCalledWith('tick', { body: { choreId: 'new-chore' } }));
});

test('all chores lists the household’s chores with effort', async () => {
  renderWithState(<Chores />, { state: fixture(), route: '/chores' });
  await userEvent.click(screen.getByRole('tab', { name: 'All chores' }));
  const list = screen.getByRole('list', { name: 'Household chores' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(3);
});

test('this week always links to the whole-week plan', async () => {
  renderWithState(<Chores />, { state: fixture(), route: '/chores' });
  await userEvent.click(screen.getByRole('tab', { name: 'This week' }));
  expect(screen.getByRole('link', { name: /see the whole week/i })).toHaveAttribute('href', '/plan');
});

test('why-me on a chore I am covering thanks me and never shows the owner’s reason', async () => {
  const { WhySheet } = await import('./WhySheet');
  const s = fixture();
  const covering = { ...s.assignments[3], status: 'claimed' as const, claimed_by: 'me', reason: { code: 'debt' as const, coveredBy: 'me' } };
  renderWithState(<WhySheet assignment={covering} onClose={() => {}} />, { state: s });
  expect(screen.getByText("You're covering for Priya. Thanks.")).toBeInTheDocument();
  expect(screen.queryByText(/a little extra|covered for you/i)).toBeNull();
});

test('why-me copes with a reason the server kept private', async () => {
  const { WhySheet } = await import('./WhySheet');
  const s = fixture();
  renderWithState(<WhySheet assignment={{ ...s.assignments[2], reason: null }} onClose={() => {}} />, { state: s });
  expect(screen.getByText('Shared out fairly by effort.')).toBeInTheDocument();
});
