// Mirrors web src/features/chores/useChoreActions.ts.
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Share } from 'react-native';
import { useState } from 'react';
import { useToast } from '@/ui/toast';
import { myTasksOn } from './selectors';
import { STATE_KEY, useAction } from './state';
import type { AppState, Assignment } from './types';

export type CelebrationInfo = { kind: 'all_done' | 'covered'; streak: number; doneToday: number };
export type Celebration = CelebrationInfo | null;

export function useChoreActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const [celebration, setCelebration] = useState<Celebration>(null);

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
  });
  const unclaimAction = useAction<{ p_id: string }>('unclaim_assignment', {
    optimistic: (s, { p_id }) => ({
      ...s,
      assignments: s.assignments.map((a) => (a.id === p_id ? { ...a, status: 'missed', claimed_by: null } : a)),
    }),
  });
  const claimAction = useAction<{ p_id: string; me: string; name: string }>('claim_assignment', {
    optimistic: (s, { p_id, me }) => ({
      ...s,
      assignments: s.assignments.map((a) => (a.id === p_id ? { ...a, status: 'claimed', claimed_by: me } : a)),
    }),
    // frame H3: helping is never invisible, and it is reversible
    onSuccess: (_, { p_id, name }) => toast.show(`${name} is yours. You’ll get a lighter week.`, { tick: true, action: { label: 'Undo', onPress: () => unclaimAction.mutate({ p_id }) } }),
  });

  const complete = (a: Assignment) => {
    if (a.status === 'done') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const s = qc.getQueryData<AppState>(STATE_KEY);
    const me = s?.profile.id;
    let kind: CelebrationInfo['kind'] | null = null;
    if (a.status === 'claimed' && a.claimed_by === me) kind = 'covered';
    else if (s && me) {
      const stillOpen = myTasksOn(s, me, s.today).filter((x) => x.id !== a.id && x.status !== 'done');
      if (a.day === s.today && stillOpen.length === 0) kind = 'all_done';
    }
    const streak = s?.streak?.current ?? 0;
    const doneToday = s && me ? myTasksOn(s, me, s.today).filter((x) => x.status === 'done').length + 1 : 1;
    // celebrate only once the server accepted it; a failure rolls back with a toast instead
    completeAction.mutate({ p_id: a.id }, {
      onSuccess: () => {
        if (kind) setCelebration({ kind, streak, doneToday });
        else toast.show(`${s?.chores.find((c) => c.id === a.chore_id)?.name ?? 'That chore'} is done.`, { tick: true, action: { label: 'Undo', onPress: () => undo.mutate({ p_id: a.id }) } });
      },
    });
  };

  /** Tapping a done task un-ticks it (the server refuses once the undo window has passed). */
  const toggle = (a: Assignment) => {
    if (a.status !== 'done') return complete(a);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    undo.mutate({ p_id: a.id });
  };

  const claim = (a: Assignment) => {
    const s = qc.getQueryData<AppState>(STATE_KEY);
    const me = s?.profile.id;
    if (!me) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    claimAction.mutate({ p_id: a.id, me, name: s?.chores.find((c) => c.id === a.chore_id)?.name ?? 'That chore' });
  };

  return { toggle, claim, celebration, closeCelebration: () => setCelebration(null) };
}

/** "A3F‑92K", with a non-breaking hyphen so it never splits across lines (frame 12). */
export const formatCode = (code: string) => `${code.slice(0, 3)}‑${code.slice(3)}`;

/** Same /j/<code> link the web app already resolves; opens the join flow. */
export const inviteLink = (code: string) => `https://roomie-theta.vercel.app/j/${code}`;

export const shareInvite = (code: string, home: string) =>
  Share.share({ message: `Join ${home} on Roomie. Tap ${inviteLink(code)} or enter our household code: ${formatCode(code)}` });
