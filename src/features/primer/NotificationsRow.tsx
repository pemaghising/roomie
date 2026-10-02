import { useState } from 'react';
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
  const [status, setStatus] = useState<PushStatus>(pushStatus);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, fail: string) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch { toast.show(fail); }
    setBusy(false);
    setStatus(pushStatus());
  };
  return (
    <section className="section" aria-label="Reminders">
      <h2>Reminders</h2>
      <p className="muted">{COPY[status]}</p>
      {status === 'default' && <Button variant="secondary" loading={busy} disabled={busy} onClick={() => run(enablePush, "Couldn't turn reminders on. Try again in a moment.")}>Turn on</Button>}
      {status === 'granted' && <Button variant="ghost" loading={busy} disabled={busy} onClick={() => run(disablePush, "Couldn't turn reminders off. Try again in a moment.")}>Turn off on this device</Button>}
    </section>
  );
}
