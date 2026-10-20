import { expect, test } from 'vitest';
import { stageFor } from './StreakPlant';

test('a seed at 0 days, one stage per day, fully grown from day 7', () => {
  expect([0, 1, 2, 3, 6, 7, 8, 30].map(stageFor)).toEqual([1, 2, 3, 4, 7, 8, 8, 8]);
});
