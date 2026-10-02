import { screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { fixture, renderWithState } from '../../test-utils';
import { InstallPrimer } from './InstallPrimer';

const platform = vi.hoisted(() => ({ status: 'needs_install' as string }));
vi.mock('../../lib/platform', () => ({
  pushStatus: () => platform.status, canInstall: () => false, promptInstall: vi.fn(), isIOS: () => true, isStandalone: () => false,
}));
vi.mock('../../lib/push', () => ({ enablePush: vi.fn(async () => true), disablePush: vi.fn() }));
beforeEach(() => localStorage.clear());

test('on iPhone Safari it explains Add to Home Screen first', () => {
  renderWithState(<InstallPrimer />, { state: fixture() });
  expect(screen.getByRole('complementary', { name: 'Install Roomie' })).toBeInTheDocument();
  expect(screen.getByText(/add to home screen/i, { selector: 'li' })).toBeInTheDocument();
});

test('once installed it explains why before asking for permission', () => {
  platform.status = 'default';
  renderWithState(<InstallPrimer />, { state: fixture() });
  expect(screen.getByText(/so nobody has to ask/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Turn on reminders' })).toBeInTheDocument();
});

test('stays out of the way once reminders are on', () => {
  platform.status = 'granted';
  const { container } = renderWithState(<InstallPrimer />, { state: fixture() });
  expect(container.querySelector('.primer')).toBeNull();
});
