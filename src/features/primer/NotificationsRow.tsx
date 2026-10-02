import { useEffect, useState } from 'react';
import { pushStatus, type PushStatus } from '../../lib/platform';
import { disablePush, enablePush } from '../../lib/push';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';

const COPY: Record<PushStatus, string> = {
  granted: 'On for this device.',
  default: 'Off for this device.',
  denied: 'Blocked in your browser settings. Allow notifications for Roomie there to turn them on.',
  needs_install: 'On iPhone, add Roomie to your Home Screen first.',
  unsupported: "This browser can't show reminders — everything still appears in Activity.",
};

export function NotificationsRow() {
  const toast = useToast();
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { pushStatus().then(setStatus); }, []);
  const run = async (fn: () => Promise<PushStatus | void>, fail: string) => {
    if (busy) return;
    setBusy(true);
    try { const next = await fn(); setStatus(next ?? await pushStatus()); } catch { toast.show(fail); setStatus(await pushStatus()); }
    setBusy(false);
  };
  const turnOn = async () => {
    if (!(await enablePush())) toast.show('Reminders stay off — you can turn them on in Profile.');
  };
  const turnOff = async () => { await disablePush(); return 'default' as const; }; // permission stays 'granted' after unsubscribing
  return (
    <section className="section" aria-label="Reminders">
      <h2>Reminders</h2>
      <p className="muted">{status ? COPY[status] : ' '}</p>
      {status === 'default' && <Button variant="secondary" loading={busy} disabled={busy} onClick={() => run(turnOn, "Couldn't turn reminders on. Try again in a moment.")}>Turn on</Button>}
      {status === 'granted' && <Button variant="ghost" loading={busy} disabled={busy} onClick={() => run(turnOff, "Couldn't turn reminders off. Try again in a moment.")}>Turn off on this device</Button>}
    </section>
  );
}
