import { expect, test } from 'vitest';
import { activityIcon, activityText, groupActivity } from './activity-text';
import type { ActivityItem } from './types';

const names = { me: 'Rahul', pri: 'Priya', aar: 'Aarav' };
const item = (id: number, kind: string, actor: string | null, payload: Record<string, unknown>, created_at: string): ActivityItem => ({ id, kind, actor, payload, created_at });

test('a cheer reads naturally from each side', () => {
  const k = (actor: string, to: string) => item(1, 'kudos', actor, { to, emoji: '🙌' }, '2026-10-07T05:00:00Z');
  expect(activityText(k('me', 'pri'), names, 'me')).toBe('You sent Priya a 🙌');
  expect(activityText(k('pri', 'me'), names, 'me')).toBe('Priya sent you a 🙌');
  expect(activityText(k('pri', 'aar'), names, 'me')).toBe('Priya sent Aarav a 🙌');
});

test('each event kind gets an icon, and a cheer uses the emoji that was sent', () => {
  expect(activityIcon(item(1, 'completed', 'me', {}, '')).emoji).toBe('✅');
  expect(activityIcon(item(2, 'kudos', 'pri', { emoji: '🔥' }, '')).emoji).toBe('🔥');
  expect(activityIcon(item(3, 'something_new', null, {}, '')).emoji).toBe('🏠');
});

test('unseen events lead as New, then the rest by day, newest first', () => {
  const items = [
    item(4, 'completed', 'pri', { chore: 'Bins' }, '2026-10-07T06:00:00Z'), // today, unseen
    item(3, 'claimed', 'aar', { chore: 'Mop' }, '2026-10-07T04:00:00Z'), // today, seen
    item(2, 'completed', 'me', { chore: 'Dishes' }, '2026-10-06T06:00:00Z'), // yesterday, seen
  ];
  const groups = groupActivity(items, 'Asia/Kathmandu', '2026-10-07', (id) => id === 4);
  expect(groups.map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([['New', [4]], ['Today', [3]], ['Yesterday', [2]]]);
});

test('with nothing unseen there is no New section', () => {
  const groups = groupActivity([item(1, 'joined', 'pri', {}, '2026-10-07T04:00:00Z')], 'Asia/Kathmandu', '2026-10-07', () => false);
  expect(groups.map((g) => g.label)).toEqual(['Today']);
});
