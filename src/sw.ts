/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { safeTarget } from './lib/safeUrl';
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };
precacheAndRoute(self.__WB_MANIFEST);
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('push', (event) => {
  const data = (() => { try { return event.data?.json() ?? {}; } catch { return {}; } })() as { title?: string; body?: string; url?: string; tag?: string };
  event.waitUntil(self.registration.showNotification(data.title ?? 'Roomie', {
    body: data.body ?? '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: data.tag,
    data: { url: data.url ?? '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = safeTarget((event.notification.data as { url?: string })?.url, self.location.origin); // same-origin only: no open redirect from a push payload
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find((w) => w.url.startsWith(self.location.origin));
    try {
      if (!open) throw new Error('no window');
      await open.focus();
      await (open as WindowClient).navigate(url);
    } catch { await self.clients.openWindow(url).catch(() => null); }
  })());
});
