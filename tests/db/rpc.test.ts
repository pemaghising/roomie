// @vitest-environment node
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, cleanup, hasDb, makeUser as mk, seedHousehold as seedH, seedPlan } from './helpers';

type U = Awaited<ReturnType<typeof mk>>;
const users: string[] = [];
const homes: string[] = [];
const makeUser: typeof mk = async (n) => { const u = await mk(n); users.push(u.id); return u; };
const seedHousehold: typeof seedH = async (...args) => { const h = await seedH(...args); homes.push(h); return h; };
afterAll(async () => { await cleanup({ householdIds: homes, userIds: users }); }, 60_000);
const todayKtm = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
const plusDays = (d: string, n: number) => new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);
// weeks start on Sunday (the plans table refuses any other start)
const sunday = (d: string) => plusDays(d, -new Date(d).getUTCDay());

describe.skipIf(!hasDb)('household lifecycle', () => {
  let owner: U; let joiner: U;
  beforeAll(async () => { [owner, joiner] = await Promise.all([makeUser('Aarav'), makeUser('Priya')]); }, 30_000);

  test('create_household sets up home, chores, ledger and streak', async () => {
    const { data: h, error } = await owner.client.rpc('create_household', {
      p_name: 'Flat 4B', p_busy: [0, 2, 4],
      p_chores: [{ name: 'Take out trash', icon: '🗑️', effort: 1, cadence: 'daily' }, { name: 'Bathroom', icon: '🪣', effort: 3, cadence: 'weekly' }],
    });
    if (h) homes.push(h as string); // register for cleanup before asserting
    expect(error).toBeNull();
    const state = (await owner.client.rpc('get_state')).data;
    expect(state.household.id).toBe(h);
    expect(state.household.invite_code).toMatch(/^[A-Z0-9]{6}$/);
    expect(state.chores).toHaveLength(2);
    expect(state.members[0]).toMatchObject({ role: 'owner', busy_days: [0, 2, 4] });
    expect(state.streak.current).toBe(0);
  });

  test('join normalizes code: lowercase, spaces, dashes and full links all work', async () => {
    const code: string = (await owner.client.rpc('get_state')).data.household.invite_code;
    const messy = `https://roomie.example/j/${code.slice(0, 3).toLowerCase()}-${code.slice(3)}`;
    const { data, error } = await joiner.client.rpc('join_household', { p_code: messy, p_busy: [5] });
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect((await owner.client.rpc('get_state')).data.members).toHaveLength(2);
  });

  test('a member can still SELECT their household chores (RLS works after the private revoke)', async () => {
    const { data, error } = await joiner.client.from('chores').select('id');
    expect(error).toBeNull();
    expect(data).toHaveLength(2);
  });

  test('an unknown code returns null rather than an error', async () => {
    const lone = await makeUser('Lone');
    const { data, error } = await lone.client.rpc('join_household', { p_code: 'ZZZZZZ', p_busy: [] });
    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  test('you cannot be in two households', async () => {
    const { error } = await joiner.client.rpc('create_household', { p_name: 'Second', p_busy: [], p_chores: [] });
    expect(error?.message).toContain('already_member');
  });
});

describe.skipIf(!hasDb)('chores, claims and the private ledger', () => {
  let a: U; let b: U; let c: U; let h: string;
  const today = todayKtm();
  const week = sunday(today);

  beforeAll(async () => {
    [a, b, c] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima')]);
    h = await seedHousehold(a.id, [b.id, c.id]);
  }, 30_000);

  test('complete is idempotent (offline replays, double taps)', async () => {
    const [id] = await seedPlan(h, week, [{ userId: a.id, day: today }]);
    expect((await a.client.rpc('complete_assignment', { p_id: id })).error).toBeNull();
    expect((await a.client.rpc('complete_assignment', { p_id: id })).error).toBeNull();
    const { data } = await admin().from('assignments').select('status').eq('id', id).single();
    expect(data!.status).toBe('done');
  });

  test("you cannot complete someone else's todo", async () => {
    const [id] = await seedPlan(h, plusDays(week, 7), [{ userId: a.id, day: plusDays(today, 7) }]);
    expect((await b.client.rpc('complete_assignment', { p_id: id })).error?.message).toContain('not_allowed');
  });

  test('claim race: exactly one roommate wins', async () => {
    const [id] = await seedPlan(h, plusDays(week, 14), [{ userId: a.id, day: plusDays(today, -1), status: 'missed', effort: 3 }]);
    const results = await Promise.all([b.client.rpc('claim_assignment', { p_id: id }), c.client.rpc('claim_assignment', { p_id: id })]);
    const errors = results.filter((r) => r.error);
    expect(errors).toHaveLength(1);
    expect(errors[0].error!.message).toContain('already_claimed');
  });

  test('completing a claimed chore moves effort privately and notifies the person who missed it', async () => {
    const [id] = await seedPlan(h, plusDays(week, 21), [{ userId: a.id, day: plusDays(today, -1), status: 'missed', effort: 3 }]);
    await b.client.rpc('claim_assignment', { p_id: id });
    expect((await b.client.rpc('complete_assignment', { p_id: id })).error).toBeNull();
    expect((await a.client.rpc('get_state')).data.balance).toBe(3);
    expect((await b.client.rpc('get_state')).data.balance).toBe(-3);
    expect((await c.client.rpc('get_state')).data.balance).toBe(0);
    const { data: note } = await admin().from('notifications').select('kind, payload').eq('user_id', a.id).eq('kind', 'covered').single();
    expect(note!.payload).toMatchObject({ actor: 'Priya', effort: 3 });
  });

  test('undo window: refused after 10 minutes', async () => {
    const [id] = await seedPlan(h, plusDays(week, 28), [{ userId: a.id, day: today }]);
    await a.client.rpc('complete_assignment', { p_id: id });
    await admin().from('assignments').update({ done_at: new Date(Date.now() - 11 * 60_000).toISOString() }).eq('id', id);
    expect((await a.client.rpc('undo_complete', { p_id: id })).error?.message).toContain('undo_expired');
  });

  test('undo inside the window restores the chore', async () => {
    const [id] = await seedPlan(h, plusDays(week, 35), [{ userId: a.id, day: today }]);
    await a.client.rpc('complete_assignment', { p_id: id });
    expect((await a.client.rpc('undo_complete', { p_id: id })).error).toBeNull();
    const { data } = await admin().from('assignments').select('status').eq('id', id).single();
    expect(['todo', 'missed']).toContain(data!.status);
  });
});

describe.skipIf(!hasDb)('swaps and leaving', () => {
  let a: U; let b: U; let h: string;
  const today = todayKtm();

  beforeAll(async () => {
    [a, b] = await Promise.all([makeUser('Aarav'), makeUser('Priya')]);
    h = await seedHousehold(a.id, [b.id]);
  }, 30_000);

  test('accepting a light-for-heavy swap swaps owners and credits the requester', async () => {
    const tomorrow = plusDays(today, 1);
    const [mine, theirs] = await seedPlan(h, sunday(tomorrow), [
      { userId: a.id, day: tomorrow, effort: 1, choreName: 'Trash' },
      { userId: b.id, day: tomorrow, effort: 3, choreName: 'Bathroom' },
    ]);
    const { data: swapId } = await a.client.rpc('request_swap', { p_from: mine, p_to: theirs });
    const { data: accepted } = await b.client.rpc('respond_swap', { p_swap: swapId, p_accept: true });
    expect(accepted).toBe(true);
    const { data: rows } = await admin().from('assignments').select('id, user_id').in('id', [mine, theirs]);
    expect(rows!.find((r) => r.id === mine)!.user_id).toBe(b.id);
    expect(rows!.find((r) => r.id === theirs)!.user_id).toBe(a.id);
    expect((await a.client.rpc('get_state')).data.balance).toBe(-2);
    expect((await b.client.rpc('get_state')).data.balance).toBe(2);
  });

  test('leaving cancels pending swaps and sends future chores to the claim pool', async () => {
    const later = plusDays(today, 2);
    // a different plan week from the previous test (one plan per household per week)
    const [mine, theirs] = await seedPlan(h, plusDays(sunday(later), 7), [
      { userId: a.id, day: later, choreName: 'Dishes' },
      { userId: b.id, day: later, choreName: 'Sweep' },
    ]);
    const { data: swapId } = await a.client.rpc('request_swap', { p_from: mine, p_to: theirs });
    expect((await b.client.rpc('leave_household')).error).toBeNull();
    const { data: swap } = await admin().from('swap_requests').select('status').eq('id', swapId).single();
    expect(swap!.status).toBe('declined');
    const { data: orphan } = await admin().from('assignments').select('status').eq('id', theirs).single();
    expect(orphan!.status).toBe('missed');
    expect((await b.client.rpc('respond_swap', { p_swap: swapId, p_accept: true })).error?.message).toMatch(/swap_unavailable|not_member/);
  });
});

const PUSH = { p_endpoint: 'https://push.example/abc', p_p256dh: 'A'.repeat(87), p_auth: 'B'.repeat(22) };

describe.skipIf(!hasDb)('authorization and input hardening', () => {
  let a: U; let b: U; let c: U; let x: U; let h: string; let h2: string;
  const today = todayKtm();

  beforeAll(async () => {
    [a, b, c, x] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima'), makeUser('Xena')]);
    h = await seedHousehold(a.id, [b.id]);
    h2 = await seedHousehold(x.id);
  }, 30_000);

  test("another household's assignment is refused for complete and claim", async () => {
    const [id] = await seedPlan(h, sunday(today), [{ userId: a.id, day: plusDays(today, -1), status: 'missed' }]);
    expect((await x.client.rpc('complete_assignment', { p_id: id })).error?.message).toContain('not_allowed');
    expect((await x.client.rpc('claim_assignment', { p_id: id })).error?.message).toContain('not_allowed');
    void h2;
  });

  test('claim pool closed: a missed chore from two days ago cannot be claimed', async () => {
    const [id] = await seedPlan(h, plusDays(sunday(today), -7), [{ userId: a.id, day: plusDays(today, -2), status: 'missed' }]);
    expect((await b.client.rpc('claim_assignment', { p_id: id })).error?.message).toContain('not_allowed');
  });

  test('non-owner cannot rotate the code or remove members', async () => {
    expect((await b.client.rpc('rotate_invite_code')).error?.message).toContain('not_allowed');
    expect((await b.client.rpc('remove_member', { p_user: a.id })).error?.message).toContain('not_allowed');
  });

  test('anon client cannot call create_household', async () => {
    const anon = createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await anon.rpc('create_household', { p_name: 'Nope', p_busy: [], p_chores: [] });
    expect(error).not.toBeNull();
  });

  test('push subscriptions are validated and cannot be taken over', async () => {
    expect((await a.client.rpc('save_push_subscription', { ...PUSH, p_endpoint: 'http://push.example/abc' })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('save_push_subscription', { ...PUSH, p_p256dh: 'garbage' })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('save_push_subscription', { ...PUSH, p_auth: '!!' })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('save_push_subscription', PUSH)).error).toBeNull();
    expect((await b.client.rpc('save_push_subscription', { ...PUSH, p_auth: 'C'.repeat(22) })).error).toBeNull();
    const { data } = await admin().from('push_subscriptions').select('user_id, auth').eq('endpoint', PUSH.p_endpoint).single();
    expect(data).toEqual({ user_id: a.id, auth: PUSH.p_auth });
  });

  test('bad chore input is invalid_input, not a raw error', async () => {
    const bad = (chores: unknown) => c.client.rpc('create_household', { p_name: 'X', p_busy: [], p_chores: chores });
    expect((await bad({ not: 'array' })).error?.message).toContain('invalid_input');
    expect((await bad([{ name: 'A', effort: 'x' }])).error?.message).toContain('invalid_input');
    expect((await bad([{ name: 'A', effort: 1, cadence: 'hourly' }])).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('add_chore', { p_name: 'A', p_icon: 'x', p_effort: null, p_cadence: 'daily' })).error?.message).toContain('invalid_input');
  });

  test('rate limited after 10 bad codes', async () => {
    const lone = await makeUser('Rater');
    for (let i = 0; i < 10; i++) await lone.client.rpc('join_household', { p_code: 'ZZZZZZ', p_busy: [] });
    expect((await lone.client.rpc('join_household', { p_code: 'ZZZZZZ', p_busy: [] })).error?.message).toContain('rate_limited');
  }, 30_000);
});

describe.skipIf(!hasDb)('orphaned households', () => {
  test('sole owner leaves: old code dies, next joiner becomes owner', async () => {
    const [o, j] = await Promise.all([makeUser('Olly'), makeUser('Jo')]);
    const { data: h } = await o.client.rpc('create_household', { p_name: 'Solo', p_busy: [], p_chores: [] });
    homes.push(h as string);
    const oldCode: string = (await o.client.rpc('get_state')).data.household.invite_code;
    expect((await o.client.rpc('leave_household')).error).toBeNull();
    const { data: row } = await admin().from('households').select('invite_code').eq('id', h).single();
    expect(row!.invite_code).not.toBe(oldCode);
    expect((await j.client.rpc('join_household', { p_code: oldCode, p_busy: [] })).data).toBeNull();
    expect((await j.client.rpc('join_household', { p_code: row!.invite_code, p_busy: [] })).data).toBe(h);
    const { data: m } = await admin().from('members').select('role').eq('household_id', h).eq('user_id', j.id).single();
    expect(m!.role).toBe('owner');
  }, 30_000);
});
