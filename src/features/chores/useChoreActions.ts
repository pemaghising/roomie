import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { STATE_KEY, useAction } from '../../lib/state';
import { myTasksOn } from '../../lib/selectors';
import type { AppState, Assignment } from '../../lib/types';
import { useToast } from '../../ui/Toast';

const buzz = () => navigator.vibrate?.(12);

export function useChoreActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const [celebration, setCelebration] = useState<'all_done' | 'covered' | null>(null);

  const undo = useAction<{ p_id: string }>('undo_complete', {
    optimistic: (s, { p_id }) => ({
      ...s,
      assignments: s.assignments.map((a) => (a.id === p_id ? { ...a, status: a.claimed_by ? 'claimed' : 'todo', done_at: null } : a)),
    }),
  });
  const completeAction = useAction<{ p_id: string }>('complete_assignment', {
    optimistic: (s, { p_id }) => ({
      ...s,
      assignments: s.assignments.map((a) => (a.id === p_id ? { ...a, status: 'done', done_at: new Date().toISOString() } : a)),
    }),
    onSuccess: (_d, { p_id }) =>
      toast.show('Done. Nice one.', { action: { label: 'Undo', onClick: () => undo.mutate({ p_id }) }, duration: 5000 }),
  });
  const claimAction = useAction<{ p_id: string; me: string }>('claim_assignment', {
    optimistic: (s, { p_id, me }) => ({
      ...s,
      assignments: s.assignments.map((a) => (a.id === p_id ? { ...a, status: 'claimed', claimed_by: me } : a)),
    }),
    onSuccess: () => toast.show("It's yours — thanks for covering."),
  });

  const complete = (a: Assignment) => {
    buzz();
    const s = qc.getQueryData<AppState>(STATE_KEY);
    if (a.status === 'claimed') setCelebration('covered');
    else if (s) {
      const me = s.profile.id;
      const stillOpen = myTasksOn(s, me, s.today).filter((x) => x.id !== a.id && x.status !== 'done');
      if (a.day === s.today && stillOpen.length === 0) setCelebration('all_done');
    }
    completeAction.mutate({ p_id: a.id });
  };

  const claim = (a: Assignment) => {
    const me = qc.getQueryData<AppState>(STATE_KEY)?.profile.id;
    if (!me) return;
    buzz();
    claimAction.mutate({ p_id: a.id, me });
  };

  return { complete, claim, celebration, closeCelebration: () => setCelebration(null) };
}
