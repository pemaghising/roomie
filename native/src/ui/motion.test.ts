import { describe, expect, test } from 'vitest';
import { durations, enterConfig, motion, stagger } from './motion-config';

describe('motion system', () => {
  test('lists stagger 40 ms per item, capped at 8 items', () => {
    expect(stagger(0)).toBe(0);
    expect(stagger(3)).toBe(120);
    expect(stagger(20)).toBe(320);
  });

  test('no animation on a repeated path runs longer than 450 ms', () => {
    for (const ms of Object.values(durations)) expect(ms).toBeLessThanOrEqual(450);
  });

  test('enter is a fade and a 12 px rise over 260 ms', () => {
    expect(enterConfig(2, false)).toEqual({ kind: 'rise', duration: 260, delay: 80, distance: 12 });
  });

  test('with Reduce Motion on, enter is a quick fade with no movement or delay', () => {
    const c = enterConfig(5, true);
    expect(c).toEqual({ kind: 'fade', duration: 180, delay: 0, distance: 0 });
  });

  test('press scales to 0.97 on a firm spring', () => {
    expect(motion.press).toEqual({ scale: 0.97, spring: { damping: 18, stiffness: 320 } });
    expect(motion.sheet).toEqual({ damping: 22, stiffness: 260 });
  });
});
