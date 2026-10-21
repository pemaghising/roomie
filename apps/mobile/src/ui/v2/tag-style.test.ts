import { describe, expect, test } from 'vitest';
import { effortKind, letterTile, tagStyle } from './tag-style';

describe('tag styles', () => {
  test('effort tags use the effort tokens and say the level in words', () => {
    expect(tagStyle('light')).toEqual({ bg: '#E9F6E1', fg: '#3F7A2A', label: 'Light' });
    expect(tagStyle('medium')).toEqual({ bg: '#FFF1D6', fg: '#8A5A00', label: 'Medium' });
    expect(tagStyle('heavy')).toEqual({ bg: '#FFE6DC', fg: '#B23E1E', label: 'Heavy' });
  });

  test('pool, pantry status and boundary tags', () => {
    expect(tagStyle('inPool')).toEqual({ bg: '#FFE3D3', fg: '#9A3412', label: 'In the pool' });
    expect(tagStyle('out').label).toBe('Out');
    expect(tagStyle('low').label).toBe('Low');
    expect(tagStyle('doNotTouch')).toMatchObject({ label: 'Do not touch', icon: 'lock' });
    expect(tagStyle('askFirst')).toMatchObject({ label: 'Ask first', icon: 'help' });
  });

  test('effort numbers map to tag kinds', () => {
    expect([1, 2, 3].map(effortKind)).toEqual(['light', 'medium', 'heavy']);
  });

  test('letter tiles use the first letter, upper-cased, with a stable pastel', () => {
    expect(letterTile('kombucha').letter).toBe('K');
    expect(letterTile('  momo masala').letter).toBe('M');
    expect(letterTile('Tofu')).toEqual(letterTile('tofu'));
    expect(letterTile('').letter).toBe('?');
  });
});
