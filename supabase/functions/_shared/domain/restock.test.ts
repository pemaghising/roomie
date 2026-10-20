import { expect, test } from 'vitest';
import type { Restock } from './pantry.ts';
import { restockTotals } from './restock.ts';

const r = (over: Partial<Restock>): Restock => ({
  id: crypto.randomUUID(), item_id: null, name: 'Rice', effort: 1, requested_by: 'p', claimed_by: null, status: 'done',
  done_by: 'a', done_day: '2026-10-01', created_at: '2026-10-01T00:00:00Z', ...over,
});

test('restockTotals counts restocks done inside the week, to whoever did them', () => {
  expect(restockTotals([
    r({ done_by: 'a', effort: 2, done_day: '2026-09-27' }), // Sunday
    r({ done_by: 'a', effort: 1, done_day: '2026-10-03' }), // Saturday
    r({ done_by: 'b', effort: 3, done_day: '2026-10-04' }), // next week
    r({ done_by: 'b', effort: 3, done_day: '2026-09-26' }), // last week
    r({ status: 'open', done_by: null, done_day: null }),
    r({ status: 'cancelled', done_by: 'b', done_day: '2026-09-30' }),
  ], '2026-09-27')).toEqual({ a: 3 });
});

test('restockTotals of nothing is empty', () => expect(restockTotals([], '2026-09-27')).toEqual({}));
