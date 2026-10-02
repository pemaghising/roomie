import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { Sheet, sheetDismisses } from './Sheet';

test('dragging the sheet down closes it past 120px or on a downward fling', () => {
  expect(sheetDismisses(130, 0)).toBe(true);
  expect(sheetDismisses(60, 200)).toBe(false);
  expect(sheetDismisses(30, 700)).toBe(true);
  expect(sheetDismisses(-50, -900)).toBe(false);
});

test('Escape still closes the sheet', async () => {
  const onClose = vi.fn();
  render(<Sheet open onClose={onClose} title="Edit profile"><p>body</p></Sheet>);
  expect(screen.getByRole('dialog', { name: 'Edit profile' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledOnce();
});
