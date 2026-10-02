import { afterEach, expect, test, vi } from 'vitest';
import { haptic } from './haptics';

const ua = navigator.userAgent;
const setUA = (v: string) => Object.defineProperty(navigator, 'userAgent', { value: v, configurable: true });
const setVibrate = (v: unknown) => Object.defineProperty(navigator, 'vibrate', { value: v, configurable: true });
afterEach(() => { setUA(ua); setVibrate(undefined); });

test('buzzes lightly where the vibration API exists (Android)', () => {
  const vibrate = vi.fn(() => true);
  setVibrate(vibrate);
  setUA('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/129');
  haptic('success');
  expect(vibrate).toHaveBeenCalledWith([10, 60, 14]);
});

test('is a silent no-op without navigator.vibrate', () => {
  setVibrate(undefined);
  expect(() => haptic('warning')).not.toThrow();
});

test('never vibrates on iOS', () => {
  const vibrate = vi.fn(() => true);
  setVibrate(vibrate);
  setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15');
  haptic();
  expect(vibrate).not.toHaveBeenCalled();
});

test('swallows a browser that throws', () => {
  setVibrate(() => { throw new Error('blocked'); });
  setUA('Mozilla/5.0 (Linux; Android 14)');
  expect(() => haptic()).not.toThrow();
});
