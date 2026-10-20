import { describe, expect, test } from 'vitest';
import { choreIcon } from './chore-icon';

describe('choreIcon (C4 "Icon picked for you")', () => {
  test.each([
    ['Clean the fridge', '🧽'], ['Wash dishes', '🍽️'], ['Take out trash', '🗑️'], ['Take out recycling', '♻️'],
    ['Vacuum living room', '🧹'], ['Mop bathroom', '🪣'], ['Water plants', '🪴'], ['Wipe stove', '🍳'],
    ['Do the laundry', '🧺'], ['Scrub toilet', '🚽'], ['Clean windows', '🪟'],
  ])('%s → %s', (name, icon) => expect(choreIcon(name)).toBe(icon));

  test('anything unknown gets the sponge', () => expect(choreIcon('Feed the cat')).toBe('🧽'));
});
