import { Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { haptic } from '../../lib/haptics';
import { useNavigate } from 'react-router';
import { errorText } from '@domain/copy.ts';
import { DAY_NAMES, type Weekday } from '@domain/time.ts';
import { planNow, rpc, RpcError, STATE_KEY } from '../../lib/state';
import type { AppState } from '../../lib/types';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { clearDraft, useDraft } from './draft';
import { Step } from './Step';

export default function BusyStep() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, update] = useDraft();
  const [busy, setBusy] = useState(false);
  const isJoin = draft.mode === 'join';

  const toggle = (d: Weekday) => {
    haptic();
    update({ busyDays: draft.busyDays.includes(d) ? draft.busyDays.filter((x) => x !== d) : [...draft.busyDays, d].sort() as Weekday[] });
  };

  const finish = async () => {
    setBusy(true);
    try {
      if (isJoin) {
        const h = await rpc<string | null>('join_household', { p_code: draft.code, p_busy: draft.busyDays });
        if (!h) { toast.show(errorText('invalid_code')); navigate('/onboarding/join'); return; }
      } else {
        await rpc('create_household', {
          p_name: draft.homeName.trim(),
          p_busy: draft.busyDays,
          p_chores: draft.chores.filter((c) => c.selected).map(({ name, icon, effort, cadence }) => ({ name, icon, effort, cadence })),
        });
      }
      await planNow().catch(() => {}); // the 10-minute tick catches up if this call fails
      clearDraft();
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      if (isJoin) {
        const name = qc.getQueryData<AppState>(STATE_KEY)?.household?.name;
        toast.show(name ? `Welcome to ${name}!` : 'Welcome home!');
      }
      navigate(isJoin ? '/' : '/onboarding/invite', { replace: true });
    } catch (err) {
      toast.show(errorText(err instanceof RpcError ? err.code : 'unknown'));
    } finally { setBusy(false); }
  };

  return (
    <Step title="Which days are you busiest?" subtitle={<>Help your roommates coordinate chores around your busiest days.<br /><small>We won't give you heavy chores on these days.</small></>}
      step={isJoin ? 2 : 4} total={isJoin ? 2 : 5}
      footer={<Button block loading={busy} onClick={finish}>Continue</Button>}>
      {DAY_NAMES.map((name, i) => {
        const d = i as Weekday;
        const on = draft.busyDays.includes(d);
        return (
          <label key={name} className={`day-pick${on ? ' is-on' : ''}`}>
            <input type="checkbox" checked={on} onChange={() => toggle(d)} aria-label={name} />
            <span>{name}</span>{on && <Check size={18} aria-hidden />}
          </label>
        );
      })}
    </Step>
  );
}
