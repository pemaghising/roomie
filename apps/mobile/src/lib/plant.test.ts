import { expect, test } from 'vitest';
import { milestoneState, plantFor } from './plant';

test('the plant only changes at the 3, 7, 14 and 30 day milestones', () => {
  expect([0, 2, 3, 6, 7, 13, 14, 29, 30, 120].map((d) => plantFor(d, false)))
    .toEqual(['seed', 'seed', 'sprout', 'sprout', 'leafy', 'leafy', 'bud', 'bud', 'bloom', 'bloom']);
  expect(plantFor(-3, false)).toBe('seed');
});

test('a waiting chore droops the plant whatever its size', () => {
  expect(plantFor(23, true)).toBe('droop');
  expect(plantFor(1, true)).toBe('droop');
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
