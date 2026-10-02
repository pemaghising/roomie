import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { effortLabel } from '@domain/copy.ts';
import type { Effort } from '@domain/types.ts';
import { Button } from '../../ui/Button';
import { EffortChip } from '../../ui/EffortChip';
import { useDraft } from './draft';
import { Step } from './Step';

const nextEffort = (e: Effort): Effort => (e === 3 ? 1 : ((e + 1) as Effort));

export default function ChoresStep() {
  const navigate = useNavigate();
  const [draft, update] = useDraft();
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState('');
  const chores = draft.chores;
  const patch = (key: string, p: Partial<(typeof chores)[number]>) => update({ chores: chores.map((c) => (c.key === key ? { ...c, ...p } : c)) });
  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    update({ chores: [...chores, { key: `custom-${Date.now()}`, name, icon: '✨', effort: 1, cadence: 'weekly', selected: true }] });
    setCustom(''); setAdding(false);
  };

  return (
    <Step title="Let's set up your chores." subtitle="We've suggested a few basics. Tap to keep or remove; tap the chip to set effort." step={3} total={5}
      footer={<Button block disabled={!chores.some((c) => c.selected)} onClick={() => navigate('/onboarding/busy')}>Continue</Button>}>
      {chores.map((c) => (
        <div key={c.key} className={`pick${c.selected ? ' is-on' : ''}`}>
          <label style={{ display: 'contents' }}>
            <input type="checkbox" checked={c.selected} onChange={() => patch(c.key, { selected: !c.selected })} aria-label={c.name} />
            <span aria-hidden>{c.icon}</span>
            <span className="pick__name">{c.name}</span>
          </label>
          <button type="button" className="effort-tap" onClick={() => patch(c.key, { effort: nextEffort(c.effort) })}
            aria-label={`${c.name} effort: ${effortLabel(c.effort)}`}>
            <EffortChip effort={c.effort} />
          </button>
          <span className="pick__tick" aria-hidden>{c.selected ? '✓' : ''}</span>
        </div>
      ))}
      {adding ? (
        <form onSubmit={(e) => { e.preventDefault(); addCustom(); }} className="field">
          <span className="field__control">
            <input autoFocus aria-label="Chore name" maxLength={40} placeholder="e.g. Water plants" value={custom} onChange={(e) => setCustom(e.target.value)} />
            <Button type="submit" variant="secondary">Add</Button>
          </span>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden /> Add custom chore</Button>
      )}
    </Step>
  );
}
