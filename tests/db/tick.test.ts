// @vitest-environment node
import { afterAll, describe, expect, test, vi } from 'vitest';
import { admin, cleanup, hasDb, makeUser, seedHousehold, seedPlan } from './helpers';
import { addDays, localParts, weekStartOf } from '../../supabase/functions/_shared/domain/time';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });
const secret = process.env.SUPABASE_TEST_CRON_SECRET;
const userIds: string[] = [];
const householdIds: string[] = [];
afterAll(() => cleanup({ userIds, householdIds }));

describe.skipIf(!hasDb)('srv_* server functions', () => {
  const zero = '00000000-0000-0000-0000-000000000000';
  const day = '2026-10-01';
  const calls: [string, Record<string, unknown>][] = [
    ['srv_snapshots', {}],
    ['srv_expire_day', { p_household: zero, p_day: day }],
    ['srv_insert_plan', { p_household: zero, p_week: day, p_status: 'locked', p_assignments: [], p_consume: true, p_only_if_new: false }],
    ['srv_queue_digest', { p_household: zero, p_day: day }],
  ];
  test.each(calls)('an authenticated (non-service) client cannot call %s', async (fn, args) => {
    const u = await makeUser('Nosy');
    userIds.push(u.id);
    const { data, error } = await u.client.rpc(fn, args);
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  }, 30_000);

  test('srv_queue_digest twice for one day queues each member once', async () => {
    const a = await makeUser('DigA');
    const b = await makeUser('DigB');
    userIds.push(a.id, b.id);
    const h = await seedHousehold(a.id, [b.id]);
    householdIds.push(h);
    const today = localParts(new Date(), 'Asia/Kathmandu').date;
    await seedPlan(h, weekStartOf(today), [{ userId: a.id, day: today }, { userId: b.id, day: today }]);
    for (let i = 0; i < 2; i++) {
      const { error } = await admin().rpc('srv_queue_digest', { p_household: h, p_day: today });
      expect(error).toBeNull();
    }
    const { data } = await admin().from('notifications').select('user_id').eq('household_id', h).eq('kind', 'digest');
    expect(data!.map((n) => n.user_id).sort()).toEqual([a.id, b.id].sort());
  }, 30_000);

  test('srv_insert_plan with the same chore twice into an existing plan does not duplicate', async () => {
    const u = await makeUser('Dup');
    userIds.push(u.id);
    const h = await seedHousehold(u.id);
    householdIds.push(h);
    const today = localParts(new Date(), 'Asia/Kathmandu').date;
    const week = weekStartOf(today);
    const [aid] = await seedPlan(h, week, [{ userId: u.id, day: today }]);
    const { data: existing } = await admin().from('assignments').select('chore_id').eq('id', aid).single();
    const rows = [{ choreId: existing!.chore_id, userId: u.id, day: today, effort: 1, reason: {} }];
    for (let i = 0; i < 2; i++) {
      const { error } = await admin().rpc('srv_insert_plan', {
        p_household: h, p_week: week, p_status: 'locked', p_assignments: rows, p_consume: false, p_only_if_new: false,
      });
      expect(error).toBeNull();
    }
    const { data: all } = await admin().from('assignments').select('id').eq('household_id', h);
    expect(all).toHaveLength(1);
  }, 30_000);

  test('snapshots emit every day including empty ones, and lockAt is ISO with Z', async () => {
    const u = await makeUser('Snap');
    userIds.push(u.id);
    const h = await seedHousehold(u.id);
    householdIds.push(h);
    const today = localParts(new Date(), 'Asia/Kathmandu').date;
    // one assignment two days ago; today and the other days have none
    await seedPlan(h, weekStartOf(addDays(today, -2)), [{ userId: u.id, day: addDays(today, -2) }]);

    const { data, error } = await admin().rpc('srv_snapshots', { p_household: h });
    expect(error).toBeNull();
    const snap = (data as { plans: { lockAt: string }[]; days: { date: string; statuses: string[] }[] }[])[0];

    expect(snap.days.map((d) => d.date)).toEqual([-3, -2, -1, 0].map((n) => addDays(today, n)));
    expect(snap.days.find((d) => d.date === addDays(today, -2))!.statuses).toEqual(['todo']);
    expect(snap.days.find((d) => d.date === today)!.statuses).toEqual([]); // empty day still present
    expect(snap.plans.length).toBeGreaterThan(0);
    for (const p of snap.plans) {
      expect(p.lockAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(Number.isNaN(Date.parse(p.lockAt))).toBe(false);
    }
  });
});

// These need the deployed function AND the Vault secrets (tick_url / cron_secret) only for the cron schedule itself;
// the HTTP calls below only need the function deployed and CRON_SECRET set on it.
describe.skipIf(!hasDb || !secret)('tick edge function', () => {
  test('a new household gets this week planned and a user call can trigger it', async () => {
    const owner = await makeUser('Aarav');
    userIds.push(owner.id);
    const { data: h } = await owner.client.rpc('create_household', {
      p_name: 'Tick flat', p_busy: [],
      p_chores: [{ name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily' }, { name: 'Bathroom', icon: '🪣', effort: 3, cadence: 'weekly' }],
    });
    householdIds.push(h as string);
    const res = await owner.client.functions.invoke('tick', { body: {} });
    expect(res.error).toBeNull();
    const { data: plans } = await admin().from('plans').select('id, status').eq('household_id', h);
    expect(plans).toHaveLength(1);
    expect(plans![0].status).toBe('locked');
    const { data: rows } = await admin().from('assignments').select('id').eq('household_id', h);
    expect(rows!.length).toBeGreaterThan(0);
  });

  test('cron calls are accepted with the shared secret and rejected without it', async () => {
    const url = `${process.env.SUPABASE_TEST_URL}/functions/v1/tick`;
    const ok = await fetch(url, { method: 'POST', headers: { 'x-cron-secret': secret! }, body: '{}' });
    expect(ok.status).toBe(200);
    const denied = await fetch(url, { method: 'POST', body: '{}' });
    expect(denied.status).toBe(401);
  });
});
