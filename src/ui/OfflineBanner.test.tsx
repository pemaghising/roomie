import { act, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { OfflineBanner } from './OfflineBanner';

test('appears when the connection drops and leaves when it returns', () => {
  render(<OfflineBanner />);
  expect(screen.queryByRole('status')).toBeNull();
  act(() => { Object.defineProperty(navigator, 'onLine', { value: false, configurable: true }); window.dispatchEvent(new Event('offline')); });
  expect(screen.getByRole('status')).toHaveTextContent("You're offline — changes will sync");
  act(() => { Object.defineProperty(navigator, 'onLine', { value: true, configurable: true }); window.dispatchEvent(new Event('online')); });
  expect(screen.queryByRole('status')).toBeNull();
});
