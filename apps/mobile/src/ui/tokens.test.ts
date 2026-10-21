import { describe, expect, test } from 'vitest';
import { color, elevation, radius, space, type } from './tokens';

const walk = (o: unknown, out: string[] = []): string[] => {
  if (typeof o === 'string') out.push(o);
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => walk(v, out));
  return out;
};

describe('v2 tokens', () => {
  test('colours match the Figma v2 · Color variables', () => {
    expect(color.bg.surface).toBe('#FCFBFF');
    expect(color.bg.canvas).toBe('#F8F6FC');
    expect(color.action.primary).toBe('#7A5FD6');
    expect(color.text.primary).toBe('#1F1B3A');
    expect(color.effort.heavyFg).toBe('#B23E1E');
    expect(color.pool.bg).toBe('#FFE3D3');
  });

  test('no pure white anywhere in the palette', () => {
    expect(walk(color).some((v) => /^#fff(fff)?$/i.test(v) || v.toLowerCase() === 'white')).toBe(false);
  });

  test('type styles carry the Figma sizes and families', () => {
    expect(type['Title/Page']).toMatchObject({ fontSize: 34, lineHeight: 41 });
    expect(type['Title/Page'].fontFamily).toMatch(/Fraunces/);
    expect(type['Title/Accent'].fontFamily).toMatch(/Italic/);
    expect(type['Body/Row']).toMatchObject({ fontSize: 16, lineHeight: 21 });
    expect(type['Body/Row'].fontFamily).toMatch(/Geist/);
    expect(type['Numeral/Streak']).toMatchObject({ fontSize: 81, lineHeight: 92 });
    expect(type.Tag.fontSize).toBe(12);
    expect(Object.keys(type)).toHaveLength(16);
  });

  test('spacing and radius follow the v2 · Layout variables', () => {
    expect(space).toEqual({ 4: 4, 8: 8, 10: 10, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32 });
    expect(radius).toEqual({ tile: 11, chip: 18, card: 24, field: 26, sheet: 32, full: 999 });
  });

  test('elevations are tinted, never black', () => {
    for (const e of Object.values(elevation)) expect(e.shadowColor).not.toMatch(/^#0{3,6}$/);
  });
});
