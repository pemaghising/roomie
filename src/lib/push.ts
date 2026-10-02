import { rpc } from './state';

export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=').replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

/** Ask permission (only ever from a button tap), subscribe this device, and register it with the server. */
export async function enablePush(): Promise<boolean> {
  const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapid) return false; // not configured in this build: don't prompt for a permission we can't use
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource }));
  const { keys } = sub.toJSON() as { keys: { p256dh: string; auth: string } };
  await rpc('save_push_subscription', { p_endpoint: sub.endpoint, p_p256dh: keys.p256dh, p_auth: keys.auth });
  return true;
}

/** This device's live push subscription, if any. Never waits on `serviceWorker.ready`, which hangs when no worker is registered. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager?.getSubscription()) ?? null;
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  // unsubscribe locally even if the server call fails (e.g. offline sign-out): the device must stop receiving this
  // user's private pushes; the orphaned server row 410s on the next send and is deleted then
  try { await rpc('delete_push_subscription', { p_endpoint: sub.endpoint }); } finally { await sub.unsubscribe(); }
}
