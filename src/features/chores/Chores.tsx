import { CalendarDays, Plus } from 'lucide-react';
import { LayoutGroup } from 'motion/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { DAY_NAMES, weekdayOf, weekStartOf } from '@domain/time.ts';
import { choreMap, myTasksOn, namesOf, pendingDraft, pool, weekDates } from '../../lib/selectors';
import { useAction, useMe } from '../../lib/state';
import type { Assignment, Chore } from '../../lib/types';
import { EffortChip } from '../../ui/EffortChip';
import { EmptyState } from '../../ui/EmptyState';
import { Sheet } from '../../ui/Sheet';
import { TaskRow } from '../../ui/TaskRow';
import { Button } from '../../ui/Button';
import { useFirstMount } from '../../ui/motion';
import { AddChoreSheet } from './AddChoreSheet';
import { Celebration } from './Celebration';
import { useChoreActions } from './useChoreActions';
import { WhySheet } from './WhySheet';
import './chores.css';

type Tab = 'today' | 'week' | 'all';
const CADENCE: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks' };

export default function Chores() {
  const { me, state } = useMe();
  const { complete, claim, celebration, closeCelebration } = useChoreActions();
  const [tab, setTab] = useState<Tab>('today');
  const [why, setWhy] = useState<Assignment | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Chore | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false); // removing affects the whole house: two taps
  const closeEditing = () => { setEditing(null); setConfirmRemove(false); };
  const archive = useAction<{ p_id: string }>('archive_chore', {
    optimistic: (s, { p_id }) => ({ ...s, chores: s.chores.filter((c) => c.id !== p_id) }),
  });
  const chores = choreMap(state);
  const names = namesOf(state);
  const draft = pendingDraft(state);
  const stagger = useFirstMount('chores');
  const row = (a: Assignment, opts: { pool?: boolean } = {}, i?: number) => {
    const chore = chores.get(a.chore_id);
    if (!chore) return null;
    const enter = stagger && i !== undefined ? i : undefined;
    if (opts.pool) {
      return (
        <div key={a.id} className="task--pool">
          <TaskRow chore={chore} assignment={a} note={`${DAY_NAMES[weekdayOf(a.day)].slice(0, 3)}`} enter={enter}
            action={<button className="claim-btn" onClick={() => claim(a)} aria-label={`Claim ${chore.name}`}>Claim</button>} />
        </div>
      );
    }
    return <TaskRow key={a.id} chore={chore} assignment={a} onComplete={() => complete(a)} onOpen={() => setWhy(a)} enter={enter}
      note={a.claimed_by === me && a.user_id !== me ? `Covering ${names[a.user_id] ?? ''}`.trim() : undefined} />;
  };

  return (
    <main className="screen chores">
      <h1>To-do</h1>
      <div className="seg seg--tabs" role="tablist" aria-label="Chores view">
        {([['today', 'Today'], ['week', 'This week'], ['all', 'All chores']] as const).map(([value, label]) => (
          <button key={value} role="tab" aria-selected={tab === value} className={`seg__opt${tab === value ? ' is-on' : ''}`} onClick={() => setTab(value)}>{label}</button>
        ))}
      </div>

      {draft && !draft.approved_by.includes(me) && (
        <Link to="/plan" className="banner banner--plan">Next week's plan is ready — review it</Link>
      )}

      <LayoutGroup id="chores">
      {tab === 'today' && (
        <>
          <section className="section" aria-label="My tasks">
            <p className="eyebrow eyebrow--warm">My tasks</p>
            {myTasksOn(state, me, state.today).length === 0
              ? <EmptyState title="Nothing on your list today." body="Enjoy it — or grab one below." />
              : myTasksOn(state, me, state.today).map((a, i) => row(a, {}, i))}
          </section>
          <section className="section" aria-label="Missed by roommates">
            <p className="eyebrow eyebrow--warm">Missed by roommates</p>
            {pool(state, me).length === 0
              ? <p className="muted">Nothing waiting. The house is on it.</p>
              : pool(state, me).map((a, i) => row(a, { pool: true }, myTasksOn(state, me, state.today).length + i))}
          </section>
        </>
      )}

      {tab === 'week' && (
        <Link to="/plan" className="banner banner--plan"><CalendarDays size={18} aria-hidden /> See the whole week — everyone's chores, swaps</Link>
      )}
      {tab === 'week' && weekDates(weekStartOf(state.today)).filter((d) => d >= state.today).map((d) => {
        const list = myTasksOn(state, me, d);
        return (
          <section key={d} className="section" aria-label={DAY_NAMES[weekdayOf(d)]}>
            <h2 className="day-title">{d === state.today ? 'Today' : DAY_NAMES[weekdayOf(d)]}{d !== state.today && <span className="sr-only"> {d}</span>}</h2>
            {list.length === 0 ? <p className="muted">Free day.</p> : list.map((a) => row(a))}
          </section>
        );
      })}

      </LayoutGroup>

      {tab === 'all' && (
        <ul className="chore-list" aria-label="Household chores">
          {state.chores.map((c) => (
            <li key={c.id}>
              <button className="chore-item" onClick={() => setEditing(c)}>
                <span className="task__icon" aria-hidden>{c.icon}</span>
                <span className="chore-item__name">{c.name}<small className="muted">{CADENCE[c.cadence]}</small></span>
                <EffortChip effort={c.effort} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* portaled: the route crossfade transforms the page, which would otherwise re-anchor this fixed button */}
      {createPortal(<button className="fab" onClick={() => setAdding(true)} aria-label="Add chore"><Plus size={26} aria-hidden /></button>, document.body)}
      <AddChoreSheet open={adding} onClose={() => setAdding(false)} />
      <Sheet open={Boolean(editing)} onClose={closeEditing} title={editing?.name ?? ''}>
        {editing && (
          <div className="why">
            <EffortChip effort={editing.effort} size="md" />
            <p className="muted">{CADENCE[editing.cadence]} · shared fairly by effort.</p>
            <Button variant="danger" block disabled={archive.isPending} onClick={() => { if (!confirmRemove) return setConfirmRemove(true); archive.mutate({ p_id: editing.id }); closeEditing(); }}>{confirmRemove ? 'Remove for everyone?' : 'Remove chore'}</Button>
          </div>
        )}
      </Sheet>
      <WhySheet assignment={why} onClose={() => setWhy(null)} />
      <Celebration kind={celebration} onClose={closeCelebration} />
    </main>
  );
}
