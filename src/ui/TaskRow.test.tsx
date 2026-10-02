import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { TaskRow } from './TaskRow';

const chore = { id: 'c', name: 'Bathroom', icon: '🪣', effort: 3 as const, cadence: 'weekly' as const, active: true };
const base = { id: 'a', plan_id: 'p', chore_id: 'c', user_id: 'me', day: '2026-10-01', effort: 3 as const, claimed_by: null, done_at: null, reason: { code: 'credit' as const } };

test('tapping the circle completes the chore', async () => {
  const onComplete = vi.fn();
  render(<TaskRow chore={chore} assignment={{ ...base, status: 'todo' }} onComplete={onComplete} />);
  await userEvent.click(screen.getByRole('button', { name: 'Mark Bathroom done' }));
  expect(onComplete).toHaveBeenCalledOnce();
  expect(screen.getByText('Heavy')).toBeInTheDocument();
});

test('a done chore shows as checked and cannot be completed again', () => {
  render(<TaskRow chore={chore} assignment={{ ...base, status: 'done' }} onComplete={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Bathroom done' })).toHaveAttribute('aria-pressed', 'true');
});
