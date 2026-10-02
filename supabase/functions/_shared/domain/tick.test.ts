import { describe, expect, test } from 'vitest';
import { decideTick, pushDecision, type HouseholdSnapshot } from './tick.ts';

// Kathmandu is UTC+5:45. Thursday 2026-10-01; week starts Monday 2026-09-28; next week 2026-10-05.
const at = (iso: string) => new Date(iso);
const THU_0845 = at('2026-10-01T03:00:00Z');
const THU_1500 = at('2026-10-01T09:15:00Z');
const THU_2105 = at('2026-10-01T15:20:00Z');
const THU_2205 = at('2026-10-01T16:20:00Z');
const SAT_1805 = at('2026-10-03T12:20:00Z');

const base = (over: Partial<HouseholdSnapshot> = {}): HouseholdSnapshot => ({
  id: 'h1', tz: 'Asia/Kathmandu', planMode: 'review', dayEndsAt: '22:00:00', activeMembers: 3,
  plans: [{ id: 'cur', weekStart: '2026-09-28', status: 'locked', approvals: 0, lockAt: '2026-09-27T12:15:00Z' }],
  days: [], streak: { current: 2, best: 5, lastSettledDay: '2026-09-30' }, digestSentFor: '2026-10-01',
  ...over,
});
const kinds = (s: HouseholdSnapshot, now: Date) => decideTick(s, now).map((a) => a.kind);

describe('plans', () => {
  test('a household without a plan this week gets one from today', () => {
    expect(decideTick(base({ plans: [] }), THU_1500)).toContainEqual({ kind: 'generate', weekStart: '2026-09-28', status: 'locked', fromDay: 3 });
  });
  test('Saturday 18:00 drafts next week in review mode', () => {
    expect(decideTick(base(), SAT_1805)).toContainEqual({ kind: 'generate', weekStart: '2026-10-05', status: 'draft', fromDay: 0 });
  });
  test('auto mode locks immediately', () => {
    expect(decideTick(base({ planMode: 'auto' }), SAT_1805)).toContainEqual({ kind: 'generate', weekStart: '2026-10-05', status: 'locked', fromDay: 0 });
  });
  test('never drafts twice', () => {
    const s = base({ plans: [...base().plans, { id: 'n', weekStart: '2026-10-05', status: 'draft', approvals: 0, lockAt: '2026-10-04T12:15:00Z' }] });
    expect(kinds(s, SAT_1805)).not.toContain('generate');
  });
  test('locks a draft when everyone approved', () => {
    const s = base({ plans: [{ id: 'n', weekStart: '2026-10-05', status: 'draft', approvals: 3, lockAt: '2026-10-04T12:15:00Z' }, ...base().plans] });
    expect(decideTick(s, SAT_1805)).toContainEqual({ kind: 'lock', planId: 'n' });
  });
  test('locks a draft once lockAt has passed, not before', () => {
    const draft = { id: 'n', weekStart: '2026-10-05', status: 'draft' as const, approvals: 1, lockAt: '2026-10-04T12:15:00Z' };
    const s = base({ plans: [...base().plans, draft] });
    expect(kinds(s, SAT_1805)).not.toContain('lock');
    expect(decideTick(s, at('2026-10-04T12:20:00Z'))).toContainEqual({ kind: 'lock', planId: 'n' });
  });
});

describe('missed chores', () => {
  const today = { date: '2026-10-01', statuses: ['done', 'todo'] as const };
  test('sweeps today once the day has ended', () => {
    expect(kinds(base({ days: [{ ...today, statuses: [...today.statuses] }] }), THU_2105)).not.toContain('sweep');
    expect(decideTick(base({ days: [{ ...today, statuses: [...today.statuses] }] }), THU_2205)).toContainEqual({ kind: 'sweep', date: '2026-10-01' });
  });
  test('expires yesterday 24 h after it ended, then settles it as broken', () => {
    const s = base({ days: [{ date: '2026-09-30', statuses: ['done', 'missed'] }], streak: { current: 2, best: 5, lastSettledDay: '2026-09-29' } });
    expect(kinds(s, THU_2105)).not.toContain('expire');
    const actions = decideTick(s, THU_2205);
    expect(actions).toContainEqual({ kind: 'expire', date: '2026-09-30' });
    expect(actions).toContainEqual({ kind: 'settle', date: '2026-09-30', outcome: 'broken' });
  });
});

describe('streak', () => {
  test('a fully done day settles as kept straight away', () => {
    expect(decideTick(base({ days: [{ date: '2026-10-01', statuses: ['done', 'done'] }] }), THU_1500))
      .toContainEqual({ kind: 'settle', date: '2026-10-01', outcome: 'kept' });
  });
  test('a pending day blocks later days from settling', () => {
    const s = base({ days: [{ date: '2026-10-01', statuses: ['done', 'missed'] }, { date: '2026-10-02', statuses: ['done'] }] });
    expect(kinds(s, at('2026-10-02T09:15:00Z'))).not.toContain('settle');
  });
  test('empty days settle only after their pool would have closed', () => {
    expect(kinds(base({ days: [{ date: '2026-10-01', statuses: [] }] }), THU_2205)).not.toContain('settle');
    expect(decideTick(base({ days: [{ date: '2026-10-01', statuses: [] }] }), at('2026-10-02T16:20:00Z')))
      .toContainEqual({ kind: 'settle', date: '2026-10-01', outcome: 'empty' });
  });
  test('already settled days are skipped', () => {
    expect(kinds(base({ days: [{ date: '2026-09-30', statuses: ['done'] }] }), THU_1500)).not.toContain('settle');
  });
});

describe('digest', () => {
  test('sent once in the 08:00–11:59 window', () => {
    expect(decideTick(base({ digestSentFor: null }), THU_0845)).toContainEqual({ kind: 'digest', date: '2026-10-01' });
    expect(kinds(base({ digestSentFor: '2026-10-01' }), THU_0845)).not.toContain('digest');
    expect(kinds(base({ digestSentFor: null }), THU_1500)).not.toContain('digest');
  });
});

describe('pushDecision', () => {
  test('quiet hours defer', () => {
    expect(pushDecision(23, 0, 'pool')).toBe('defer');
    expect(pushDecision(6, 0, 'pool')).toBe('defer');
    expect(pushDecision(7, 0, 'pool')).toBe('send');
  });
  test('daily cap skips everything except covered', () => {
    expect(pushDecision(12, 3, 'pool')).toBe('skip');
    expect(pushDecision(12, 3, 'covered')).toBe('send');
  });
});
