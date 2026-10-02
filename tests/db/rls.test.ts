// @vitest-environment node
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { admin, cleanup, hasDb, makeUser, seedHousehold } from './helpers';

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

  test('private helpers are not callable through the API', async () => {
    const res = await a.client.schema('private' as never).rpc('is_member', { h });
    expect(res.error).not.toBeNull();
  });
});
