import { expect, test } from 'vitest';
import { monthGrid } from './month-grid';

test('October 2026 starts on a Thursday: four blanks, then the 1st', () => {
  const g = monthGrid(2026, 10);
  expect(g[0]).toEqual([null, null, null, null, '2026-10-01', '2026-10-02', '2026-10-03']);
  expect(g).toHaveLength(5);
  expect(g[4][6]).toBe('2026-10-31');
});

test('a month that starts on Sunday has no leading blanks', () => {
  expect(monthGrid(2026, 2)[0][0]).toBe('2026-02-01');
});

test('every week is seven cells and trailing days are blank', () => {
  const g = monthGrid(2026, 11);
  expect(g.every((w) => w.length === 7)).toBe(true);
  expect(g[g.length - 1].filter(Boolean).at(-1)).toBe('2026-11-30');
});
