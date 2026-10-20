import { expect, test } from 'vitest';
import { milestoneState, stageFor } from './plant';

test('the plant has one stage per streak day, from the egg at 0 to fully grown from day 7', () => {
  expect([0, 1, 6, 7, 20].map(stageFor)).toEqual([1, 2, 7, 8, 8]);
  expect(stageFor(-3)).toBe(1);
});

test('a milestone is celebrated once, at the highest one reached', () => {
  expect(milestoneState(2, 0)).toEqual({ celebrate: null, seen: 0 });
  expect(milestoneState(3, 0)).toEqual({ celebrate: 3, seen: 0 });
  expect(milestoneState(8, 3)).toEqual({ celebrate: 7, seen: 3 });
  expect(milestoneState(8, 7)).toEqual({ celebrate: null, seen: 7 });
  expect(milestoneState(100, 0)).toEqual({ celebrate: 100, seen: 0 });
});

test('a broken streak starts a fresh run, so earlier milestones can be earned again', () => {
  expect(milestoneState(3, 7)).toEqual({ celebrate: 3, seen: 0 });
  expect(milestoneState(1, 7)).toEqual({ celebrate: null, seen: 0 });
});
