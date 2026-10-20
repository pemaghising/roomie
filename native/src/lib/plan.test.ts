import { expect, test } from 'vitest';
import { lockCopy, swapSentence } from './plan';
import { incomingSwaps, pendingDraft } from './selectors';
import type { AppState } from './types';

const plan = (id: string, week_start: string, status: 'draft' | 'locked') => ({ id, week_start, status, lock_at: '', approved_by: [] as string[] });
const state = (plans: ReturnType<typeof plan>[], swaps: unknown[] = []) =>
  ({ today: '2026-10-07', plans, swaps, assignments: [], members: [] }) as unknown as AppState;

test('a draft waiting for review is next week\'s, never a locked or current one', () => {
  expect(pendingDraft(state([plan('a', '2026-10-04', 'draft'), plan('b', '2026-10-11', 'locked')]))).toBeUndefined();
  expect(pendingDraft(state([plan('a', '2026-10-04', 'locked'), plan('b', '2026-10-11', 'draft')]))?.id).toBe('b');
});

test('only swap requests addressed to me are mine to answer', () => {
  const s = state([], [{ id: '1', to_user: 'me' }, { id: '2', to_user: 'pri' }]);
  expect(incomingSwaps(s, 'me').map((w) => w.id)).toEqual(['1']);
});

test('the lock line names the weekday and time in the household timezone, and says when it is locking now', () => {
  expect(lockCopy('2026-10-10T12:15:00Z', 'Asia/Kathmandu', new Date('2026-10-09T00:00:00Z'))).toBe('Draft · locks Saturday 6 pm');
  expect(lockCopy('2026-10-10T12:15:00Z', 'Asia/Kathmandu', new Date('2026-10-11T00:00:00Z'))).toBe('Draft · locking now');
});

test('a swap tells you what it does to your points', () => {
  expect(swapSentence(2)).toBe("You'd take on 2 more points. Your balance gets the credit.");
  expect(swapSentence(1)).toBe("You'd take on 1 more point. Your balance gets the credit.");
  expect(swapSentence(-1)).toBe("You'd hand off 1 point. It evens out next week.");
  expect(swapSentence(-3)).toBe("You'd hand off 3 points. It evens out next week.");
  expect(swapSentence(0)).toBe('An even trade.');
});
