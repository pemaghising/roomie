import { useQueryClient } from '@tanstack/react-query';
import { m } from 'motion/react';
import { SPRING } from '../../lib/motion';
import { type FormEvent, useState } from 'react';
import { errorText } from '@domain/copy.ts';
import type { Cadence, Effort } from '@domain/types.ts';
import { planNow, rpc, RpcError, STATE_KEY } from '../../lib/state';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';

const ICONS = ['🧽', '🧹', '🪣', '🧺', '🗑️', '♻️', '🍽️', '🫙', '🚿', '🪴'];
const EFFORTS: { value: Effort; label: string }[] = [{ value: 1, label: 'Light' }, { value: 2, label: 'Medium' }, { value: 3, label: 'Heavy' }];
const CADENCES: { value: Cadence; label: string }[] = [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Bi-weekly' }];

export function AddChoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [effort, setEffort] = useState<Effort | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [cadence, setCadence] = useState<Cadence>('weekly');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !effort || !name.trim()) return;
    setBusy(true);
    try {
      const id = await rpc<string>('add_chore', { p_name: name.trim(), p_icon: icon, p_effort: effort, p_cadence: cadence });
      await planNow(id).catch(() => {});
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show('Added to the rotation.');
      setName(''); setEffort(null); onClose();
    } catch (err) {
      toast.show(errorText(err instanceof RpcError ? err.code : 'unknown'));
    } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add new chore">
      <form className="add-chore" onSubmit={submit}>
        <p className="eyebrow">Effort level</p>
        <div className="seg seg--effort" role="radiogroup" aria-label="Effort level">
          {EFFORTS.map((x) => (
            <button key={x.value} type="button" role="radio" aria-checked={effort === x.value}
              className={`chip chip--md chip--${x.label.toLowerCase()}${effort === x.value ? ' is-on' : ''}`} onClick={() => setEffort(x.value)}>
              {x.label}
            </button>
          ))}
        </div>
        <label className="field">
          <span className="field__label">Chore name</span>
          <span className="field__control"><input maxLength={40} placeholder="e.g., Vacuum rugs" value={name} onChange={(e) => setName(e.target.value)} aria-label="Chore name" /></span>
        </label>
        <p className="eyebrow">Choose icon</p>
        <div className="icons" role="radiogroup" aria-label="Icon">
          {ICONS.map((i) => (
            <button key={i} type="button" role="radio" aria-checked={icon === i} aria-label={`Icon ${i}`} className={`icon-pick${icon === i ? ' is-on' : ''}`} onClick={() => setIcon(i)}>{i}</button>
          ))}
        </div>
        <p className="eyebrow">Rotation</p>
        <div className="seg" role="radiogroup" aria-label="How often">
          {CADENCES.map((c) => (
            <button key={c.value} type="button" role="radio" aria-checked={cadence === c.value} className={`seg__opt${cadence === c.value ? ' is-on' : ''}`} onClick={() => setCadence(c.value)}>{cadence === c.value && <m.span layoutId="seg-cadence" className="seg__pill" transition={SPRING.snappy} aria-hidden />}{c.label}</button>
          ))}
        </div>
        <p className="muted add-chore__note">Roomie assigns it fairly — heavy chores never land on someone's busy day.</p>
        <Button block type="submit" loading={busy} disabled={!effort || !name.trim()}>Add to rotation</Button>
      </form>
    </Sheet>
  );
}
