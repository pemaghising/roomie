import { expect, test, vi } from 'vitest';

const calls = vi.hoisted(() => [] as string[]);
vi.mock('../../lib/supabase', () => ({ supabase: { auth: { signOut: vi.fn(async () => { calls.push('auth.signOut'); }) } } }));
vi.mock('../../lib/push', () => ({ disablePush: vi.fn(async () => { calls.push('disablePush'); throw new Error('offline'); }) }));
vi.mock('../../lib/queryClient', () => ({
  queryClient: { clear: vi.fn(() => calls.push('clear')) },
  persister: { removeClient: vi.fn(async () => { calls.push('removeClient'); }) },
}));

test('sign-out drops this device’s push subscription first (while the session still exists), even if that fails', async () => {
  const { signOut } = await import('./AuthProvider');
  await signOut();
  expect(calls).toEqual(['disablePush', 'auth.signOut', 'clear', 'removeClient']);
});
