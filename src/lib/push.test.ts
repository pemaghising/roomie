import { afterEach, expect, test, vi } from 'vitest';
import { urlBase64ToUint8Array } from './push';
import { pushStatus } from './platform';

afterEach(() => vi.unstubAllGlobals());

test('urlBase64ToUint8Array decodes URL-safe base64 without padding', () => {
  expect(Array.from(urlBase64ToUint8Array('AQID_-8'))).toEqual([1, 2, 3, 255, 239]);
});

test('iPhone in Safari needs the app installed before push can work', () => {
  vi.stubGlobal('navigator', { ...navigator, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)', maxTouchPoints: 5, standalone: false });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  expect(pushStatus()).toBe('needs_install');
});

test('a browser without the Push API is unsupported', () => {
  vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', maxTouchPoints: 0 });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  expect(pushStatus()).toBe('unsupported');
});
