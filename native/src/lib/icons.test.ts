import { describe, expect, test } from 'vitest';
import { ICON_LIBRARY, iconsIn, matchIcons } from './icons';

describe('matchIcons (P2d–P2g)', () => {
  test('a plain name finds its icon', () => expect(matchIcons('Milk').exact?.name).toBe('Glass of milk'));
  test('a kind of milk still lands on milk', () => expect(matchIcons('Almond milk').closest[0].name).toBe('Glass of milk'));
  test('no exact icon for tofu, but cheese is closest', () => {
    const m = matchIcons('Tofu');
    expect(m.exact).toBeNull();
    expect(m.closest[0].name).toBe('Cheese wedge');
  });
  test('nothing close falls back to a letter tile', () => {
    const m = matchIcons('kombucha');
    expect(m.letter).toBe('K');
    expect(m.closest).toEqual([]);
  });
  test('typing part of a name searches the library', () => expect(matchIcons('choc').closest.map((i) => i.name)).toContain('Chocolate bar'));
  test('every library icon has a picker category', () => {
    expect(ICON_LIBRARY.every((i) => ['Pantry', 'Fruit and veg', 'Drinks', 'Cleaning'].includes(i.category))).toBe(true);
    expect(iconsIn('Drinks').map((i) => i.name)).toContain('Hot beverage');
  });
});
