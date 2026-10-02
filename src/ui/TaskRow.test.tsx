import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { swipeCompletes, TaskRow } from './TaskRow';

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

test('a swipe completes past 40% of the row or on a fling, and springs back otherwise', () => {
  expect(swipeCompletes(140, 320, 0)).toBe(true); // 44% of the row
  expect(swipeCompletes(60, 320, 120)).toBe(false); // a small, slow drag
  expect(swipeCompletes(40, 320, 800)).toBe(true); // a quick flick
  expect(swipeCompletes(-200, 320, -900)).toBe(false); // leftward never completes
});
