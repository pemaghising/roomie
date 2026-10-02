import { describe, expect, test } from 'vitest';
import { balanceSentence, effortLabel, errorText, nudge, reasonText } from './copy.ts';

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

describe('nudge — two tones, never nagging', () => {
  test('digest', () => {
    expect(nudge('digest', 'motivate', { chores: ['Bathroom', 'Take out trash'] }))
      .toEqual({ title: 'Good morning 🌱', body: '2 tasks today — Bathroom and Take out trash.' });
    expect(nudge('digest', 'facts', { chores: ['Bathroom'] }))
      .toEqual({ title: 'Today', body: 'Bathroom.' });
  });
  test('pool', () => {
    expect(nudge('pool', 'motivate', { chore: 'Mop bathroom floor' }).body).toBe('Up for grabs: Mop bathroom floor. Be a hero?');
    expect(nudge('pool', 'facts', { chore: 'Mop bathroom floor' }).body).toBe('Unclaimed: Mop bathroom floor.');
  });
  test('pool batches one sweep into one push', () => {
    expect(nudge('pool', 'motivate', { chores: ['Bins'] })).toEqual({ title: 'Up for grabs 🙌', body: 'Up for grabs: Bins. Be a hero?' });
    expect(nudge('pool', 'facts', { chores: ['Bins'] })).toEqual({ title: 'Unclaimed chore', body: 'Unclaimed: Bins.' });
    expect(nudge('pool', 'motivate', { chores: ['Bins', 'Dishes', 'Mop'] }))
      .toEqual({ title: 'Up for grabs 🙌', body: 'Up for grabs: Bins, Dishes and Mop. Grab one?' });
    expect(nudge('pool', 'facts', { chores: ['Bins', 'Dishes'] })).toEqual({ title: 'Unclaimed chores', body: 'Unclaimed: Bins and Dishes.' });
  });
  test('covered is private and kind', () => {
    expect(nudge('covered', 'motivate', { actor: 'Aarav', chore: 'Bathroom', effort: 3 }).body)
      .toBe("Aarav covered the Bathroom — you'll pick up a little extra next week (+3 pts).");
    expect(nudge('covered', 'facts', { actor: 'Aarav', chore: 'Bathroom', effort: 1 }).body)
      .toBe('Aarav covered Bathroom. +1 pt next week.');
  });
  test('every kind has copy in both tones', () => {
    const kinds = ['digest', 'pool', 'plan_ready', 'plan_locked', 'covered', 'day_kept', 'swap_request', 'swap_answer', 'joined'] as const;
    for (const k of kinds) for (const s of ['motivate', 'facts'] as const) {
      const n = nudge(k, s, { chore: 'X', chores: ['X'], actor: 'A', streak: 2, effort: 1, accepted: true, offered: 'Y' });
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.body.length).toBeGreaterThan(0);
      expect(n.body).not.toMatch(/you forgot|you failed|again\?/i);
    }
  });
});

test('effortLabel', () => {
  expect([1, 2, 3].map(effortLabel)).toEqual(['Light', 'Medium', 'Heavy']);
});

test('errorText maps server codes and falls back', () => {
  expect(errorText('already_claimed')).toBe('Someone already grabbed this one.');
  expect(errorText('something_new')).toBe("Something went wrong. We'll keep trying.");
});

test('balanceSentence never ranks, only explains', () => {
  expect(balanceSentence(0)).toBe("You're all square with the house.");
  expect(balanceSentence(2)).toBe("You'll pick up 2 extra points over the next week.");
  expect(balanceSentence(-1)).toBe("You're 1 point ahead — next week will be a little lighter.");
});
