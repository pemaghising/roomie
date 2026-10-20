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
