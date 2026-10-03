// @vitest-environment node
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { admin, cleanup, hasDb, makeUser as mk, seedHousehold as seedH } from './helpers';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 });
type U = Awaited<ReturnType<typeof mk>>;
const users: string[] = [];
const homes: string[] = [];
const makeUser: typeof mk = async (n) => { const u = await mk(n); users.push(u.id); return u; };
const seedHousehold: typeof seedH = async (...args) => { const h = await seedH(...args); homes.push(h); return h; };
afterAll(async () => { await cleanup({ householdIds: homes, userIds: users }); }, 60_000);

/** Inserts a pantry item directly (service role), bypassing the RPCs. */
async function seedItem(h: string, by: string, over: Record<string, unknown> = {}): Promise<string> {
  const { data, error } = await admin().from('pantry_items').insert({ household_id: h, name: 'Milk', created_by: by, ...over }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

describe.skipIf(!hasDb)('pantry row-level security', () => {
  let a: U; let b: U; let c: U; let x: U; let h: string;

  beforeAll(async () => {
    [a, b, c, x] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima'), makeUser('Xena')]);
    h = await seedHousehold(a.id, [b.id, c.id]);
    await seedHousehold(x.id);
    const oat = await seedItem(h, a.id, { owner_id: a.id, rule: 'ask_first', name: 'Oat milk' });
    const r = await admin().from('restock_requests').insert({ household_id: h, name: 'Rice', effort: 1, requested_by: b.id });
    if (r.error) throw r.error;
    const k = await admin().from('pantry_asks').insert({ household_id: h, item_id: oat, from_user: b.id, to_user: a.id });
    if (k.error) throw k.error;
  });

  test("members read their household's items and requests; other households read nothing", async () => {
    expect((await c.client.from('pantry_items').select('id')).data).toHaveLength(1);
    expect((await c.client.from('restock_requests').select('id')).data).toHaveLength(1);
    expect((await x.client.from('pantry_items').select('id')).data).toEqual([]);
    expect((await x.client.from('restock_requests').select('id')).data).toEqual([]);
  });

  test('asks are visible only to the two people involved', async () => {
    expect((await a.client.from('pantry_asks').select('id')).data).toHaveLength(1);
    expect((await b.client.from('pantry_asks').select('id')).data).toHaveLength(1);
    expect((await c.client.from('pantry_asks').select('id')).data).toEqual([]);
    expect((await x.client.from('pantry_asks').select('id')).data).toEqual([]);
  });

  test('clients cannot write pantry tables directly', async () => {
    expect((await a.client.from('pantry_items').insert({ household_id: h, name: 'Hack', created_by: a.id })).error?.code).toBe('42501');
    expect((await a.client.from('restock_requests').insert({ household_id: h, name: 'Hack', effort: 1, requested_by: a.id })).error?.code).toBe('42501');
    const { data: item } = await admin().from('pantry_items').select('id').eq('household_id', h).single();
    expect((await a.client.from('pantry_asks').insert({ household_id: h, item_id: item!.id, from_user: c.id, to_user: a.id })).error?.code).toBe('42501');
    await a.client.from('pantry_items').update({ stock: 'out' }).eq('household_id', h);
    expect((await admin().from('pantry_items').select('stock').eq('household_id', h).single()).data!.stock).toBe('in_stock');
    await b.client.from('restock_requests').delete().eq('household_id', h);
    expect((await admin().from('restock_requests').select('id').eq('household_id', h)).data).toHaveLength(1);
  });

  test('a shared item cannot carry a rule, and a personal item must have one', async () => {
    expect((await admin().from('pantry_items').insert({ household_id: h, name: 'Salt', created_by: a.id, rule: 'ask_first' })).error?.code).toBe('23514');
    expect((await admin().from('pantry_items').insert({ household_id: h, name: 'Salt', created_by: a.id, owner_id: a.id })).error?.code).toBe('23514');
  });

  test('names are unique per shelf, ignoring case, among active items only', async () => {
    await seedItem(h, a.id, { name: 'Bread' });
    expect((await admin().from('pantry_items').insert({ household_id: h, name: 'bread', created_by: a.id })).error?.code).toBe('23505');
    await seedItem(h, b.id, { name: 'Bread', owner_id: b.id, rule: 'do_not_touch' }); // a personal shelf is its own namespace
    await admin().from('pantry_items').update({ archived_at: new Date().toISOString() }).eq('household_id', h).is('owner_id', null).eq('name', 'Bread');
    await seedItem(h, a.id, { name: 'BREAD' }); // archived names are free again
  });
});
