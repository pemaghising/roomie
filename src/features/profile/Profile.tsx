import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Lock } from 'lucide-react';
import { m } from 'motion/react';
import { SPRING } from '../../lib/motion';
import { haptic } from '../../lib/haptics';
import { useState } from 'react';
import { Link } from 'react-router';
import { balanceSentence, errorText, nudge } from '@domain/copy.ts';
import { DAY_NAMES, type Weekday } from '@domain/time.ts';
import type { NudgeStyle } from '@domain/types.ts';
import { rpc, RpcError, STATE_KEY, useAction, useMe } from '../../lib/state';
import type { Member } from '../../lib/types';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';
import { signOut } from '../auth/AuthProvider';
import { DAY_SHORT, PASTELS } from '../onboarding/draft';
import { NotificationsRow } from '../primer/NotificationsRow';
import './profile.css';

const STYLES: { value: NudgeStyle; title: string; body: string }[] = [
  { value: 'motivate', title: 'Motivate me', body: 'Warm, with streaks and emoji.' },
  { value: 'facts', title: 'Just the facts', body: 'Quiet, text only.' },
];

export default function Profile() {
  const { me, state } = useMe();
  const qc = useQueryClient();
  const toast = useToast();
  const self = state.members.find((m) => m.user_id === me)!;
  const isOwner = self.role === 'owner';
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const [color, setColor] = useState(state.profile.color);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);

  const setNudge = useAction<{ p_nudge: NudgeStyle }>('update_profile', {
    optimistic: (s, { p_nudge }) => ({ ...s, profile: { ...s.profile, nudge_style: p_nudge } }),
  });
  const setBusy = useAction<{ p_days: Weekday[] }>('update_busy_days', {
    optimistic: (s, { p_days }) => ({ ...s, members: s.members.map((m) => (m.user_id === me ? { ...m, busy_days: p_days } : m)) }),
  });
  const remove = useAction<{ p_user: string }>('remove_member', {
    optimistic: (s, { p_user }) => ({ ...s, members: s.members.filter((m) => m.user_id !== p_user) }),
  });
  const saveProfile = useAction<{ p_name: string; p_color: string }>('update_profile', {
    optimistic: (s, { p_name, p_color }) => ({ ...s, profile: { ...s.profile, name: p_name, color: p_color } }),
  });

  const toggleDay = (d: Weekday) => {
    haptic();
    const days = self.busy_days.includes(d) ? self.busy_days.filter((x) => x !== d) : [...self.busy_days, d].sort((a, b) => a - b);
    setBusy.mutate({ p_days: days }, { onSuccess: () => toast.show("Saved — applies from next week's plan.") });
  };
  const leave = async () => {
    if (leaveBusy) return;
    haptic('warning');
    setLeaveBusy(true);
    try {
      await rpc('leave_household');
      setLeaving(false);
      await qc.invalidateQueries({ queryKey: STATE_KEY }); // the gate sends us to create/join
    } catch (err) {
      toast.show(errorText(err instanceof RpcError ? err.code : 'unknown'));
    } finally {
      setLeaveBusy(false);
    }
  };

  return (
    <main className="screen profile">
      <header className="profile__head">
        <Avatar name={state.profile.name} color={state.profile.color} size={72} />
        <div>
          <h1>{state.profile.name}</h1>
          <p className="muted">{state.household!.name}</p>
        </div>
        <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
      </header>

      <section className="card card--private" aria-label="Your balance">
        <p className="eyebrow"><Lock size={12} aria-hidden /> Your balance</p>
        <p className="card__big">{balanceSentence(state.balance)}</p>
        <p className="muted small">Only you can see this. It evens out through the weekly plan.</p>
      </section>

      <section className="section" aria-label="Busy days">
        <h2>Busy days</h2>
        <p className="muted">We won't assign you heavy tasks on these days.</p>
        <div className="days">
          {DAY_SHORT.map((label, i) => {
            const d = i as Weekday;
            const on = self.busy_days.includes(d);
            return (
              <label key={label} className={`day-chip${on ? ' is-on' : ''}`}>
                <input type="checkbox" checked={on} onChange={() => toggleDay(d)} aria-label={DAY_NAMES[i]} />
                {label}
              </label>
            );
          })}
        </div>
      </section>

      <section className="section" aria-label="Nudge style">
        <h2>Nudge style</h2>
        <div role="radiogroup" aria-label="Nudge style" className="styles">
          {STYLES.map((s) => {
            const on = state.profile.nudge_style === s.value;
            return (
              <button key={s.value} type="button" role="radio" aria-checked={on} aria-label={`${s.title}: ${s.body}`}
                className={`style-card${on ? ' is-on' : ''}`} onClick={() => { haptic(); setNudge.mutate({ p_nudge: s.value }); }}>
                {on && <m.span layoutId="ring-nudge" className="style-card__ring" transition={SPRING.snappy} aria-hidden />}
                <strong>{s.title}</strong>
                <span className="muted">{s.body}</span>
                <span className="style-card__preview">“{nudge('pool', s.value, { chore: 'Bathroom' }).body}”</span>
              </button>
            );
          })}
        </div>
      </section>

      <NotificationsRow />

      <section className="section" aria-label="Roommates">
        <h2>Roommates</h2>
        <ul className="mates-list">
          {state.members.map((m) => (
            <li key={m.user_id}>
              <Avatar name={m.name} color={m.color} size={40} />
              <span className="mates-list__name">{m.user_id === me ? `${m.name} (you)` : m.name}{m.role === 'owner' && <small className="muted"> · set up the home</small>}</span>
              {isOwner && m.user_id !== me && (
                <Button variant="ghost" onClick={() => setRemoving(m)} aria-label={`Remove ${m.name}`}>Remove</Button>
              )}
            </li>
          ))}
        </ul>
        {state.members.length < 8 && <Link to="/onboarding/invite" className="btn btn--secondary">Invite roommates</Link>}
      </section>

      <nav className="section links" aria-label="More">
        <Link to="/plan" className="link-row">See the whole week <ChevronRight size={18} aria-hidden /></Link>
        <Link to="/profile/household" className="link-row">Household settings <ChevronRight size={18} aria-hidden /></Link>
        <Link to="/activity" className="link-row">Activity <ChevronRight size={18} aria-hidden /></Link>
      </nav>

      <div className="section">
        <Button variant="ghost" onClick={() => signOut()}>Sign out</Button>
        <Button variant="danger" onClick={() => setLeaving(true)}>Leave household</Button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit profile">
        <form className="add-chore" onSubmit={(e) => { e.preventDefault(); saveProfile.mutate({ p_name: name.trim(), p_color: color }); setEditing(false); }}>
          <label className="field"><span className="field__label">Name</span>
            <span className="field__control"><input maxLength={30} value={name} onChange={(e) => setName(e.target.value)} /></span></label>
          <div className="swatches" role="radiogroup" aria-label="Your colour">
            {PASTELS.map((c) => (
              <button type="button" key={c} role="radio" aria-checked={c === color} aria-label={`Colour ${c}`}
                className={`swatch${c === color ? ' is-on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
          <Button block type="submit" disabled={!name.trim()}>Save</Button>
        </form>
      </Sheet>

      <Sheet open={Boolean(removing)} onClose={() => setRemoving(null)} title={`Remove ${removing?.name}?`}>
        <p className="muted">Their upcoming chores go to “Missed by roommates” so anyone can claim them.</p>
        <div className="sheet-actions">
          <Button variant="ghost" onClick={() => setRemoving(null)}>Cancel</Button>
          <Button variant="danger" disabled={remove.isPending} onClick={() => { haptic('warning'); remove.mutate({ p_user: removing!.user_id }); setRemoving(null); }}>Remove</Button>
        </div>
      </Sheet>

      <Sheet open={leaving} onClose={() => setLeaving(false)} title={`Leave ${state.household!.name}?`}>
        <p className="muted">Your upcoming chores go to the claim pool. You can rejoin later with the code.</p>
        <div className="sheet-actions">
          <Button variant="ghost" onClick={() => setLeaving(false)}>Stay</Button>
          <Button variant="danger" loading={leaveBusy} onClick={leave}>Leave</Button>
        </div>
      </Sheet>
    </main>
  );
}
