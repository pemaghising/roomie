import { describe, expect, test } from 'vitest';
import { buildDemoHousehold } from './demo.ts';

describe('buildDemoHousehold', () => {
  const seed = buildDemoHousehold('2026-10-17', 'pema@x.com');

  test('three members, the owner signs in with the given email', () => {
    expect(seed.members.map((m) => m.name)).toEqual(['Ramesh', 'Priya', 'Aman']);
    expect(seed.members[0].email).toBe('pema@x.com');
    expect(seed.members[0].role).toBe('owner');
  });

  test('busy days use the Sunday-first convention', () => {
    expect(seed.members.map((m) => m.busyDays)).toEqual([[2, 3, 5], [1, 4], [6]]);
  });

  test('every effort is light, medium or heavy, and all three appear', () => {
    const efforts = new Set(seed.chores.map((c) => c.effort));
    expect([...efforts].every((e) => e === 1 || e === 2 || e === 3)).toBe(true);
    expect(efforts).toEqual(new Set([1, 2, 3]));
  });

  test('plans lock on their own: there is no weekly review step', () => {
    expect(seed.household.planMode).toBe('auto');
  });

  test('the house streak is 23 days', () => {
    expect(seed.streakDays).toBe(23);
  });

  test('pantry has milk out, rice low and a do-not-touch personal item', () => {
    const byName = Object.fromEntries(seed.pantry.map((p) => [p.name, p]));
    expect(byName.Milk.status).toBe('out');
    expect(byName.Rice.status).toBe('low');
    expect(byName['Protein shake']).toMatchObject({ shared: false, tag: 'do_not_touch' });
  });

  test('the current week starts on Sunday and past days are done', () => {
    expect(seed.weekStart).toBe('2026-10-11');
    const past = seed.assignments.filter((a) => a.day < '2026-10-17');
    const rest = seed.assignments.filter((a) => a.day >= '2026-10-17');
    expect(past.length).toBeGreaterThan(0);
    expect(past.every((a) => a.status === 'done')).toBe(true);
    expect(rest.every((a) => a.status === 'todo')).toBe(true);
  });

  test('no assignment puts a heavy chore on its member\'s busy day', () => {
    const busy = Object.fromEntries(seed.members.map((m) => [m.name, m.busyDays]));
    const effort = Object.fromEntries(seed.chores.map((c) => [c.name, c.effort]));
    for (const a of seed.assignments) {
      const weekday = new Date(`${a.day}T00:00:00Z`).getUTCDay();
      if (effort[a.chore] === 3) expect(busy[a.member]).not.toContain(weekday);
    }
  });
});
