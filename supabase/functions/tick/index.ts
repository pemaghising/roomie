import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { decideTick, type HouseholdSnapshot } from '../_shared/domain/tick.ts';
import { planNewChore, runActions } from './actions.ts';
import { drainNotifications, type SendPush } from './push.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Configured on first send, so a missing VAPID env never stops plan/sweep calls from booting.
let vapidReady = false;
const send: SendPush = async (sub, message) => {
  if (!vapidReady) {
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
    vapidReady = true;
  }
  try {
    await webpush.sendNotification(sub, message, { TTL: 60 * 60 * 12 });
    return { gone: false };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return { gone: true };
    console.error('push failed', status);
    return { gone: false };
  }
};

async function digest(s: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}
/** Constant-time compare via equal-length SHA-256 digests. */
async function safeEqual(a: string, b: string) {
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const cronSecret = Deno.env.get('CRON_SECRET');
  const provided = req.headers.get('x-cron-secret');
  const isCron = Boolean(cronSecret) && provided !== null && await safeEqual(provided, cronSecret!);
  const body = (await req.json().catch(() => ({}))) as { choreId?: string };

  let only: string | null = null;
  if (!isCron) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: { user } } = await db.auth.getUser(token);
    if (!user) return json({ ok: false, error: 'not_authenticated' }, 401);
    const { data: m } = await db.from('members').select('household_id').eq('user_id', user.id).is('left_at', null).maybeSingle();
    if (!m) return json({ ok: false, error: 'not_member' }, 403);
    only = m.household_id;
  }

  const { data: snaps, error } = await db.rpc('srv_snapshots', { p_household: only });
  if (error) {
    console.error('snapshots failed');
    return json({ ok: false }, 500);
  }
  const now = new Date();
  for (const s of (snaps ?? []) as HouseholdSnapshot[]) {
    try {
      if (body.choreId) await planNewChore(db, s, body.choreId, now);
      await runActions(db, s, decideTick(s, now));
    } catch (e) {
      console.error('household failed', s.id, e); // next tick retries; one household never blocks the rest
    }
  }
  if (isCron) {
    try {
      await drainNotifications(db, send, now);
    } catch {
      console.error('drain failed');
    }
  }
  return json({ ok: true });
});
