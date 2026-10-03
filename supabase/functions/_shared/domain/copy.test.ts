import { describe, expect, test } from 'vitest';
import { balanceSentence, effortLabel, ERROR_CODES, errorText, reasonText } from './copy.ts';

const names = { a: 'Aarav', p: 'Priya' };

describe('reasonText — every assignment explains itself in one sentence', () => {
  test.each([
    [{ code: 'busy_moved', busyDay: 2 } as const, 'Heavy task moved off your busy Wednesday.'],
    [{ code: 'turn', previousUserId: 'p' } as const, 'Your turn — Priya did it last week.'],
    [{ code: 'debt', coveredBy: 'p' } as const, 'A little extra this week — Priya covered for you.'],
    [{ code: 'debt' } as const, 'A little extra this week to even things out.'],
    [{ code: 'credit' } as const, 'A lighter week — you covered for a roommate.'],
    [{ code: 'balance', points: 6, target: 7 } as const, "Evens out effort: you're at 6 of 7 points this week."],
    [{ code: 'everyone_busy', day: 4 } as const, "Everyone's busy Friday, so this went to whoever had the lightest week."],
    [{ code: 'swap', withUserId: 'a' } as const, 'Swapped with Aarav.'],
  ])('%o', (reason, text) => expect(reasonText(reason, names)).toBe(text));

  test('unknown names fall back gracefully', () => {
    expect(reasonText({ code: 'turn', previousUserId: 'zz' }, names)).toBe('Your turn — a roommate did it last week.');
  });
});

test('effortLabel', () => {
  expect([1, 2, 3].map(effortLabel)).toEqual(['Light', 'Medium', 'Heavy']);
});

test('errorText maps server codes and falls back', () => {
  expect(errorText('already_claimed')).toBe('Someone already grabbed this one.');
  expect(errorText('something_new')).toBe("Something went wrong. We'll keep trying.");
});

test('errorText covers the pantry refusals, and the client recognises their codes', () => {
  expect(errorText('duplicate_item')).toBe('Already in the pantry.');
  expect(errorText('already_requested')).toBe("Already requested — it's in the Chores pool.");
  expect(ERROR_CODES).toContain('duplicate_item');
  expect(ERROR_CODES).toContain('already_requested');
});

test('balanceSentence never ranks, only explains', () => {
  expect(balanceSentence(0)).toBe("You're all square with the house.");
  expect(balanceSentence(2)).toBe("You'll pick up 2 extra points over the next week.");
  expect(balanceSentence(-1)).toBe("You're 1 point ahead — next week will be a little lighter.");
});
