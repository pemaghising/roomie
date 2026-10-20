// @vitest-environment node
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, cleanup, hasDb, makeUser, seedHousehold, seedPlan } from './helpers';

describe.skipIf(!hasDb)('row-level security', () => {
  let a: Awaited<ReturnType<typeof makeUser>>;
  let b: Awaited<ReturnType<typeof makeUser>>;
  let stranger: Awaited<ReturnType<typeof makeUser>>;
  let other: Awaited<ReturnType<typeof makeUser>>;
  let h: string;
  let h2: string;

  beforeAll(async () => {
    [a, b, stranger] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Stranger')]);
    other = await makeUser('Other');
    h = await seedHousehold(a.id, [b.id]);
    h2 = await seedHousehold(other.id);
    await admin().from('chores').insert({ household_id: h, name: 'Bathroom', effort: 3, created_week: '2026-09-28' });
    await admin().from('effort_ledger').update({ balance: 2 }).eq('household_id', h).eq('user_id', a.id);
  });

  afterAll(async () => {
    await cleanup({ householdIds: [h, h2].filter(Boolean), userIds: [a, b, stranger, other].filter(Boolean).map((u) => u.id) });
  });

  test('members read their household; strangers read nothing', async () => {
    expect((await a.client.from('chores').select('id')).data).toHaveLength(1);
    expect((await stranger.client.from('chores').select('id')).data).toEqual([]);
    expect((await stranger.client.from('households').select('id')).data).toEqual([]);
  });

  test('the effort ledger is private to its owner', async () => {
    const mine = await a.client.from('effort_ledger').select('user_id, balance');
    expect(mine.data).toEqual([{ user_id: a.id, balance: 2 }]);
    const theirs = await b.client.from('effort_ledger').select('user_id, balance');
    expect(theirs.data).toEqual([{ user_id: b.id, balance: 0 }]);
  });

  test('clients cannot write tables directly', async () => {
    const res = await a.client.from('chores').insert({ household_id: h, name: 'Hack', effort: 1, created_week: '2026-09-28' });
    expect(res.error?.code).toBe('42501');
  });

  test('clients cannot update the ledger', async () => {
    await a.client.from('effort_ledger').update({ balance: 99 }).eq('user_id', a.id);
    const row = await admin().from('effort_ledger').select('balance').eq('user_id', a.id).single();
    expect(row.data?.balance).toBe(2);
  });

  test("another household's members and profiles are invisible", async () => {
    const members = await other.client.from('members').select('user_id').eq('household_id', h);
    expect(members.data).toEqual([]);
    const profiles = await other.client.from('profiles').select('id').in('id', [a.id, b.id]);
    expect(profiles.data).toEqual([]);
  });

  test('get_state returns the household for members and null for strangers', async () => {
    const mine = await a.client.rpc('get_state');
    expect(mine.data.household.id).toBe(h);
    expect(mine.data.members).toHaveLength(2);
    expect(mine.data.balance).toBe(2);
    const priya = await b.client.rpc('get_state');
    expect(priya.data.balance).toBe(0);
    const none = await stranger.client.rpc('get_state');
    expect(none.data.household).toBeNull();
  });

  test("a member cannot see another member's debt or credit reason", async () => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
    const sunday = new Date(Date.parse(today) - new Date(today).getUTCDay() * 86_400_000).toISOString().slice(0, 10);
    const [aDebt, bCredit, bTurn] = await seedPlan(h, sunday, [
      { userId: a.id, day: today, choreName: 'Dishes' }, { userId: b.id, day: today, choreName: 'Bins' }, { userId: b.id, day: today, choreName: 'Mop' },
    ]);
    await admin().from('assignments').update({ reason: { code: 'debt', coveredBy: b.id } }).eq('id', aDebt);
    await admin().from('assignments').update({ reason: { code: 'credit' } }).eq('id', bCredit);
    await admin().from('assignments').update({ reason: { code: 'turn', previousUserId: a.id } }).eq('id', bTurn);
    const reasonIn = (rows: { id: string; reason: unknown }[], id: string) => rows.find((r) => r.id === id)?.reason;

    const asA = (await a.client.rpc('get_state')).data.assignments;
    expect(reasonIn(asA, aDebt)).toEqual({ code: 'debt', coveredBy: b.id }); // my own reason, for my own Why me?
    expect(reasonIn(asA, bCredit)).toBeNull();
    expect(reasonIn(asA, bTurn)).toEqual({ code: 'turn', previousUserId: a.id }); // not balance-derived: still shown
    const asB = (await b.client.rpc('get_state')).data.assignments;
    expect(reasonIn(asB, aDebt)).toBeNull();
    expect(reasonIn(asB, bCredit)).toEqual({ code: 'credit' });

    // and not straight from the table either
    const direct = await b.client.from('assignments').select('id, reason').eq('id', aDebt);
    expect(direct.error?.code).toBe('42501');
    expect((await b.client.from('assignments').select('id, status').eq('id', aDebt)).data).toHaveLength(1);
  });

  test('realtime still signals assignment changes with the reason column hidden', async () => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());
    const { data: row } = await admin().from('assignments').select('id').eq('household_id', h).limit(1).single();
    let seen = false;
    const ch = b.client.channel(`probe-${h}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'assignments', filter: `household_id=eq.${h}` }, () => { seen = true; });
    await new Promise<void>((res, rej) => ch.subscribe((s) => (s === 'SUBSCRIBED' ? res() : s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' ? rej(new Error(s)) : undefined)));
    await new Promise((r) => setTimeout(r, 1500)); // let the subscription register server-side
    await admin().from('assignments').update({ day: today, status: 'done' }).eq('id', row!.id);
    for (let i = 0; i < 40 && !seen; i++) await new Promise((r) => setTimeout(r, 250));
    await b.client.removeChannel(ch);
    expect(seen).toBe(true);
  }, 30_000);

  test('private helpers are not callable through the API', async () => {
    const res = await a.client.schema('private' as never).rpc('is_member', { h });
    expect(res.error).not.toBeNull();
  });
});
