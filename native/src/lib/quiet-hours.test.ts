import { expect, test } from 'vitest';
import { isQuiet, QUIET } from './quiet-hours';

test('a window that wraps midnight', () => {
  expect([21, 22, 3, 7, 8].map((h) => isQuiet(QUIET[0], h))).toEqual([false, true, true, true, false]);
});
test('off is never quiet', () => expect(isQuiet(QUIET[2], 23)).toBe(false));
