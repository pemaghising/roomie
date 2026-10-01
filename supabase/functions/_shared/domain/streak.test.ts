import { expect, test } from 'vitest';
import { dayOutcome, settleDay } from './streak.ts';

test('dayOutcome', () => {
  expect(dayOutcome([])).toBe('empty');
  expect(dayOutcome(['done', 'done'])).toBe('kept');
  expect(dayOutcome(['done', 'missed'])).toBe('pending');
  expect(dayOutcome(['done', 'claimed'])).toBe('pending');
  expect(dayOutcome(['done', 'expired'])).toBe('broken');
});
test('kept days grow the streak and best', () => {
  expect(settleDay({ current: 4, best: 4, lastSettledDay: '2026-10-01' }, '2026-10-02', 'kept'))
    .toEqual({ current: 5, best: 5, lastSettledDay: '2026-10-02' });
});
test('a broken day resets current but keeps best', () => {
  expect(settleDay({ current: 4, best: 9, lastSettledDay: null }, '2026-10-02', 'broken'))
    .toEqual({ current: 0, best: 9, lastSettledDay: '2026-10-02' });
});
test('empty days neither grow nor break the streak', () => {
  expect(settleDay({ current: 4, best: 9, lastSettledDay: null }, '2026-10-02', 'empty'))
    .toEqual({ current: 4, best: 9, lastSettledDay: '2026-10-02' });
});
test('a day is only ever settled once', () => {
  const s = { current: 4, best: 9, lastSettledDay: '2026-10-02' };
  expect(settleDay(s, '2026-10-02', 'kept')).toBe(s);
  expect(settleDay(s, '2026-10-01', 'broken')).toBe(s);
});
