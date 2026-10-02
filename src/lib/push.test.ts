import { afterEach, expect, test, vi } from 'vitest';
import { disablePush, urlBase64ToUint8Array } from './push';
import { pushStatus } from './platform';
const rpc = vi.hoisted(() => vi.fn());vi.mock('./state', () => ({ rpc }));

afterEach(() => vi.unstubAllGlobals());

test('urlBase64ToUint8Array decodes URL-safe base64 without padding', () => {
  expect(Array.from(urlBase64ToUint8Array('AQID_-8'))).toEqual([1, 2, 3, 255, 239]);
});

test('iPhone in Safari needs the app installed before push can work', async () => {
  vi.stubGlobal('navigator', { ...navigator, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)', maxTouchPoints: 5, standalone: false });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  expect(await pushStatus()).toBe('needs_install');
});

test('a browser without the Push API is unsupported', async () => {
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', maxTouchPoints: 0 });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  expect(await pushStatus()).toBe('unsupported');
});

const desktop = (sub: unknown) => {
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', maxTouchPoints: 0,
    serviceWorker: { getRegistration: async () => ({ pushManager: { getSubscription: async () => sub } }) } });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('PushManager', function PushManager() {});
  vi.stubGlobal('Notification', { permission: 'granted' });
};

test('permission granted but no subscription on this device reads as off', async () => {
  desktop(null);
  expect(await pushStatus()).toBe('default');
});

test('a live subscription reads as on', async () => {
  desktop({ endpoint: 'https://push.example/1' });
  expect(await pushStatus()).toBe('granted');
});

test('signing out offline still unsubscribes this device, so it stops getting the old user\'s pushes', async () => {
  const unsubscribe = vi.fn(async () => true);
  desktop({ endpoint: 'https://fcm.googleapis.com/fcm/send/x', unsubscribe });
  rpc.mockRejectedValueOnce(new Error('offline'));
  await expect(disablePush()).rejects.toThrow('offline');
  expect(unsubscribe).toHaveBeenCalled();
});
