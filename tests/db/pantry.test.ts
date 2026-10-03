// @vitest-environment node
import { createClient } from '@supabase/supabase-js';
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

describe.skipIf(!hasDb)('pantry items', () => {
  let a: U; let b: U; let x: U; let h: string;
  beforeAll(async () => {
    [a, b, x] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Xena')]);
    h = await seedHousehold(a.id, [b.id]);
    await seedHousehold(x.id);
  });
  const row = async (id: string) => (await admin().from('pantry_items').select('*').eq('id', id).single()).data!;
  const idOf = async (name: string, owner: string | null) => {
    const q = admin().from('pantry_items').select('id').eq('household_id', h).eq('name', name).is('archived_at', null);
    return ((await (owner ? q.eq('owner_id', owner) : q.is('owner_id', null)).single()).data!.id) as string;
  };

  test('add_pantry_item: shared items have no owner or rule; personal ones default to ask first', async () => {
    const shared = await a.client.rpc('add_pantry_item', { p_name: '  Paper   towels ', p_owner_personal: false });
    expect(shared.error).toBeNull();
    expect(await row(shared.data)).toMatchObject({ household_id: h, owner_id: null, rule: null, stock: 'in_stock', name: 'Paper towels', created_by: a.id });
    const mine = await b.client.rpc('add_pantry_item', { p_name: 'Oat milk', p_owner_personal: true });
    expect(await row(mine.data)).toMatchObject({ owner_id: b.id, rule: 'ask_first' });
  });

  test('duplicates are refused per shelf, ignoring case and spacing', async () => {
    expect((await b.client.rpc('add_pantry_item', { p_name: ' PAPER  TOWELS', p_owner_personal: false })).error?.message).toContain('duplicate_item');
    expect((await b.client.rpc('add_pantry_item', { p_name: 'oat milk', p_owner_personal: true })).error?.message).toContain('duplicate_item');
    expect((await a.client.rpc('add_pantry_item', { p_name: 'Oat milk', p_owner_personal: true })).error).toBeNull(); // Aarav's own shelf
  });

  test('bad input is invalid_input', async () => {
    expect((await a.client.rpc('add_pantry_item', { p_name: '   ', p_owner_personal: false })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('add_pantry_item', { p_name: 'x'.repeat(41), p_owner_personal: false })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('add_pantry_item', { p_name: 'Salt', p_owner_personal: false, p_rule: 'ask_first' })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('add_pantry_basics', { p_names: ['Rice', ''] })).error?.message).toContain('invalid_input');
    expect((await a.client.rpc('request_restock', { p_name: 'Salt', p_effort: 4 })).error?.message).toContain('invalid_input');
  });

  test('add_pantry_basics adds the missing basics and skips what is there', async () => {
    const names = ['Olive oil', 'Rice', 'paper towels'];
    expect((await a.client.rpc('add_pantry_basics', { p_names: names })).error).toBeNull();
    expect((await b.client.rpc('add_pantry_basics', { p_names: names })).error).toBeNull();
    const { data } = await admin().from('pantry_items').select('name, stock').eq('household_id', h).is('owner_id', null).is('archived_at', null);
    expect(data!.map((r) => r.name).sort()).toEqual(['Olive oil', 'Paper towels', 'Rice']);
    expect(data!.every((r) => r.stock === 'in_stock')).toBe(true);
  });

  test("anyone sets a shared item's stock; only the owner changes a personal item", async () => {
    const rice = await idOf('Rice', null);
    const oat = await idOf('Oat milk', b.id);
    expect((await b.client.rpc('set_item_stock', { p_id: rice, p_stock: 'low' })).error).toBeNull();
    expect((await row(rice)).stock).toBe('low');
    expect((await a.client.rpc('set_item_stock', { p_id: oat, p_stock: 'out' })).error?.message).toContain('not_allowed');
    expect((await a.client.rpc('set_item_rule', { p_id: oat, p_rule: 'do_not_touch' })).error?.message).toContain('not_allowed');
    expect((await a.client.rpc('remove_pantry_item', { p_id: oat })).error?.message).toContain('not_allowed');
    expect((await b.client.rpc('set_item_rule', { p_id: oat, p_rule: 'do_not_touch' })).error).toBeNull();
    expect((await row(oat)).rule).toBe('do_not_touch');
    expect((await b.client.rpc('set_item_rule', { p_id: rice, p_rule: 'ask_first' })).error?.message).toContain('not_allowed'); // shared items have no rule
    expect((await x.client.rpc('set_item_stock', { p_id: rice, p_stock: 'out' })).error?.message).toContain('not_allowed'); // another household
  });

  test('removing archives the item and frees its name', async () => {
    const { data: id } = await a.client.rpc('add_pantry_item', { p_name: 'Ketchup', p_owner_personal: false });
    expect((await b.client.rpc('remove_pantry_item', { p_id: id })).error).toBeNull();
    expect((await row(id)).archived_at).not.toBeNull();
    expect((await a.client.rpc('add_pantry_item', { p_name: 'ketchup', p_owner_personal: false })).error).toBeNull();
  });
});

describe.skipIf(!hasDb)('restock requests', () => {
  let a: U; let b: U; let c: U; let h: string;
  const shared = (name: string, stock = 'in_stock') => seedItem(h, a.id, { name, stock });
  const req = async (id: string) => (await admin().from('restock_requests').select('*').eq('id', id).single()).data!;
  const stockOf = async (id: string) => (await admin().from('pantry_items').select('stock').eq('id', id).single()).data!.stock;
  beforeAll(async () => {
    [a, b, c] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima')]);
    h = await seedHousehold(a.id, [b.id, c.id]);
  });

  test('requesting from an item marks it out, tells everyone else, and logs it', async () => {
    const towels = await shared('Paper towels');
    const { data: rid, error } = await b.client.rpc('request_restock', { p_item: towels, p_effort: 2 });
    expect(error).toBeNull();
    expect(await req(rid)).toMatchObject({ item_id: towels, name: 'Paper towels', effort: 2, requested_by: b.id, status: 'open', claimed_by: null });
    expect(await stockOf(towels)).toBe('out');
    const { data: notes } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'restock');
    expect(notes!.map((n) => n.user_id).sort()).toEqual([a.id, c.id].sort());
    for (const n of notes!) expect(n.payload).toEqual({ actor: 'Priya', item: 'Paper towels' });
    const { data: log } = await admin().from('activity').select('kind, payload').eq('household_id', h).eq('kind', 'restock_requested');
    expect(log).toEqual([{ kind: 'restock_requested', payload: { actor: 'Priya', item: 'Paper towels' } }]);
  });

  test('one open request per item', async () => {
    const salt = await shared('Salt');
    expect((await a.client.rpc('request_restock', { p_item: salt, p_effort: 1 })).error).toBeNull();
    expect((await b.client.rpc('request_restock', { p_item: salt, p_effort: 1 })).error?.message).toContain('already_requested');
    expect((await b.client.rpc('request_restock', { p_name: ' SALT ', p_effort: 1 })).error?.message).toContain('already_requested');
  });

  test('a low item stays low; free text links to a matching shared item or stands alone', async () => {
    const rice = await shared('Rice', 'low');
    const { data: r1 } = await a.client.rpc('request_restock', { p_name: ' rice ', p_effort: 1 });
    expect((await req(r1)).item_id).toBe(rice);
    expect(await stockOf(rice)).toBe('low');
    const { data: r2 } = await a.client.rpc('request_restock', { p_name: 'Dish soap', p_effort: 1 });
    expect(await req(r2)).toMatchObject({ item_id: null, name: 'Dish soap' });
  });

  test('personal items cannot be restock-requested', async () => {
    const { data: mine } = await b.client.rpc('add_pantry_item', { p_name: 'Protein shake', p_owner_personal: true, p_rule: 'do_not_touch' });
    expect((await b.client.rpc('request_restock', { p_item: mine, p_effort: 1 })).error?.message).toContain('not_allowed');
  });

  test('claim race: exactly one roommate wins; only the claimer can unclaim', async () => {
    const { data: rid } = await a.client.rpc('request_restock', { p_name: 'Bin bags', p_effort: 1 });
    const results = await Promise.all([b.client.rpc('claim_restock', { p_id: rid }), c.client.rpc('claim_restock', { p_id: rid })]);
    const errors = results.filter((r) => r.error);
    expect(errors).toHaveLength(1);
    expect(errors[0].error!.message).toContain('already_claimed');
    const winner = (await req(rid)).claimed_by === b.id ? b : c;
    const loser = winner === b ? c : b;
    expect((await loser.client.rpc('unclaim_restock', { p_id: rid })).error?.message).toContain('not_allowed');
    expect((await winner.client.rpc('unclaim_restock', { p_id: rid })).error).toBeNull();
    expect((await req(rid)).claimed_by).toBeNull();
  });

  test("completing sets the item in stock, tells the requester, touches no ledger, and is safe to replay", async () => {
    const milk = await shared('Milk');
    const { data: rid } = await b.client.rpc('request_restock', { p_item: milk, p_effort: 3 });
    expect((await c.client.rpc('complete_restock', { p_id: rid })).error).toBeNull();
    expect((await c.client.rpc('complete_restock', { p_id: rid })).error).toBeNull(); // offline replay
    expect(await req(rid)).toMatchObject({ status: 'done', done_by: c.id, claimed_by: c.id });
    expect(await stockOf(milk)).toBe('in_stock');
    const { data: notes } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'restock_done');
    expect(notes).toEqual([{ user_id: b.id, payload: { actor: 'Nima', item: 'Milk' } }]);
    const { data: ledger } = await admin().from('effort_ledger').select('balance').eq('household_id', h);
    expect(ledger!.map((l) => l.balance)).toEqual([0, 0, 0]); // one row per member, all untouched
    const { data: log } = await admin().from('activity').select('payload').eq('household_id', h).eq('kind', 'restocked');
    expect(log).toEqual([{ payload: { actor: 'Nima', item: 'Milk' } }]);
  });

  test("someone else's claimed request cannot be completed by you", async () => {
    const { data: rid } = await a.client.rpc('request_restock', { p_name: 'Coffee', p_effort: 1 });
    expect((await b.client.rpc('claim_restock', { p_id: rid })).error).toBeNull();
    expect((await c.client.rpc('complete_restock', { p_id: rid })).error?.message).toContain('already_claimed');
  });

  test('complete race: exactly one roommate completes; the other hears already_claimed', async () => {
    const { data: rid } = await a.client.rpc('request_restock', { p_name: 'Eggs', p_effort: 1 });
    const results = await Promise.all([b.client.rpc('complete_restock', { p_id: rid }), c.client.rpc('complete_restock', { p_id: rid })]);
    const errors = results.filter((r) => r.error);
    expect(errors).toHaveLength(1);
    expect(errors[0].error!.message).toContain('already_claimed');
    const { data: notes } = await admin().from('notifications').select('id').eq('household_id', h).eq('kind', 'restock_done').eq('payload->>item', 'Eggs');
    expect(notes).toHaveLength(1);
    const { data: log } = await admin().from('activity').select('id').eq('household_id', h).eq('kind', 'restocked').eq('payload->>item', 'Eggs');
    expect(log).toHaveLength(1);
  });

  test('completing while someone marks the item in stock never deadlocks and ends consistent', async () => {
    for (let i = 0; i < 5; i++) {
      const item = await shared(`Butter ${i}`);
      const { data: rid, error } = await a.client.rpc('request_restock', { p_item: item, p_effort: 1 });
      expect(error).toBeNull();
      const results = await Promise.all([
        b.client.rpc('complete_restock', { p_id: rid }),
        c.client.rpc('set_item_stock', { p_id: item, p_stock: 'in_stock' }),
      ]);
      // completing after the request was closed is a plain refusal; anything else (e.g. 40P01 deadlock) is a bug
      for (const r of results) if (r.error) expect(r.error.message).toBe('not_allowed');
      expect(await stockOf(item)).toBe('in_stock');
      expect(['done', 'cancelled']).toContain((await req(rid)).status);
    }
  });

  test('only the requester cancels; marking the item in stock closes the request and tells the claimer', async () => {
    const tea = await shared('Tea');
    const { data: rid } = await a.client.rpc('request_restock', { p_item: tea, p_effort: 1 });
    expect((await b.client.rpc('cancel_restock', { p_id: rid })).error?.message).toContain('not_allowed');
    await b.client.rpc('claim_restock', { p_id: rid });
    expect((await c.client.rpc('set_item_stock', { p_id: tea, p_stock: 'in_stock' })).error).toBeNull();
    expect((await req(rid)).status).toBe('cancelled');
    const { data: notes } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'restock_closed');
    expect(notes).toEqual([{ user_id: b.id, payload: { item: 'Tea' } }]);
    const { data: own } = await a.client.rpc('request_restock', { p_name: 'Sponges', p_effort: 1 });
    expect((await a.client.rpc('cancel_restock', { p_id: own })).error).toBeNull();
    expect((await req(own)).status).toBe('cancelled');
  });

  test('removing an item cancels its open request', async () => {
    const jam = await shared('Jam');
    const { data: rid } = await a.client.rpc('request_restock', { p_item: jam, p_effort: 1 });
    expect((await b.client.rpc('remove_pantry_item', { p_id: jam })).error).toBeNull();
    expect((await req(rid)).status).toBe('cancelled');
  });
});

describe.skipIf(!hasDb)('asks', () => {
  let a: U; let b: U; let c: U; let h: string; let oat: string; let shake: string;
  beforeAll(async () => {
    [a, b, c] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima')]);
    h = await seedHousehold(a.id, [b.id, c.id]);
    oat = (await b.client.rpc('add_pantry_item', { p_name: 'Oat milk', p_owner_personal: true })).data;
    shake = (await b.client.rpc('add_pantry_item', { p_name: 'Protein shake', p_owner_personal: true, p_rule: 'do_not_touch' })).data;
  });

  test("you can only ask about a roommate's ask-first item", async () => {
    expect((await b.client.rpc('ask_to_use', { p_item: oat })).error?.message).toContain('not_allowed'); // own item
    expect((await a.client.rpc('ask_to_use', { p_item: shake })).error?.message).toContain('not_allowed'); // do not touch
    const { data: bread } = await a.client.rpc('add_pantry_item', { p_name: 'Bread', p_owner_personal: false });
    expect((await a.client.rpc('ask_to_use', { p_item: bread })).error?.message).toContain('not_allowed'); // shared
  });

  test('an ask notifies the owner once; asking again while pending returns the same ask', async () => {
    const first = await a.client.rpc('ask_to_use', { p_item: oat });
    expect(first.error).toBeNull();
    expect((await a.client.rpc('ask_to_use', { p_item: oat })).data).toBe(first.data);
    const { data: notes } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'ask');
    expect(notes).toEqual([{ user_id: b.id, payload: { actor: 'Aarav', item: 'Oat milk' } }]);
    expect((await admin().from('activity').select('id').eq('household_id', h)).data).toEqual([]); // never in the household feed
  });

  test('only the owner answers; the asker hears back', async () => {
    const { data: ask } = await admin().from('pantry_asks').select('id').eq('item_id', oat).eq('status', 'pending').single();
    expect((await c.client.rpc('answer_ask', { p_ask: ask!.id, p_yes: true })).error?.message).toContain('not_allowed');
    expect((await a.client.rpc('answer_ask', { p_ask: ask!.id, p_yes: true })).error?.message).toContain('not_allowed');
    expect((await b.client.rpc('answer_ask', { p_ask: ask!.id, p_yes: true })).error).toBeNull();
    expect((await b.client.rpc('answer_ask', { p_ask: ask!.id, p_yes: true })).error).toBeNull(); // offline replay
    const { data: notes } = await admin().from('notifications').select('user_id, payload').eq('household_id', h).eq('kind', 'ask_answer');
    expect(notes).toEqual([{ user_id: a.id, payload: { actor: 'Priya', item: 'Oat milk', accepted: true } }]);
  });

  test('an unanswered ask lapses after 24 h and can be asked again', async () => {
    const { data: id } = await c.client.rpc('ask_to_use', { p_item: oat });
    await admin().from('pantry_asks').update({ created_at: new Date(Date.now() - 25 * 3_600_000).toISOString() }).eq('id', id);
    expect((await b.client.rpc('answer_ask', { p_ask: id, p_yes: true })).error?.message).toContain('not_allowed');
    const { data: fresh } = await c.client.rpc('ask_to_use', { p_item: oat });
    expect(fresh).toBeTruthy();
    expect(fresh).not.toBe(id);
  });
});

describe.skipIf(!hasDb)('pantry and membership', () => {
  test('a member who leaves takes their shelf with them and drops their claims', async () => {
    const [a, b] = await Promise.all([makeUser('Aarav'), makeUser('Priya')]);
    await seedHousehold(a.id, [b.id]);
    const { data: mine } = await b.client.rpc('add_pantry_item', { p_name: 'Hot sauce', p_owner_personal: true, p_rule: 'do_not_touch' });
    const { data: rid } = await a.client.rpc('request_restock', { p_name: 'Rice', p_effort: 1 });
    await b.client.rpc('claim_restock', { p_id: rid });
    expect((await b.client.rpc('leave_household')).error).toBeNull();
    expect((await admin().from('pantry_items').select('archived_at').eq('id', mine).single()).data!.archived_at).not.toBeNull();
    expect((await admin().from('restock_requests').select('claimed_by, status').eq('id', rid).single()).data).toEqual({ claimed_by: null, status: 'open' });
  });

  test('pantry RPCs are for signed-in members only', async () => {
    const anon = createClient(process.env.SUPABASE_TEST_URL!, process.env.SUPABASE_TEST_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    expect((await anon.rpc('add_pantry_item', { p_name: 'X', p_owner_personal: false })).error).not.toBeNull();
    const lone = await makeUser('Lone');
    expect((await lone.client.rpc('add_pantry_item', { p_name: 'X', p_owner_personal: false })).error?.message).toContain('not_member');
  });
});

const todayKtm = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());

describe.skipIf(!hasDb)('get_state pantry', () => {
  test("active items, open and this week's done requests, and only my own asks", async () => {
    const [a, b, c] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima')]);
    await seedHousehold(a.id, [b.id, c.id]);
    const { data: oat } = await b.client.rpc('add_pantry_item', { p_name: 'Oat milk', p_owner_personal: true });
    const { data: gone } = await a.client.rpc('add_pantry_item', { p_name: 'Old jam', p_owner_personal: false });
    await a.client.rpc('remove_pantry_item', { p_id: gone });
    const { data: open } = await a.client.rpc('request_restock', { p_name: 'Rice', p_effort: 1 });
    const { data: done } = await a.client.rpc('request_restock', { p_name: 'Salt', p_effort: 3 });
    await c.client.rpc('complete_restock', { p_id: done });
    const { data: cancelled } = await a.client.rpc('request_restock', { p_name: 'Tea', p_effort: 1 });
    await a.client.rpc('cancel_restock', { p_id: cancelled });
    const { data: ask } = await a.client.rpc('ask_to_use', { p_item: oat });

    const asA = (await a.client.rpc('get_state')).data;
    expect(asA.pantry.map((i: { name: string }) => i.name)).toEqual(['Oat milk']);
    expect(asA.pantry[0]).toMatchObject({ id: oat, owner_id: b.id, rule: 'ask_first', stock: 'in_stock' });
    expect(asA.restocks.map((r: { id: string }) => r.id).sort()).toEqual([open, done].sort());
    expect(asA.restocks.find((r: { id: string }) => r.id === done)).toMatchObject({ status: 'done', done_by: c.id, done_day: todayKtm(), effort: 3 });
    expect(asA.asks.map((x: { id: string }) => x.id)).toEqual([ask]);
    expect((await b.client.rpc('get_state')).data.asks.map((x: { id: string }) => x.id)).toEqual([ask]);
    expect((await c.client.rpc('get_state')).data.asks).toEqual([]);

    // answered: the asker still sees the answer for a day; the owner no longer has anything to do
    await b.client.rpc('answer_ask', { p_ask: ask, p_yes: false });
    expect((await a.client.rpc('get_state')).data.asks).toMatchObject([{ id: ask, status: 'no' }]);
    expect((await b.client.rpc('get_state')).data.asks).toEqual([]);
  });

  test('a pending ask drops out once it is stale: 24 h old, item now do_not_touch, or the asker left', async () => {
    const [a, b, c, d] = await Promise.all([makeUser('Aarav'), makeUser('Priya'), makeUser('Nima'), makeUser('Dawa')]);
    await seedHousehold(a.id, [b.id, c.id, d.id]);
    const { data: oat } = await b.client.rpc('add_pantry_item', { p_name: 'Oat milk', p_owner_personal: true });
    const { data: jam } = await b.client.rpc('add_pantry_item', { p_name: 'Jam', p_owner_personal: true });
    const { data: old } = await a.client.rpc('ask_to_use', { p_item: oat });
    const { data: fresh } = await c.client.rpc('ask_to_use', { p_item: oat });
    const { data: leaver } = await d.client.rpc('ask_to_use', { p_item: oat });
    const { data: moot } = await a.client.rpc('ask_to_use', { p_item: jam });
    const asked = (await b.client.rpc('get_state')).data.asks.map((x: { id: string }) => x.id).sort();
    expect(asked).toEqual([old, fresh, leaver, moot].sort());

    const aged = await admin().from('pantry_asks').update({ created_at: new Date(Date.now() - 25 * 3600_000).toISOString() }).eq('id', old);
    expect(aged.error).toBeNull();
    expect((await b.client.rpc('set_item_rule', { p_id: jam, p_rule: 'do_not_touch' })).error).toBeNull();
    expect((await d.client.rpc('leave_household')).error).toBeNull();
    expect((await b.client.rpc('get_state')).data.asks.map((x: { id: string }) => x.id)).toEqual([fresh]);
    expect((await a.client.rpc('get_state')).data.asks).toEqual([]);
  });
});
