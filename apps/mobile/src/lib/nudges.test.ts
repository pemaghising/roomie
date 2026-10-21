import { describe, expect, test } from 'vitest';
import { planNudges } from './nudges';

const due = [
  { id: 'a', name: 'Wash dishes', status: 'todo' as const },
  { id: 'b', name: 'Take out trash', status: 'todo' as const },
  { id: 'c', name: 'Sweep living room', status: 'done' as const },
];
const emoji = /\p{Extended_Pictographic}/u;

describe('planNudges', () => {
  test('one nudge per chore still to do, at 7 pm local, none for done chores', () => {
    const n = planNudges(due, 'motivate', '2026-10-17', 23, 'Asia/Kathmandu');
    expect(n.map((x) => x.id)).toEqual(['a', 'b']);
    expect(n[0].at.toISOString()).toBe('2026-10-17T13:15:00.000Z'); // 19:00 Kathmandu
  });

  test('"Motivate me" mentions the streak and can use emoji', () => {
    const [n] = planNudges(due, 'motivate', '2026-10-17', 23, 'Asia/Kathmandu');
    expect(n.body).toBe('Wash dishes is yours tonight. Keep the 23-day streak going! 🌱');
  });

  test('"Just the facts" is plain text with no emoji', () => {
    const [n] = planNudges(due, 'facts', '2026-10-17', 23, 'Asia/Kathmandu');
    expect(n.body).toBe('Wash dishes is due today at 7 pm.');
    expect(emoji.test(n.title + n.body)).toBe(false);
  });
});
