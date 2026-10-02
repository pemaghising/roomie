import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { renderWithState } from '../../test-utils';
import BusyStep from './BusyStep';
import ChoresStep from './ChoresStep';
import JoinStep from './JoinStep';
import { loadDraft, saveDraft } from './draft';

const api = vi.hoisted(() => ({ rpc: vi.fn(async () => 'new-id' as unknown), planNow: vi.fn(async () => {}) }));
vi.mock('../../lib/state', async (orig) => ({ ...(await orig<object>()), rpc: api.rpc, planNow: api.planNow }));

beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); });

test('chores step: basics pre-selected, effort taps cycle, continue needs one chore', async () => {
  saveDraft({ ...loadDraft(), mode: 'create', homeName: 'Flat 4B' });
  renderWithState(<ChoresStep />, { route: '/onboarding/chores' });
  expect(screen.getByRole('checkbox', { name: /take out trash/i })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: /vacuum rugs/i })).not.toBeChecked();

  await userEvent.click(screen.getByRole('button', { name: /take out trash effort: light/i }));
  expect(screen.getByRole('button', { name: /take out trash effort: medium/i })).toBeInTheDocument();

  for (const name of [/take out trash/i, /sweep living room/i, /do the laundry/i]) {
    await userEvent.click(screen.getByRole('checkbox', { name }));
  }
  expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
});

test('chores step: add a custom chore', async () => {
  renderWithState(<ChoresStep />, { route: '/onboarding/chores' });
  await userEvent.click(screen.getByRole('button', { name: /add custom chore/i }));
  await userEvent.type(screen.getByLabelText(/chore name/i), 'Water plants{enter}');
  expect(screen.getByRole('checkbox', { name: /water plants/i })).toBeChecked();
});

test('join step pre-fills a code from an invite link', () => {
  sessionStorage.setItem('roomie-invite', 'abc-123');
  renderWithState(<JoinStep />, { route: '/onboarding/join' });
  expect(screen.getByLabelText(/household code/i)).toHaveValue('ABC123');
});

test('busy step (create) creates the household with selected chores, plans it, then invites', async () => {
  saveDraft({ ...loadDraft(), mode: 'create', homeName: 'Flat 4B' });
  renderWithState(<BusyStep />, { route: '/onboarding/busy' });
  await userEvent.click(screen.getByRole('checkbox', { name: 'Monday' }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Friday' }));
  await userEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => expect(api.rpc).toHaveBeenCalledWith('create_household', {
    p_name: 'Flat 4B',
    p_busy: [0, 4],
    p_chores: [
      { name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily' },
      { name: 'Sweep living room', icon: '🧹', effort: 2, cadence: 'weekly' },
      { name: 'Do the laundry', icon: '🧺', effort: 2, cadence: 'weekly' },
    ],
  }));
  expect(api.planNow).toHaveBeenCalled();
  expect(await screen.findByText('navigated')).toBeInTheDocument();
});

test('busy step (join) with an unknown code says so', async () => {
  api.rpc.mockResolvedValueOnce(null);
  saveDraft({ ...loadDraft(), mode: 'join', code: 'ZZZZZZ' });
  renderWithState(<BusyStep />, { route: '/onboarding/busy' });
  await userEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(await screen.findByText(/doesn't match a household/i)).toBeInTheDocument();
});
