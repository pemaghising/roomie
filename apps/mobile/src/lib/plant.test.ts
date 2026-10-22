import { describe, expect, it, test } from 'vitest';
import { grewInto, milestoneState, plantFor, streakWords } from './plant';

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

describe('streakWords', () => {
  it('says strong while the plant is healthy', () => {
    expect(streakWords(23, false)).toEqual(['days', 'strong']);
  });
  it('says water me while a chore is waiting, never strong', () => {
    expect(streakWords(23, true)).toEqual(['days', 'water me']);
  });
  it('keeps the day-one and seed wording', () => {
    expect(streakWords(0, false)).toEqual(['day', 'let’s grow']);
    expect(streakWords(1, false)).toEqual(['day', 'together']);
  });
});

describe('grewInto', () => {
  it('is true when the plant moves up a stage', () => {
    expect(grewInto('seed', 'sprout')).toBe(true);
    expect(grewInto('bud', 'bloom')).toBe(true);
  });
  it('is false for the same stage, a droop, recovering from a droop, or a reset', () => {
    expect(grewInto('leafy', 'leafy')).toBe(false);
    expect(grewInto('leafy', 'droop')).toBe(false);
    expect(grewInto('droop', 'leafy')).toBe(false);
    expect(grewInto('bloom', 'seed')).toBe(false);
  });
});
