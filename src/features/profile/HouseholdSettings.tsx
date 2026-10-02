import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { m } from 'motion/react';
import { SPRING } from '../../lib/motion';
import { haptic } from '../../lib/haptics';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { errorText } from '@domain/copy.ts';
import { rpc, RpcError, STATE_KEY, useAction, useMe } from '../../lib/state';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import './profile.css';

const MODES = [
  { value: 'review', title: 'Review first', body: "Everyone sees next week's plan on Saturday and can swap before it locks Sunday 6 pm." },
  { value: 'auto', title: 'Apply automatically', body: "The plan locks as soon as it's made. Swaps still work." },
] as const;
const ENDS = ['20:00', '21:00', '22:00', '23:00'];

export default function HouseholdSettings() {
  const { me, state } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const h = state.household!;
  const isOwner = state.members.find((m) => m.user_id === me)?.role === 'owner';
  const [name, setName] = useState(h.name);
  const [confirmRotate, setConfirmRotate] = useState(false);
  // iOS doesn't focus tapped buttons, so blur alone can't disarm: also disarm after 4s
  useEffect(() => { if (!confirmRotate) return; const t = setTimeout(() => setConfirmRotate(false), 4000); return () => clearTimeout(t); }, [confirmRotate]);
  const [rotating, setRotating] = useState(false);
  const update = useAction<{ p_name?: string; p_plan_mode?: 'review' | 'auto'; p_day_ends_at?: string }>('update_household', {
    optimistic: (s, a) => ({
      ...s,
      household: {
        ...s.household!,
        ...(a.p_name ? { name: a.p_name } : {}),
        ...(a.p_plan_mode ? { plan_mode: a.p_plan_mode } : {}),
        ...(a.p_day_ends_at ? { day_ends_at: `${a.p_day_ends_at}:00` } : {}),
      },
    }),
  });
  // Two-tap confirm: the old code stops working, so it can't be a single tap.
  const rotate = async () => {
    if (rotating) return;
    if (!confirmRotate) { setConfirmRotate(true); return; }
    haptic('warning');
    setRotating(true);
    try {
      await rpc('rotate_invite_code');
      await qc.invalidateQueries({ queryKey: STATE_KEY });
      toast.show('New code ready. The old one no longer works.');
    } catch (err) {
      toast.show(errorText(err instanceof RpcError ? err.code : 'unknown'));
    } finally {
      setRotating(false);
      setConfirmRotate(false);
    }
  };

  return (
    <main className="screen profile">
      <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
      <h1>Household</h1>

      <form className="section" onSubmit={(e) => { e.preventDefault(); if (name.trim() && name !== h.name) update.mutate({ p_name: name.trim() }); }}>
        <label className="field"><span className="field__label">Home name</span>
          <span className="field__control"><input maxLength={40} value={name} onChange={(e) => setName(e.target.value)} onBlur={(e) => e.currentTarget.form?.requestSubmit()} /></span></label>
      </form>

      <section className="section" aria-label="Weekly plan">
        <h2>Weekly plan</h2>
        <div role="radiogroup" aria-label="Weekly plan" className="styles">
          {MODES.map((mode) => {
            const on = h.plan_mode === mode.value;
            return (
              <button key={mode.value} type="button" role="radio" aria-checked={on} aria-label={`${mode.title}: ${mode.body}`}
                className={`style-card${on ? ' is-on' : ''}`} onClick={() => { haptic(); update.mutate({ p_plan_mode: mode.value }); }}>
                {on && <m.span layoutId="ring-plan-mode" className="style-card__ring" transition={SPRING.snappy} aria-hidden />}
                <strong>{mode.title}</strong><span className="muted">{mode.body}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section" aria-label="Day ends at">
        <h2>Day ends at</h2>
        <p className="muted">Unfinished chores move to “Missed by roommates” after this time.</p>
        <label className="field"><span className="sr-only">Day ends at</span>
          <span className="field__control">
            <select value={h.day_ends_at.slice(0, 5)} onChange={(e) => update.mutate({ p_day_ends_at: e.target.value })}>
              {ENDS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </span>
        </label>
      </section>

      <section className="section" aria-label="Invite code">
        <h2>Invite code</h2>
        <div className="code-big">{h.invite_code}</div>
        {isOwner && (
          <Button variant={confirmRotate ? 'danger' : 'ghost'} loading={rotating} onClick={rotate} onBlur={() => setConfirmRotate(false)}>
            <RefreshCw size={16} aria-hidden /> {confirmRotate ? 'Sure? The old code stops working' : 'Make a new code'}
          </Button>
        )}
      </section>
    </main>
  );
}
