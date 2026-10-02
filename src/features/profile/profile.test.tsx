import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import HouseholdSettings from './HouseholdSettings';
import Profile from './Profile';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })), auth: { signOut: vi.fn() } }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

test('shows my private balance in words, never a rank', () => {
  renderWithState(<Profile />, { state: fixture({ balance: 2 }), route: '/profile' });
  expect(screen.getByText("You'll pick up 2 extra points over the next week.")).toBeInTheDocument();
  expect(screen.getByText(/only you can see this/i)).toBeInTheDocument();
  expect(screen.queryByText(/rank|#1|leaderboard/i)).toBeNull();
});

test('changing nudge style saves immediately', async () => {
  renderWithState(<Profile />, { state: fixture(), route: '/profile' });
  await userEvent.click(screen.getByRole('radio', { name: /just the facts/i }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('update_profile', { p_nudge: 'facts' }));
  expect(screen.getByRole('radio', { name: /just the facts/i })).toHaveAttribute('aria-checked', 'true');
});

test('toggling a busy day saves the new set', async () => {
  renderWithState(<Profile />, { state: fixture(), route: '/profile' });
  await userEvent.click(screen.getByRole('checkbox', { name: 'Wednesday' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('update_busy_days', { p_days: [0] }));
});

test('the owner can remove a roommate after confirming', async () => {
  renderWithState(<Profile />, { state: fixture(), route: '/profile' });
  await userEvent.click(screen.getByRole('button', { name: 'Remove Priya' }));
  const sheet = await screen.findByRole('dialog', { name: 'Remove Priya?' });
  await userEvent.click(within(sheet).getByRole('button', { name: 'Remove' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('remove_member', { p_user: 'p' }));
});

test('leaving asks first, then leaves', async () => {
  renderWithState(<Profile />, { state: fixture(), route: '/profile' });
  await userEvent.click(screen.getByRole('button', { name: 'Leave household' }));
  const sheet = await screen.findByRole('dialog', { name: 'Leave Flat 4B?' });
  await userEvent.click(within(sheet).getByRole('button', { name: 'Leave' }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('leave_household', undefined));
});

test('household settings: switch to automatic plans', async () => {
  renderWithState(<HouseholdSettings />, { state: fixture(), route: '/profile/household' });
  await userEvent.click(screen.getByRole('radio', { name: /apply automatically/i }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('update_household', { p_plan_mode: 'auto' }));
});

test('rotating the invite code needs a second tap', async () => {
  renderWithState(<HouseholdSettings />, { state: fixture(), route: '/profile/household' });
  await userEvent.click(screen.getByRole('button', { name: /make a new code/i }));
  expect(db.rpc).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: /old code stops working/i }));
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('rotate_invite_code', undefined));
});
