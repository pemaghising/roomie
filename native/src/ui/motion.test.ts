import { describe, expect, test } from 'vitest';
import { durations, enterConfig, motion, stagger } from './motion-config';

describe('motion system', () => {
  test('lists stagger 30 ms per item, capped at 8 items', () => {
    expect(stagger(0)).toBe(0);
    expect(stagger(3)).toBe(90);
    expect(stagger(20)).toBe(240);
  });

  test('snappy: no animation on a repeated path runs longer than 320 ms', () => {
    for (const ms of Object.values(durations)) expect(ms).toBeLessThanOrEqual(320);
  });

  test('enter is a fade and a 10 px rise over 200 ms', () => {
    expect(enterConfig(2, false)).toEqual({ kind: 'rise', duration: 200, delay: 60, distance: 10 });
  });

  test('with Reduce Motion on, enter is a quick fade with no movement or delay', () => {
    const c = enterConfig(5, true);
    expect(c).toEqual({ kind: 'fade', duration: 150, delay: 0, distance: 0 });
  });

  test('press scales to 0.96 on a stiff spring; sheets settle fast without bounce', () => {
    expect(motion.press).toEqual({ scale: 0.96, spring: { damping: 22, stiffness: 520, mass: 0.6 } });
    expect(motion.sheet).toEqual({ damping: 28, stiffness: 420, mass: 0.8 });
  });
});
