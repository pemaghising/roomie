import { Share, X } from 'lucide-react';
import { useState } from 'react';
import { canInstall, promptInstall, pushStatus, type PushStatus } from '../../lib/platform';
import { enablePush } from '../../lib/push';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import './primer.css';

const KEY = 'roomie-primer-snooze';
const snoozed = () => { try { return Number(localStorage.getItem(KEY) ?? 0) > Date.now(); } catch { return false; } };

export function InstallPrimer() {
  const toast = useToast();
  const [status, setStatus] = useState<PushStatus>(pushStatus);
  const [hidden, setHidden] = useState(snoozed);
  const [busy, setBusy] = useState(false);
  const dismiss = () => {
    try { localStorage.setItem(KEY, String(Date.now() + 7 * 86_400_000)); } catch { /* storage unavailable: just hide for now */ }
    setHidden(true);
  };
  if (hidden || status === 'granted' || status === 'denied') return null;

  if (status === 'needs_install') {
    return (
      <aside className="primer" aria-label="Install Roomie">
        <button className="primer__close" onClick={dismiss} aria-label="Not now"><X size={16} /></button>
        <strong>Add Roomie to your Home Screen</strong>
        <p>So the app can do the reminding — iPhone only allows reminders for installed apps.</p>
        <ol>
          <li>Tap <Share size={14} aria-label="Share" /> in Safari</li>
          <li>Choose “Add to Home Screen”</li>
          <li>Open Roomie from your Home Screen</li>
        </ol>
      </aside>
    );
  }

  if (status === 'unsupported') {
    return canInstall() ? (
      <aside className="primer" aria-label="Install Roomie">
        <button className="primer__close" onClick={dismiss} aria-label="Not now"><X size={16} /></button>
        <strong>Install Roomie</strong>
        <p>One tap from your home screen, works offline.</p>
        <Button variant="secondary" onClick={promptInstall}>Install</Button>
      </aside>
    ) : null;
  }

  return (
    <aside className="primer" aria-label="Turn on reminders">
      <button className="primer__close" onClick={dismiss} aria-label="Not now"><X size={16} /></button>
      <strong>Let Roomie do the reminding</strong>
      <p>A gentle nudge when it's your turn, so nobody has to ask. Never more than 3 a day, never at night.</p>
      <Button variant="secondary" loading={busy} disabled={busy} onClick={async () => {
        if (busy) return;
        setBusy(true);
        const ok = await enablePush().catch(() => false);
        setBusy(false);
        setStatus(pushStatus());
        toast.show(ok ? "Reminders on. We'll keep it gentle." : 'Reminders stay off — you can turn them on in Profile.');
      }}>Turn on reminders</Button>
      {canInstall() && <Button variant="ghost" onClick={promptInstall}>Install the app</Button>}
    </aside>
  );
}
