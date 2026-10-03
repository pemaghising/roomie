import { nudge, type NudgeKind, type NudgePayload } from '../_shared/domain/nudge.ts';
import { localParts } from '../_shared/domain/time.ts';
import { pushDecision } from '../_shared/domain/tick.ts';
import type { NudgeStyle } from '../_shared/domain/types.ts';
import { call, type RpcClient } from './actions.ts';

export interface PushSub { endpoint: string; keys: { p256dh: string; auth: string } }
export type SendPush = (sub: PushSub, message: string) => Promise<{ gone: boolean }>;

interface PendingNotification {
  id: number; userId: string; kind: NudgeKind; payload: NudgePayload; style: NudgeStyle; tz: string;
  sentToday: number; subscriptions: PushSub[];
  /** ids of further restock rows folded into this one push */
  merged?: number[];
}

const DEEP_LINK: Record<NudgeKind, string> = {
  digest: '/chores', pool: '/chores', plan_ready: '/plan', plan_locked: '/plan', covered: '/profile',
  day_kept: '/', swap_request: '/plan', swap_answer: '/plan', joined: '/',
  // an ask goes to the owner (their shelf); the answer goes to the asker (the roommate's shelf)
  restock: '/chores', restock_done: '/pantry', restock_closed: '/chores', ask: '/pantry?tab=mine', ask_answer: '/pantry?tab=roommates',
};

/** Pool and restock pushes are batched per person, so they neither use up nor respect the daily cap. */
const uncounted = (kind: NudgeKind) => kind === 'pool' || kind === 'restock';

/** SSRF guard: subscriptions are user-supplied URLs, so only ever POST to the real push services. */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let u: URL;
  try { u = new URL(endpoint); } catch { return false; }
  if (u.protocol !== 'https:' || u.port) return false;
  const h = u.hostname.toLowerCase();
  return h === 'fcm.googleapis.com' || h === 'web.push.apple.com' ||
    h.endsWith('.push.services.mozilla.com') || h.endsWith('.notify.windows.com');
}

/**
 * A restock request is queued as one row per member; each person gets one push listing every item waiting in this drain.
 * The first row's payload (including the requester `actor`, which the single-item copy names) is kept; later items are appended.
 */
function batchRestocks(pending: PendingNotification[]): PendingNotification[] {
  const heads = new Map<string, PendingNotification>();
  const out: PendingNotification[] = [];
  for (const n of pending) {
    if (n.kind !== 'restock') { out.push(n); continue; }
    const head = heads.get(n.userId);
    if (head) {
      head.payload.items!.push(n.payload.item ?? '');
      head.merged!.push(n.id);
      continue;
    }
    const first = { ...n, payload: { ...n.payload, items: [n.payload.item ?? ''] }, merged: [] };
    heads.set(n.userId, first);
    out.push(first);
  }
  return out;
}

export async function drainNotifications(db: RpcClient, send: SendPush, now = new Date()) {
  const pending = await call<PendingNotification[]>(db, 'srv_pending_notifications');
  const sent = new Map<string, number>();
  const mark = async (n: PendingNotification, skipped: boolean) => {
    for (const id of [n.id, ...(n.merged ?? [])]) await call(db, 'srv_mark_notification', { p_id: id, p_skipped: skipped });
  };
  for (const n of batchRestocks(pending ?? [])) {
    // Never push an empty digest (no chores today and nothing still needed).
    if (n.kind === 'digest' && !(n.payload.chores?.length) && !(n.payload.stale?.length)) {
      await mark(n, true);
      continue;
    }
    const sentToday = sent.get(n.userId) ?? n.sentToday;
    const decision = pushDecision(localParts(now, n.tz).hour, sentToday, n.kind);
    if (decision === 'defer') continue;
    if (decision === 'skip') {
      await mark(n, true);
      continue;
    }
    let title: string, body: string;
    try {
      ({ title, body } = nudge(n.kind, n.style, n.payload));
    } catch {
      // an unknown kind or malformed payload is skipped so it never stalls every later notification
      console.error('unpushable notification', n.id);
      await mark(n, true);
      continue;
    }
    const message = JSON.stringify({ title, body, url: DEEP_LINK[n.kind] ?? '/', tag: `${n.kind}-${n.id}` });
    let delivered = 0;
    for (const sub of n.subscriptions) {
      if (!isAllowedPushEndpoint(sub.endpoint)) {
        await call(db, 'srv_delete_subscription', { p_endpoint: sub.endpoint }); // treated as gone, never contacted
        continue;
      }
      const { gone } = await send(sub, message);
      if (gone) await call(db, 'srv_delete_subscription', { p_endpoint: sub.endpoint });
      else delivered++;
    }
    // Only skipped when every subscription was rejected by the allow-list (nothing user-visible happened).
    const blocked = n.subscriptions.length > 0 && n.subscriptions.every((s) => !isAllowedPushEndpoint(s.endpoint));
    await mark(n, blocked);
    if (delivered > 0 && !uncounted(n.kind)) sent.set(n.userId, sentToday + 1);
  }
}
