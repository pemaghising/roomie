import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Celebration } from './Celebration';

test('shows streak and tasks-done stats when celebrating all_done', () => {
  render(<Celebration info={{ kind: 'all_done', streak: 4, doneToday: 3 }} onClose={vi.fn()} />);
  expect(screen.getByText('Wonderful job.')).toBeInTheDocument();
  expect(screen.getByText('4')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
});

test('renders nothing when info is null', () => {
  render(<Celebration info={null} onClose={vi.fn()} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
