import { screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import Activity from './Activity';
import { activityText } from './text';

const db = vi.hoisted(() => ({ rpc: vi.fn(async () => ({ data: null, error: null })) }));
vi.mock('../../lib/supabase', () => ({ supabase: db }));
beforeEach(() => vi.clearAllMocks());

const names = { me: 'Rahul', p: 'Priya' };
const item = (kind: string, actor: string | null, payload: Record<string, unknown> = {}) =>
  ({ id: 1, kind, actor, payload, created_at: '2026-10-01T05:00:00Z' });

test.each([
  [item('completed', 'p', { chore: 'Bathroom' }), 'Priya finished Bathroom'],
  [item('completed', 'me', { chore: 'Bathroom' }), 'You finished Bathroom'],
  [item('claimed', 'p', { chore: 'Mop floor' }), 'Priya grabbed Mop floor'],
  [item('covered', 'p', { chore: 'Mop floor' }), 'Priya covered Mop floor'],
  [item('joined', 'p'), 'Priya joined the home'],
  [item('left', 'p'), 'Priya left the home'],
  [item('chore_added', 'p', { chore: 'Plants' }), 'Priya added Plants'],
  [item('swapped', 'p', { with: 'Rahul' }), 'Priya swapped a chore with Rahul'],
  [item('pool', null), 'Some chores are up for grabs'],
  [item('plan_ready', null), "Next week's plan is ready to review"],
  [item('plan_locked', null), 'The weekly plan is locked in'],
  [item('day_kept', null, { streak: 4 }), '4-day streak — house peace secured'],
  [item('created', 'me'), 'You created the home'],
])('activityText %#', (i, text) => expect(activityText(i, names, 'me')).toBe(text));

test('activity screen lists events and marks them seen', async () => {
  const s = fixture({ activity: [item('completed', 'p', { chore: 'Bathroom' })] });
  renderWithState(<Activity />, { state: s, route: '/activity' });
  expect(screen.getByText('Priya finished Bathroom')).toBeInTheDocument();
  await waitFor(() => expect(db.rpc).toHaveBeenCalledWith('mark_activity_seen', undefined));
});
