import { ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { addDays, DAY_NAMES, weekdayOf, weekStartOf } from '@domain/time.ts';
import { choreMap, incomingSwaps, namesOf, pendingDraft, planForWeek, weekTotals } from '../../lib/selectors';
import { useAction, useMe } from '../../lib/state';
import { Avatar } from '../../ui/Avatar';
import { Button } from '../../ui/Button';
import { EffortChip } from '../../ui/EffortChip';
import { EmptyState } from '../../ui/EmptyState';
import { useToast } from '../../ui/Toast';
import { SwapSheet } from './SwapSheet';
import '../chores/chores.css';
import './plan.css';

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

function lockCopy(lockAt: string, tz: string) {
  if (new Date(lockAt).getTime() <= Date.now()) return 'Draft · locking now';
  const parts = new Intl.DateTimeFormat('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit', timeZone: tz }).formatToParts(new Date(lockAt));
  const g = (t: string) => parts.find((x) => x.type === t)?.value ?? '';
  const min = g('minute') === '00' ? '' : `:${g('minute')}`;
  return `Draft · locks ${g('weekday')} ${g('hour')}${min} ${g('dayPeriod').toLowerCase()}`;
}

export default function PlanReview() {
  const { me, state } = useMe();
  const navigate = useNavigate();
  const toast = useToast();
  const [swapping, setSwapping] = useState(false);
  const names = namesOf(state);
  const chores = choreMap(state);
  const thisWeek = weekStartOf(state.today);
  const current = planForWeek(state, thisWeek);
  const next = planForWeek(state, addDays(thisWeek, 7));
  // a draft waiting for review comes first; otherwise this week (auto mode, locked plans, swaps)
  const [week, setWeek] = useState(() => (pendingDraft(state) ?? current ?? next)?.week_start);
  const plan = planForWeek(state, week ?? '') ?? pendingDraft(state) ?? current ?? next;

  const approve = useAction<{ p_plan: string; me: string }>('approve_plan', {
    optimistic: (s, { p_plan, me: who }) => ({ ...s, plans: s.plans.map((p) => (p.id === p_plan ? { ...p, approved_by: [...p.approved_by, who] } : p)) }),
    onSuccess: () => toast.show("Thanks — you're in."),
  });
  const respond = useAction<{ p_swap: string; p_accept: boolean }>('respond_swap', {
    optimistic: (s, { p_swap }) => ({ ...s, swaps: s.swaps.filter((w) => w.id !== p_swap) }),
  });
  const answer = (p_swap: string, p_accept: boolean) =>
    respond.mutate({ p_swap, p_accept }, { onSuccess: () => toast.show(p_accept ? "Swapped — it's on your list." : 'Declined. No hard feelings.') });

  if (!plan) {
    return (
      <main className="screen">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
        <EmptyState title="No plan yet." body="Your first plan arrives a few minutes after the home is set up." />
      </main>
    );
  }

  const isDraft = plan.status === 'draft';
  const approved = plan.approved_by.includes(me);
  const waiting = state.members.filter((m) => !plan.approved_by.includes(m.user_id) && m.user_id !== me).length;
  const totals = weekTotals(state, plan.week_start);
  const rows = state.assignments.filter((a) => a.plan_id === plan.id && a.status !== 'expired');
  const people = [...state.members].sort((a, b) => (a.user_id === me ? -1 : b.user_id === me ? 1 : a.name.localeCompare(b.name)));

  return (
    <main className="screen plan">
      <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={20} /></button>
      <p className="eyebrow">{isDraft ? lockCopy(plan.lock_at, state.household?.tz ?? 'UTC') : 'Locked'}</p>
      <h1>{plan.week_start > thisWeek ? 'Next week' : 'This week'}</h1>
      {current && next && (
        <div className="seg seg--tabs" role="tablist" aria-label="Which week">
          {([[current, 'This week'], [next, 'Next week']] as const).map(([p, label]) => (
            <button key={p.id} role="tab" aria-selected={plan.id === p.id} className={`seg__opt${plan.id === p.id ? ' is-on' : ''}`}
              onClick={() => setWeek(p.week_start)}>{label}</button>
          ))}
        </div>
      )}
      <p className="muted">{fmt(plan.week_start)} – {fmt(addDays(plan.week_start, 6))} · balanced by effort, busy days respected</p>

      {incomingSwaps(state, me).map((w) => {
        const theirs = state.assignments.find((a) => a.id === w.from_assignment);
        const mine = state.assignments.find((a) => a.id === w.to_assignment);
        return (
          <section key={w.id} className="swap-card" aria-label="Swap request">
            <p>{names[w.from_user]} wants to trade their {chores.get(theirs?.chore_id ?? '')?.name} for your {chores.get(mine?.chore_id ?? '')?.name}</p>
            <div className="swap-card__actions">
              <Button variant="ghost" disabled={respond.isPending} onClick={() => answer(w.id, false)}>Decline</Button>
              <Button variant="secondary" disabled={respond.isPending} onClick={() => answer(w.id, true)}>Accept</Button>
            </div>
          </section>
        );
      })}

      {people.map((m) => (
        <section key={m.user_id} className="person" aria-label={m.user_id === me ? 'You' : m.name}>
          <header className="person__head">
            <Avatar name={m.name} color={m.color} size={36} />
            <strong>{m.user_id === me ? 'You' : m.name}</strong>
            <span className="person__pts">{totals[m.user_id] ?? 0} pts</span>
            {isDraft && plan.approved_by.includes(m.user_id) && <><Check size={16} aria-hidden className="person__ok" /><span className="sr-only">approved</span></>}
          </header>
          <ul className="person__list">
            {rows.filter((a) => a.user_id === m.user_id).sort((a, b) => a.day.localeCompare(b.day)).map((a) => (
              <li key={a.id}>
                <span className="person__day">{DAY_NAMES[weekdayOf(a.day)].slice(0, 3)}</span>
                <span aria-hidden>{chores.get(a.chore_id)?.icon}</span>
                <span className="person__chore">{chores.get(a.chore_id)?.name}</span>
                <EffortChip effort={a.effort} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="plan__footer">
        {isDraft && approved && <p className="plan__status">You approved{waiting ? ` · waiting for ${waiting} more` : ' · locking soon'}</p>}
        <div className="plan__buttons">
          <Button variant="secondary" onClick={() => setSwapping(true)}>{isDraft ? 'Request a swap' : 'Swap a chore'}</Button>
          {isDraft && !approved && <Button disabled={approve.isPending} loading={approve.isPending} onClick={() => approve.mutate({ p_plan: plan.id, me })}>Looks good</Button>}
        </div>
      </div>
      <SwapSheet open={swapping} planId={plan.id} onClose={() => setSwapping(false)} />
    </main>
  );
}
