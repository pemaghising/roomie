import { expect, test } from 'vitest';
import { whyText } from './why';

const names = { me: 'Rahul', pri: 'Priya' };
const a = (over: Record<string, unknown>) => ({ id: '1', plan_id: 'p', chore_id: 'c', user_id: 'me', day: '2026-10-07', effort: 1, status: 'todo', claimed_by: null, done_at: null, reason: null, ...over }) as never;

test('covering a roommate\'s chore says thanks and never reveals their private reason', () => {
  expect(whyText(a({ user_id: 'pri', claimed_by: 'me', reason: { code: 'debt', coveredBy: 'x' } }), 'me', names)).toBe("You're covering for Priya. Thanks.");
});

test('an assigned chore explains itself with the stored reason', () => {
  expect(whyText(a({ reason: { code: 'turn', previousUserId: 'pri' } }), 'me', names)).toBe('Your turn — Priya did it last week.');
});

test('a chore with no stored reason falls back to fair sharing', () => {
  expect(whyText(a({ reason: null }), 'me', names)).toBe('Shared out fairly by effort.');
});

test('the balance reason never shows points', () => {
  const a = { id: 'x', plan_id: 'p', chore_id: 'c', user_id: 'me', day: '2026-10-21', effort: 1, status: 'todo', claimed_by: null, done_at: null,
    reason: { code: 'balance', points: 10, target: 10 } } as unknown as Parameters<typeof whyText>[0];
  const text = whyText(a, 'me', {});
  expect(text).not.toMatch(/\d|point/i);
  expect(text).toBe('Evens out effort across the house this week.');
});
