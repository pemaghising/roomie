import { describe, expect, test } from 'vitest';
import { nudge, type NudgeKind } from './nudge.ts';

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
    const kinds: NudgeKind[] = [
      'digest', 'pool', 'plan_ready', 'plan_locked', 'covered', 'day_kept', 'swap_request', 'swap_answer', 'joined',
      'restock', 'restock_done', 'restock_closed', 'ask', 'ask_answer', 'kudos',
    ];
    for (const k of kinds) for (const s of ['motivate', 'facts'] as const) {
      const n = nudge(k, s, { chore: 'X', chores: ['X'], actor: 'A', streak: 2, effort: 1, accepted: true, offered: 'Y', item: 'Milk', emoji: '🙌' });
      expect(n.title.length).toBeGreaterThan(0);
      expect(n.body.length).toBeGreaterThan(0);
      expect(n.body).not.toContain('undefined');
      expect(n.body).not.toMatch(/you forgot|you failed|again\?/i);
    }
  });
});

describe('kudos', () => {
  test('a cheer from a roommate says who and which emoji, in both tones', () => {
    expect(nudge('kudos', 'motivate', { actor: 'Priya', emoji: '🙌' })).toEqual({ title: 'A cheer for you 🙌', body: 'Priya sent you a 🙌. The house noticed.' });
    expect(nudge('kudos', 'facts', { actor: 'Priya', emoji: '🙌' })).toEqual({ title: 'Kudos', body: 'Priya sent you a 🙌.' });
  });
});

describe('pantry nudges', () => {
  test('restock: one request names who asked; a drain batch lists the items', () => {
    expect(nudge('restock', 'motivate', { actor: 'Priya', item: 'Paper towels' }))
      .toEqual({ title: 'Shopping run? 🛒', body: 'Priya asked for Paper towels. Passing a shop?' });
    expect(nudge('restock', 'facts', { actor: 'Priya', item: 'Paper towels' }))
      .toEqual({ title: 'Restock request', body: 'Needed: Paper towels.' });
    expect(nudge('restock', 'motivate', { actor: 'Priya', items: ['Milk', 'Rice'] }))
      .toEqual({ title: 'Shopping run? 🛒', body: 'The house needs Milk and Rice. Grab one?' });
    expect(nudge('restock', 'facts', { items: ['Milk', 'Rice', 'Salt'] }))
      .toEqual({ title: 'Restock requests', body: 'Needed: Milk, Rice and Salt.' });
  });
  test('restock_done tells the requester who picked it up; restock_closed releases a claimer', () => {
    expect(nudge('restock_done', 'motivate', { actor: 'Aarav', item: 'Milk' }))
      .toEqual({ title: 'Restocked 🛒', body: 'Aarav picked up Milk. One less thing to think about.' });
    expect(nudge('restock_done', 'facts', { actor: 'Aarav', item: 'Milk' })).toEqual({ title: 'Restocked', body: 'Aarav picked up Milk.' });
    expect(nudge('restock_closed', 'motivate', { item: 'Tea' }))
      .toEqual({ title: 'No need to buy it', body: "Tea was restocked — you're off the hook." });
    expect(nudge('restock_closed', 'facts', { item: 'Tea' })).toEqual({ title: 'Restocked', body: 'Tea was restocked.' });
  });
  test('ask and its answer', () => {
    expect(nudge('ask', 'motivate', { actor: 'Aarav', item: 'Oat milk' }))
      .toEqual({ title: 'Quick ask 🙋', body: 'Aarav would like to use your Oat milk. Sure?' });
    expect(nudge('ask', 'facts', { actor: 'Aarav', item: 'Oat milk' })).toEqual({ title: 'Ask', body: 'Aarav asked to use your Oat milk.' });
    expect(nudge('ask_answer', 'motivate', { actor: 'Priya', item: 'Oat milk', accepted: true }))
      .toEqual({ title: 'Go ahead 👍', body: 'Priya said sure — the Oat milk is yours to use.' });
    expect(nudge('ask_answer', 'facts', { actor: 'Priya', item: 'Oat milk', accepted: true })).toEqual({ title: 'Answered', body: 'Priya: sure, Oat milk.' });
    expect(nudge('ask_answer', 'motivate', { actor: 'Priya', item: 'Oat milk', accepted: false }))
      .toEqual({ title: 'Not this time', body: 'Priya needs the Oat milk this time. No worries.' });
    expect(nudge('ask_answer', 'facts', { actor: 'Priya', item: 'Oat milk', accepted: false }))
      .toEqual({ title: 'Answered', body: 'Priya: not this time, Oat milk.' });
  });
  test('the digest adds requests open for 48 h, and can carry only those', () => {
    expect(nudge('digest', 'motivate', { chores: ['Bins'], stale: ['Paper towels'] }).body).toBe('1 task today — Bins. Still needed: Paper towels.');
    expect(nudge('digest', 'facts', { chores: ['Bins'], stale: ['Rice'] }).body).toBe('Bins. Still needed: Rice.');
    expect(nudge('digest', 'facts', { chores: [], stale: ['Paper towels', 'Rice'] })).toEqual({ title: 'Today', body: 'Still needed: Paper towels and Rice.' });
    expect(nudge('digest', 'motivate', { chores: [], stale: ['Rice'] })).toEqual({ title: 'Good morning 🌱', body: 'Still needed: Rice.' });
  });
});
