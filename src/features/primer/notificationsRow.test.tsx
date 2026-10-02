import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import { NotificationsRow } from './NotificationsRow';

vi.mock('../../lib/platform', () => ({ pushStatus: () => 'granted' }));
const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));

test('turning reminders off unsubscribes and shows the off state', async () => {
  const unsubscribe = vi.fn(async () => true);
  const sub = { endpoint: 'https://push.example/1', unsubscribe };
  vi.stubGlobal('navigator', { ...navigator, serviceWorker: { ready: Promise.resolve({ pushManager: { getSubscription: async () => sub } }) } });
  renderWithState(<NotificationsRow />, { state: fixture() });
  expect(screen.getByText('On for this device.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Turn off on this device' }));
  await waitFor(() => expect(screen.getByText('Off for this device.')).toBeInTheDocument());
  expect(db.rpc).toHaveBeenCalledWith('delete_push_subscription', { p_endpoint: 'https://push.example/1' });
  expect(unsubscribe).toHaveBeenCalled();
  vi.unstubAllGlobals();
});
