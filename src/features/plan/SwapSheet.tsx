import { useState } from 'react';
import { swapDelta } from '@domain/ledger.ts';
import { DAY_NAMES, weekdayOf } from '@domain/time.ts';
import { choreMap, namesOf } from '../../lib/selectors';
import { useAction, useMe } from '../../lib/state';
import type { Assignment } from '../../lib/types';
import { Button } from '../../ui/Button';
import { EffortChip } from '../../ui/EffortChip';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';

const short = (day: string) => DAY_NAMES[weekdayOf(day)].slice(0, 3);

export function SwapSheet({ open, planId, onClose }: { open: boolean; planId: string; onClose: () => void }) {
  const { me, state } = useMe();
  const toast = useToast();
  const chores = choreMap(state);
  const names = namesOf(state);
  const [give, setGive] = useState<Assignment | null>(null);
  const [take, setTake] = useState<Assignment | null>(null);
  const close = () => { setGive(null); setTake(null); onClose(); };
  const request = useAction<{ p_from: string; p_to: string }>('request_swap', {
    onSuccess: () => { toast.show('Swap request sent.'); close(); },
  });
  const open_ = (a: Assignment) => a.plan_id === planId && a.status === 'todo' && a.day >= state.today;
  const mine = state.assignments.filter((a) => open_(a) && a.user_id === me);
  const theirs = state.assignments.filter((a) => open_(a) && a.user_id !== me);
  const delta = give && take ? swapDelta(give.effort, take.effort) : null;
  const pts = (n: number) => `${n} more point${n === 1 ? '' : 's'}`;

  const option = (a: Assignment, selected: boolean, onPick: () => void, withName: boolean) => {
    const chore = chores.get(a.chore_id);
    const label = `${chore?.name} · ${short(a.day)}${withName ? ` · ${names[a.user_id]}` : ''}`;
    return (
      <button key={a.id} type="button" role="radio" aria-checked={selected} aria-label={label}
        className={`swap-opt${selected ? ' is-on' : ''}`} onClick={onPick}>
        <span aria-hidden>{chore?.icon}</span>
        <span className="swap-opt__name">{chore?.name}<small className="muted">{short(a.day)}{withName ? ` · ${names[a.user_id]}` : ''}</small></span>
        <EffortChip effort={a.effort} />
      </button>
    );
  };

  return (
    <Sheet open={open} onClose={close} title="Swap a chore">
      <div className="swap">
        <p className="eyebrow">1 · One of yours</p>
        <div role="radiogroup" aria-label="Your chore" className="swap__list">
          {mine.length === 0 ? <p className="muted">You have no upcoming chores to trade.</p> : mine.map((a) => option(a, give?.id === a.id, () => setGive(a), false))}
        </div>
        {give && (
          <>
            <p className="eyebrow">2 · Trade it for</p>
            <div role="radiogroup" aria-label="Their chore" className="swap__list">
              {theirs.map((a) => option(a, take?.id === a.id, () => setTake(a), true))}
            </div>
          </>
        )}
        {delta !== null && (
          <p className="swap__delta">
            {delta > 0 ? `You'd take on ${pts(delta)} — your balance gets the credit.`
              : delta < 0 ? `You'd hand off ${Math.abs(delta)} point${delta === -1 ? '' : 's'} — it evens out next week.`
              : 'An even trade.'}
          </p>
        )}
        <Button block disabled={!give || !take || request.isPending} loading={request.isPending}
          onClick={() => give && take && !request.isPending && request.mutate({ p_from: give.id, p_to: take.id })}>Send request</Button>
      </div>
    </Sheet>
  );
}
