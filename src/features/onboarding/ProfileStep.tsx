import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { errorText } from '@domain/copy.ts';
import { rpc, RpcError, STATE_KEY, useAppState } from '../../lib/state';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { PASTELS } from './draft';
import { Step } from './Step';

export default function ProfileStep() {
  const { data } = useAppState();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState(data?.profile.name ?? '');
  const [color, setColor] = useState(data?.profile.color ?? PASTELS[0]);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await rpc('update_profile', { p_name: name.trim(), p_color: color });
      await qc.invalidateQueries({ queryKey: STATE_KEY }); // the gate moves on to create/join
    } catch (err) {
      toast.show(errorText(err instanceof RpcError ? err.code : 'unknown'));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save}>
      <Step title="What should your roommates call you?" back={false}
        footer={<Button block type="submit" loading={busy} disabled={!name.trim()}>Continue</Button>}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}><Avatar name={name || '?'} color={color} size={88} /></div>
        <label className="field">
          <span className="field__label">Your name</span>
          <span className="field__control"><input autoFocus maxLength={30} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" /></span>
        </label>
        <p className="field__label">Pick your colour</p>
        <div className="swatches" role="radiogroup" aria-label="Your colour">
          {PASTELS.map((c) => (
            <button type="button" key={c} role="radio" aria-checked={c === color} aria-label={`Colour ${c}`}
              className={`swatch${c === color ? ' is-on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
        <p className="muted">Your colour marks your chores, so ownership reads at a glance.</p>
      </Step>
    </form>
  );
}
