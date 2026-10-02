interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  Boolean(window.matchMedia?.('(display-mode: standalone)').matches) || (navigator as { standalone?: boolean }).standalone === true;

export type PushStatus = 'unsupported' | 'needs_install' | 'default' | 'granted' | 'denied';

export function pushStatus(): PushStatus {
  if (isIOS() && !isStandalone()) return 'needs_install'; // iOS only delivers web push to Home Screen apps
  if (!('serviceWorker' in navigator) || typeof window.PushManager === 'undefined' || typeof window.Notification === 'undefined') return 'unsupported';
  return Notification.permission as PushStatus;
}

let deferred: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BeforeInstallPromptEvent; });
}
export const canInstall = () => deferred !== null && !isStandalone();
export async function promptInstall() {
  if (!deferred) return;
  await deferred.prompt();
  deferred = null;
}
