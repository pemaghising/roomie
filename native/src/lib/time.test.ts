import { describe, expect, test } from 'vitest';
import { weekStartOf } from '@domain/time.ts';
import { localToday } from './local-today';

describe('localToday', () => {
  test('rolls over at local midnight in Kathmandu, not at UTC midnight', () => {
    const satLate = localToday(new Date('2026-10-17T18:14:00Z'), 'Asia/Kathmandu'); // Sat 23:59 NPT
    const sunEarly = localToday(new Date('2026-10-17T18:16:00Z'), 'Asia/Kathmandu'); // Sun 00:01 NPT
    expect(satLate).toBe('2026-10-17');
    expect(sunEarly).toBe('2026-10-18');
  });

  test('a new Sunday starts a new week', () => {
    expect(weekStartOf(localToday(new Date('2026-10-17T18:14:00Z'), 'Asia/Kathmandu'))).toBe('2026-10-11');
    expect(weekStartOf(localToday(new Date('2026-10-17T18:16:00Z'), 'Asia/Kathmandu'))).toBe('2026-10-18');
  });

  test('uses the household time zone when it is not Kathmandu', () => {
    expect(localToday(new Date('2026-10-17T18:16:00Z'), 'America/New_York')).toBe('2026-10-17');
  });
});
