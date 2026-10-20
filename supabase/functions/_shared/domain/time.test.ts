import { describe, expect, test } from 'vitest';
import { addDays, dateOfWeekday, DAY_NAMES, localParts, minutesOf, weekdayOf, weeksBetween, weekStartOf } from './time.ts';

describe('calendar helpers', () => {
  test('addDays crosses months and years', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-01', -3)).toBe('2026-09-28');
  });
  test('weekdayOf uses 0 = Sunday', () => {
    expect(weekdayOf('2026-10-04')).toBe(0); // Sunday
    expect(weekdayOf('2026-09-28')).toBe(1); // Monday
    expect(weekdayOf('2026-10-01')).toBe(4); // Thursday
    expect(weekdayOf('2026-10-03')).toBe(6); // Saturday
  });
  test('weekStartOf returns the Sunday', () => {
    expect(weekStartOf('2026-10-01')).toBe('2026-09-27');
    expect(weekStartOf('2026-10-03')).toBe('2026-09-27');
    expect(weekStartOf('2026-10-04')).toBe('2026-10-04');
  });
  test('dateOfWeekday and weeksBetween', () => {
    expect(dateOfWeekday('2026-09-27', 5)).toBe('2026-10-02');
    expect(weeksBetween('2026-09-27', '2026-10-11')).toBe(2);
    expect(weeksBetween('2026-10-11', '2026-09-27')).toBe(-2);
  });
  test('minutesOf accepts HH:MM and HH:MM:SS', () => {
    expect(minutesOf('22:00')).toBe(1320);
    expect(minutesOf('07:30:00')).toBe(450);
  });
  test('DAY_NAMES matches the weekday convention', () => {
    expect(DAY_NAMES[0]).toBe('Sunday');
    expect(DAY_NAMES[6]).toBe('Saturday');
  });
});

describe('localParts', () => {
  test('Kathmandu is UTC+5:45', () => {
    expect(localParts(new Date('2026-10-03T12:20:00Z'), 'Asia/Kathmandu'))
      .toEqual({ date: '2026-10-03', weekday: 6, hour: 18, minute: 5 });
  });
  test('rolls over to the next local day before UTC does', () => {
    expect(localParts(new Date('2026-10-03T18:20:00Z'), 'Asia/Kathmandu'))
      .toEqual({ date: '2026-10-04', weekday: 0, hour: 0, minute: 5 });
  });
});
