import { afterEach, expect, test, vi } from 'vitest';
import { clearStreakGoal, getStreakGoal, setStreakGoal } from './streakGoal';

afterEach(() => { vi.restoreAllMocks(); clearStreakGoal(); });

test('returns null when no goal is set', () => {
  expect(getStreakGoal()).toBeNull();
});

test('round-trips a goal through storage', () => {
  setStreakGoal(7);
  expect(getStreakGoal()).toBe(7);
});

test('returns null instead of throwing when storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(getStreakGoal()).toBeNull();
});

test('setStreakGoal does not throw when storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(() => setStreakGoal(5)).not.toThrow();
});
