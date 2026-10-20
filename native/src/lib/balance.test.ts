import { expect, test } from 'vitest';
import { balanceWords, effortSegments } from './balance';

test('balance is only ever words, never a number', () => {
  expect(balanceWords(0)).toEqual({ label: 'On track', sentence: 'You’re all square with the house.' });
  expect(balanceWords(3)).toEqual({ label: 'On track', sentence: 'You’ve done a bit extra. Your next week gets lighter.' });
  expect(balanceWords(-2)).toEqual({ label: 'Catching up', sentence: 'A little more comes your way this week, never on busy days.' });
  for (const b of [-5, 0, 5]) expect(JSON.stringify(balanceWords(b))).not.toMatch(/\d/);
});

test('the effort bar fills 9 segments by how much of this week is done', () => {
  expect(effortSegments(7, 9)).toBe(7);
  expect(effortSegments(0, 9)).toBe(0);
  expect(effortSegments(5, 5)).toBe(9);
  expect(effortSegments(3, 0)).toBe(9);
});
