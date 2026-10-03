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
}

const DEEP_LINK: Record<NudgeKind, string> = {
  digest: '/chores', pool: '/chores', plan_ready: '/plan', plan_locked: '/plan', covered: '/profile',
  day_kept: '/', swap_request: '/plan', swap_answer: '/plan', joined: '/',
  // an ask goes to the owner (their shelf); the answer goes to the asker (the roommate's shelf)
  restock: '/chores', restock_done: '/pantry', restock_closed: '/chores', ask: '/pantry?tab=mine', ask_answer: '/pantry?tab=roommates',
};

/** SSRF guard: subscriptions are user-supplied URLs, so only ever POST to the real push services. */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let u: URL;
  try { u = new URL(endpoint); } catch { return false; }
  if (u.protocol !== 'https:' || u.port) return false;
  const h = u.hostname.toLowerCase();
  return h === 'fcm.googleapis.com' || h === 'web.push.apple.com' ||
    h.endsWith('.push.services.mozilla.com') || h.endsWith('.notify.windows.com');
}

export async function drainNotifications(db: RpcClient, send: SendPush, now = new Date()) {
  const pending = await call<PendingNotification[]>(db, 'srv_pending_notifications');
  const sent = new Map<string, number>();
  for (const n of pending ?? []) {
    // Never push an empty digest.
    if (n.kind === 'digest' && !(n.payload.chores?.length)) {
      await call(db, 'srv_mark_notification', { p_id: n.id, p_skipped: true });
      continue;
    }
    const sentToday = sent.get(n.userId) ?? n.sentToday;
    const decision = pushDecision(localParts(now, n.tz).hour, sentToday, n.kind);
    if (decision === 'defer') continue;
    if (decision === 'skip') {
      await call(db, 'srv_mark_notification', { p_id: n.id, p_skipped: true });
      continue;
    }
    const { title, body } = nudge(n.kind, n.style, n.payload);
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
    await call(db, 'srv_mark_notification', { p_id: n.id, p_skipped: blocked });
    if (delivered > 0 && n.kind !== 'pool') sent.set(n.userId, sentToday + 1); // pool doesn't use up the cap
  }
}
