import { expect, test, vi } from 'vitest';
import { drainNotifications, isAllowedPushEndpoint, type PushSub } from './push.ts';
import type { RpcClient } from './actions.ts';

const sub = (n: number): PushSub => ({ endpoint: `https://fcm.googleapis.com/fcm/send/${n}`, keys: { p256dh: 'k', auth: 'a' } });
const note = (id: number, over: Record<string, unknown> = {}) => ({
  id, userId: 'u1', kind: 'pool', payload: { chore: 'Bathroom' }, style: 'motivate', tz: 'Asia/Kathmandu', sentToday: 0, subscriptions: [sub(1)], ...over,
});
function db(pending: unknown[]) {
  const calls: { fn: string; args?: Record<string, unknown> }[] = [];
  const client: RpcClient = {
    rpc: vi.fn(async (fn: string, args?: Record<string, unknown>) => {
      calls.push({ fn, args });
      return { data: fn === 'srv_pending_notifications' ? pending : null, error: null };
    }),
  };
  return { client, calls };
}
const NOON = new Date('2026-10-01T06:15:00Z'); // 12:00 Kathmandu
const LATE = new Date('2026-10-01T17:15:00Z'); // 23:00 Kathmandu

test('sends in the user’s tone with a deep link, then marks sent', async () => {
  const { client, calls } = db([note(1)]);
  const send = vi.fn(async (_s: PushSub, _m: string) => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(JSON.parse(send.mock.calls[0][1])).toEqual({ title: 'Up for grabs 🙌', body: 'Up for grabs: Bathroom. Be a hero?', url: '/chores', tag: 'pool-1' });
  expect(calls.at(-1)).toEqual({ fn: 'srv_mark_notification', args: { p_id: 1, p_skipped: false } });
});

test('quiet hours leave the notification queued', async () => {
  const { client, calls } = db([note(1)]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, LATE);
  expect(send).not.toHaveBeenCalled();
  expect(calls.some((c) => c.fn === 'srv_mark_notification')).toBe(false);
});

test('the daily cap counts pushes sent within the same batch', async () => {
  // digests rather than pool: pool is exempt from the cap (see the next test)
  const digest = { kind: 'digest', payload: { chores: ['Bins'] } };
  const { client, calls } = db([note(1, { sentToday: 2, ...digest }), note(2, { sentToday: 2, ...digest }), note(3, { sentToday: 2, kind: 'covered', payload: { actor: 'A', chore: 'X', effort: 1 } })]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send).toHaveBeenCalledTimes(2); // #1 and the 'covered' one
  expect(calls).toContainEqual({ fn: 'srv_mark_notification', args: { p_id: 2, p_skipped: true } });
});

test('a pool push neither uses up nor is blocked by the daily cap, so the morning digest still goes out', async () => {
  const digest = { kind: 'digest', payload: { chores: ['Bins'] } };
  const { client, calls } = db([note(1, { sentToday: 2, payload: { chores: ['Mop', 'Bins'] } }), note(2, { sentToday: 2, ...digest }), note(3, { sentToday: 3 })]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send).toHaveBeenCalledTimes(3);
  expect(calls.filter((c) => c.fn === 'srv_mark_notification').every((c) => c.args!.p_skipped === false)).toBe(true);
});

test('expired subscriptions are deleted', async () => {
  const { client, calls } = db([note(1, { subscriptions: [sub(1), sub(2)] })]);
  const send = vi.fn(async (s: PushSub) => ({ gone: s.endpoint.endsWith('/2') }));
  await drainNotifications(client, send, NOON);
  expect(calls).toContainEqual({ fn: 'srv_delete_subscription', args: { p_endpoint: sub(2).endpoint } });
});

test('an empty digest is skipped, never sent', async () => {
  const { client, calls } = db([note(1, { kind: 'digest', payload: { chores: [] } })]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send).not.toHaveBeenCalled();
  expect(calls).toContainEqual({ fn: 'srv_mark_notification', args: { p_id: 1, p_skipped: true } });
});

test('endpoint allow-list only admits real push services', () => {
  for (const ok of ['https://fcm.googleapis.com/fcm/send/abc', 'https://web.push.apple.com/x', 'https://updates.push.services.mozilla.com/x', 'https://db5.notify.windows.com/x']) {
    expect(isAllowedPushEndpoint(ok)).toBe(true);
  }
  for (const bad of ['https://169.254.169.254/x', 'https://localhost/x', 'https://evil.example/x', 'http://fcm.googleapis.com/x', 'https://fcm.googleapis.com.evil.example/x', 'https://fcm.googleapis.com:8443/x', 'not a url']) {
    expect(isAllowedPushEndpoint(bad)).toBe(false);
  }
});

test('a subscription on a disallowed host is deleted, never POSTed, and the notification skipped', async () => {
  const evil: PushSub = { endpoint: 'https://169.254.169.254/x', keys: { p256dh: 'k', auth: 'a' } };
  const { client, calls } = db([note(1, { subscriptions: [evil] })]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send).not.toHaveBeenCalled();
  expect(calls).toContainEqual({ fn: 'srv_delete_subscription', args: { p_endpoint: evil.endpoint } });
  expect(calls).toContainEqual({ fn: 'srv_mark_notification', args: { p_id: 1, p_skipped: true } });
});

test('restock requests waiting in one drain become one push per person, and every row is marked', async () => {
  const r = (id: number, userId: string, item: string) => note(id, { userId, kind: 'restock', payload: { actor: 'Priya', item } });
  const { client, calls } = db([r(1, 'u1', 'Milk'), r(2, 'u1', 'Rice'), r(3, 'u2', 'Milk')]);
  const send = vi.fn(async (_s: PushSub, _m: string) => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send).toHaveBeenCalledTimes(2);
  expect(JSON.parse(send.mock.calls[0][1])).toEqual({ title: 'Shopping run? 🛒', body: 'The house needs Milk and Rice. Grab one?', url: '/chores', tag: 'restock-1' });
  expect(JSON.parse(send.mock.calls[1][1]).body).toBe('Priya asked for Milk. Passing a shop?');
  expect(calls.filter((c) => c.fn === 'srv_mark_notification').map((c) => c.args))
    .toEqual([{ p_id: 1, p_skipped: false }, { p_id: 2, p_skipped: false }, { p_id: 3, p_skipped: false }]);
});

test('a lone restock request keeps the requester’s name through the batching', async () => {
  const { client } = db([note(1, { kind: 'restock', payload: { actor: 'Aarav', item: 'Eggs' } })]);
  const send = vi.fn(async (_s: PushSub, _m: string) => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(JSON.parse(send.mock.calls[0][1]).body).toBe('Aarav asked for Eggs. Passing a shop?');
});

test('restock neither uses up nor is blocked by the daily cap', async () => {
  const digest = { kind: 'digest', payload: { chores: ['Bins'] } };
  const { client } = db([note(1, { sentToday: 3, kind: 'restock', payload: { actor: 'P', item: 'Milk' } }), note(2, { sentToday: 2, ...digest })]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send).toHaveBeenCalledTimes(2);
});

test('quiet hours leave batched restock rows queued', async () => {
  const { client, calls } = db([note(1, { kind: 'restock', payload: { actor: 'P', item: 'Milk' } }), note(2, { kind: 'restock', payload: { actor: 'P', item: 'Rice' } })]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, LATE);
  expect(send).not.toHaveBeenCalled();
  expect(calls.some((c) => c.fn === 'srv_mark_notification')).toBe(false);
});

test('a digest carrying only stale requests is sent', async () => {
  const { client } = db([note(1, { kind: 'digest', payload: { chores: [], stale: ['Paper towels'] } })]);
  const send = vi.fn(async (_s: PushSub, _m: string) => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(JSON.parse(send.mock.calls[0][1]).body).toBe('Still needed: Paper towels.');
});

test('a digest with no chores and an empty stale list is skipped, never sent', async () => {
  const { client, calls } = db([note(1, { kind: 'digest', payload: { chores: [], stale: [] } })]);
  const send = vi.fn(async () => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send).not.toHaveBeenCalled();
  expect(calls).toContainEqual({ fn: 'srv_mark_notification', args: { p_id: 1, p_skipped: true } });
});

test('pantry pushes deep-link to the right place', async () => {
  const { client } = db([
    note(1, { kind: 'ask', payload: { actor: 'Aarav', item: 'Oat milk' } }),
    note(2, { kind: 'ask_answer', payload: { actor: 'Priya', item: 'Oat milk', accepted: true } }),
    note(3, { kind: 'restock_done', payload: { actor: 'Aarav', item: 'Milk' } }),
    note(4, { userId: 'u2', kind: 'restock_closed', payload: { item: 'Tea' } }), // another person: u1 is at the cap by now
  ]);
  const send = vi.fn(async (_s: PushSub, _m: string) => ({ gone: false }));
  await drainNotifications(client, send, NOON);
  expect(send.mock.calls.map((c) => JSON.parse(c[1]).url)).toEqual(['/pantry?tab=mine', '/pantry?tab=roommates', '/pantry', '/chores']);
});

test('an unknown kind is marked skipped and the rest of the drain still goes out', async () => {
  const { client, calls } = db([note(1, { kind: 'mystery' }), note(2)]);
  const send = vi.fn(async (_s: PushSub, _m: string) => ({ gone: false }));
  const err = vi.spyOn(console, 'error').mockImplementation(() => {});
  await drainNotifications(client, send, NOON);
  err.mockRestore();
  expect(send).toHaveBeenCalledTimes(1);
  expect(JSON.parse(send.mock.calls[0][1]).tag).toBe('pool-2');
  expect(calls).toContainEqual({ fn: 'srv_mark_notification', args: { p_id: 1, p_skipped: true } });
  expect(calls).toContainEqual({ fn: 'srv_mark_notification', args: { p_id: 2, p_skipped: false } });
});
