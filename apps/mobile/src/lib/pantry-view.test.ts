import { describe, expect, test } from 'vitest';
import type { PantryItem, Restock } from '@domain/pantry.ts';
import { ago, lowRow, shelfMeta } from './pantry-view';

const item = (id: string, created = '2026-10-01T10:00:00Z'): PantryItem => ({ id, owner_id: null, name: id, rule: null, stock: 'low', created_at: created });
const R = (p: Partial<Restock>): Restock => ({ id: 'r', item_id: 'milk', name: 'Milk', effort: 1, requested_by: 'pri', claimed_by: null, status: 'open', done_by: null, done_day: null, created_at: '2026-10-20T00:00:00Z', ...p });
const names = { pri: 'Priya Shah', aman: 'Aman K', me: 'Ramesh' };

describe('ago', () => {
  test.each([[0, 'today'], [1, 'yesterday'], [2, '2 days ago'], [6, '6 days ago'], [7, 'last week'], [13, 'last week'], [21, '3 weeks ago']])(
    '%i days → %s', (n, words) => expect(ago(n)).toBe(words));
});

describe('lowRow (P1 / W3)', () => {
  test('nobody on it yet: I can get it', () => expect(lowRow(item('milk'), [], 'me', names)).toEqual({ kind: 'claim' }));
  test("a roommate on it shows their name", () => expect(lowRow(item('milk'), [R({ claimed_by: 'pri' })], 'me', names)).toEqual({ kind: 'theirs', label: 'Priya’s getting it' }));
  test('me on it', () => expect(lowRow(item('milk'), [R({ claimed_by: 'me' })], 'me', names)).toEqual({ kind: 'mine', label: 'You’re getting it' }));
});

describe('shelfMeta (P1 in stock)', () => {
  test('last restock names who bought it', () =>
    expect(shelfMeta(item('milk'), [R({ status: 'done', done_by: 'aman', done_day: '2026-10-19' })], 'me', names, '2026-10-21')).toBe('Aman · 2 days ago'));
  test('me', () =>
    expect(shelfMeta(item('milk'), [R({ status: 'done', done_by: 'me', done_day: '2026-10-17' })], 'me', names, '2026-10-21')).toBe('You · 4 days ago'));
  test('never restocked: when it was added', () => expect(shelfMeta(item('salt', '2026-10-20T08:00:00Z'), [], 'me', names, '2026-10-21')).toBe('Added yesterday'));
});
