import { expect, test } from 'vitest';
import { applyClaim, applyExpiry, applySwap, consumeIntoPlan, swapDelta } from './ledger.ts';

test('a claim moves the effort from the person who missed to the claimer', () => {
  expect(applyClaim({ a: 0, b: 0 }, 'a', 'b', 3)).toEqual({ a: 3, b: -3 });
});
test('expiry adds the effort to the person who missed it only', () => {
  expect(applyExpiry({ a: 1 }, 'a', 2)).toEqual({ a: 3 });
});
test('swapping a light task for a heavy one credits the requester', () => {
  // a gives away a Light (1) and takes b's Heavy (3): a now does 2 more → a is owed 2
  expect(applySwap({ a: 0, b: 0 }, 'a', 1, 'b', 3)).toEqual({ a: -2, b: 2 });
  expect(swapDelta(1, 3)).toBe(2);
});
test('equal swaps change nothing', () => {
  expect(applySwap({ a: 1, b: -1 }, 'a', 2, 'b', 2)).toEqual({ a: 1, b: -1 });
});
test('a plan absorbs at most 3 points of balance per week', () => {
  expect(consumeIntoPlan(5)).toBe(2);
  expect(consumeIntoPlan(-4)).toBe(-1);
  expect(consumeIntoPlan(2)).toBe(0);
});
test('inputs are not mutated', () => {
  const b = { a: 0 };
  applyExpiry(b, 'a', 1);
  expect(b).toEqual({ a: 0 });
});
