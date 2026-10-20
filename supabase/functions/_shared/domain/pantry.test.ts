import { describe, expect, test } from 'vitest';
import {
  BASICS, canAsk, cleanName, ICONS, iconFor, myAsk, openRestockFor, openRestocks, type PantryAsk, type PantryItem,
  requestedLine, type Restock, RULE_LABEL, sameName, sortShelf, STOCK_LABEL, tintFor,
} from './pantry.ts';

const item = (over: Partial<PantryItem>): PantryItem =>
  ({ id: 'i1', owner_id: null, name: 'Milk', rule: null, stock: 'in_stock', created_at: '2026-10-01T00:00:00Z', ...over });
const ask = (over: Partial<PantryAsk>): PantryAsk =>
  ({ id: 'k1', item_id: 'i1', from_user: 'me', to_user: 'p', status: 'pending', created_at: '2026-10-01T00:00:00Z', ...over });
const restock = (over: Partial<Restock>): Restock => ({
  id: 'r1', item_id: 'i1', name: 'Milk', effort: 1, requested_by: 'p', claimed_by: null, status: 'open',
  done_by: null, done_day: null, created_at: '2026-10-01T00:00:00Z', ...over,
});

describe('iconFor — a small local dictionary, case- and plural-insensitive', () => {
  test.each([
    ['Milk', '🥛'], ['EGGS', '🥚'], ['Paper Towels', '🧻'], ['Oat milk', '🥛'], ['  olive   OIL ', '🫒'],
    ['Tomatoes', '🍅'], ['Strawberries', '🍓'], ['Cookies', '🍪'], ['Rice', '🍚'], ['Energy Drinks', '⚡'],
    ['Whole milk (2L)', '🥛'], ['Eggs, free range', '🥚'], ['Chicken stock', '🍗'],
  ])('%s → %s', (name, icon) => expect(iconFor(name)).toBe(icon));

  test('unknown or empty names get a cart', () => {
    expect(iconFor('Zorblax')).toBe('🛒');
    expect(iconFor('')).toBe('🛒');
    expect(iconFor('123 !!')).toBe('🛒');
  });

  test('iconFor ignores object-prototype names', () => {
    for (const name of ['Constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) expect(iconFor(name)).toBe('🛒');
  });

  test('at least 40 entries', () => expect(Object.keys(ICONS).length).toBeGreaterThanOrEqual(40));

  test('the basics all have their own icon', () => {
    for (const b of BASICS) expect(iconFor(b)).not.toBe('🛒');
  });
});

test('tintFor is stable and always one of the pastel tokens', () => {
  const tints = new Set(['var(--light-bg)', 'var(--lav)', 'var(--peach-bg)', 'var(--pink-bg)', 'var(--medium-bg)', 'var(--sky-bg)']);
  for (const icon of ['🥛', '🍚', '🧻', '🛒', '🫒']) {
    expect(tints.has(tintFor(icon))).toBe(true);
    expect(tintFor(icon)).toBe(tintFor(icon));
  }
});

describe('sortShelf', () => {
  const shelf = [item({ name: 'salt' }), item({ name: 'Bread', stock: 'low' }), item({ name: 'Rice', stock: 'out' }),
    item({ name: 'apples' }), item({ name: 'Beans', stock: 'out' })];
  test('shared: out, then low, then in stock; alphabetical (ignoring case) inside each', () => {
    expect(sortShelf(shelf, 'shared').map((i) => i.name)).toEqual(['Beans', 'Rice', 'Bread', 'apples', 'salt']);
  });
  test('other tabs: alphabetical only', () => {
    expect(sortShelf(shelf, 'mine').map((i) => i.name)).toEqual(['apples', 'Beans', 'Bread', 'Rice', 'salt']);
    expect(sortShelf(shelf, 'roommates').map((i) => i.name)).toEqual(['apples', 'Beans', 'Bread', 'Rice', 'salt']);
  });
  test('does not mutate its input', () => {
    const before = shelf.map((i) => i.name);
    sortShelf(shelf, 'shared');
    expect(shelf.map((i) => i.name)).toEqual(before);
  });
});

describe('asks', () => {
  const oat = item({ owner_id: 'p', rule: 'ask_first' });
  test("canAsk only on another member's ask-first item with no pending ask from me", () => {
    expect(canAsk(oat, 'me', [])).toBe(true);
    expect(canAsk(oat, 'me', [ask({})])).toBe(false);
    expect(canAsk(oat, 'me', [ask({ status: 'no' })])).toBe(true); // answered: may ask again
    expect(canAsk(oat, 'me', [ask({ from_user: 'n' })])).toBe(true); // someone else's ask
    expect(canAsk(oat, 'p', [])).toBe(false); // own item
    expect(canAsk(item({ owner_id: 'p', rule: 'do_not_touch' }), 'me', [])).toBe(false);
    expect(canAsk(item({}), 'me', [])).toBe(false); // shared
  });
  test('myAsk is my latest ask on the item', () => {
    const asks = [ask({ id: 'old', status: 'no', created_at: '2026-09-30T00:00:00Z' }), ask({ id: 'new', status: 'yes' }), ask({ id: 'x', from_user: 'n' })];
    expect(myAsk(asks, 'i1', 'me')?.id).toBe('new');
    expect(myAsk(asks, 'i2', 'me')).toBeUndefined();
  });
});

describe('restocks and labels', () => {
  test('openRestocks: open only, oldest first; openRestockFor finds an item’s open request', () => {
    const rs = [restock({ id: 'b', created_at: '2026-10-02T00:00:00Z' }), restock({ id: 'a' }), restock({ id: 'd', status: 'done' })];
    expect(openRestocks(rs).map((r) => r.id)).toEqual(['a', 'b']);
    expect(openRestockFor([restock({ status: 'cancelled' }), restock({ id: 'live', item_id: 'i1' })], 'i1')?.id).toBe('live');
    expect(openRestockFor([restock({ status: 'done' })], 'i1')).toBeUndefined();
  });
  test('requestedLine says who is on it', () => {
    const names = { p: 'Priya' };
    expect(requestedLine(restock({}), names, 'me')).toBe('Requested');
    expect(requestedLine(restock({ claimed_by: 'p' }), names, 'me')).toBe("Requested · Priya's on it");
    expect(requestedLine(restock({ claimed_by: 'me' }), names, 'me')).toBe("Requested · You're on it");
    expect(requestedLine(restock({ claimed_by: 'zz' }), names, 'me')).toBe("Requested · A roommate's on it");
  });
  test('labels', () => {
    expect(STOCK_LABEL).toEqual({ in_stock: 'In stock', low: 'Running low', out: 'Out' });
    expect(RULE_LABEL).toEqual({ ask_first: 'Ask first', do_not_touch: 'Do not touch' });
    expect(BASICS).toEqual(['Olive oil', 'Rice', 'Salt', 'Milk', 'Bread', 'Paper towels']);
  });
  test('cleanName and sameName match the server (trim, collapse spaces, ignore case)', () => {
    expect(cleanName('  Paper   towels ')).toBe('Paper towels');
    expect(sameName('  paper   TOWELS ', 'Paper towels')).toBe(true);
    expect(sameName('Paper towel', 'Paper towels')).toBe(false);
  });
});
