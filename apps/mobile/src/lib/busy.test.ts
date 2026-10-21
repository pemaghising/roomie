import { expect, test } from 'vitest';
import { busyLabel } from './busy';

test('busy days read like frame 10, in week order', () => {
  expect(busyLabel([5, 2, 4])).toBe('Tue, Thu and Fri');
  expect(busyLabel([3])).toBe('Wed');
  expect(busyLabel([0, 6])).toBe('Sun and Sat');
  expect(busyLabel([])).toBe('');
});
