import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ERROR_CODES, errorText } from '@domain/copy.ts';
import { supabase } from './supabase';
import type { AppState } from './types';
import { useToast } from '../ui/Toast';
import { useAuth } from '../features/auth/AuthProvider';
import { queryClient } from './queryClient';

export const STATE_KEY = ['app-state'] as const;

const localToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kathmandu' }).format(new Date());

export async function fetchState(): Promise<AppState> {
  const { data, error } = await supabase.rpc('get_state');
  if (error) throw error;
  return { members: [], chores: [], plans: [], assignments: [], swaps: [], streak: null, balance: 0, activity: [], today: localToday(), ...data } as AppState;
}

export function useAppState() {
  const { session } = useAuth();
  return useQuery({ queryKey: STATE_KEY, queryFn: fetchState, enabled: Boolean(session), staleTime: 15_000 });
}

/** For screens behind the 'ready' gate: state and household are guaranteed. */
export function useMe(): { me: string; state: AppState } {
  const { data } = useAppState();
  if (!data?.household) throw new Error('useMe used outside a ready household');
  return { me: data.profile.id, state: data };
}

export class RpcError extends Error {
  constructor(public code: string) { super(code); }
}

export const codeOf = (message: string) => (ERROR_CODES as readonly string[]).find((c) => message.includes(c)) ?? 'unknown';

export async function rpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new RpcError(codeOf(error.message));
  return data as T;
}

/** Every RPC called through useAction. Mutations are keyed by name so paused ones can resume after an app restart. */
export const ACTION_RPCS = [
  'archive_chore', 'undo_complete', 'complete_assignment', 'claim_assignment', 'approve_plan', 'respond_swap',
  'request_swap', 'update_household', 'update_profile', 'update_busy_days', 'remove_member',
] as const;
export type ActionRpc = (typeof ACTION_RPCS)[number];

/** Only `p_` keys go to the server; the rest (e.g. `me`) are for the optimistic update. */
export const pickP = (args: Record<string, unknown>) => Object.fromEntries(Object.entries(args).filter(([k]) => k.startsWith('p_')));
export const actionFn = (fn: ActionRpc) => (args: Record<string, unknown>) => rpc(fn, pickP(args));

// Registered at module load, before the persister restores: a restored paused mutation has no hook to give it a mutationFn.
for (const fn of ACTION_RPCS) queryClient.setMutationDefaults(['rpc', fn], { mutationFn: actionFn(fn) });

/** Optimistic RPC: apply the change to the cached state instantly, roll back with a friendly toast on error. */
export function useAction<A extends Record<string, unknown>>(
  fn: ActionRpc,
  opts: { optimistic?: (s: AppState, args: A) => AppState; onSuccess?: (data: unknown, args: A) => void } = {},
) {
  const qc = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationKey: ['rpc', fn],
    mutationFn: actionFn(fn),
    onMutate: async (args: A) => {
      await qc.cancelQueries({ queryKey: STATE_KEY });
      const prev = qc.getQueryData<AppState>(STATE_KEY);
      if (prev && opts.optimistic) qc.setQueryData(STATE_KEY, opts.optimistic(prev, args));
      return { prev };
    },
    onError: (err, args, ctx) => {
      if (ctx?.prev) qc.setQueryData(STATE_KEY, ctx.prev);
      const code = err instanceof RpcError ? err.code : 'unknown';
      // a dropped connection is worth one tap to retry; a refusal from the server is not
      toast.show(errorText(code), code === 'unknown' ? { action: { label: 'Try again', onClick: () => mutation.mutate(args) } } : undefined);
    },
    onSuccess: opts.onSuccess,
    onSettled: () => qc.invalidateQueries({ queryKey: STATE_KEY }),
  });
  return mutation;
}

/** Ask the server to plan/sweep this household now (after creating, joining or adding a chore). */
export async function planNow(choreId?: string) {
  await supabase.functions.invoke('tick', { body: choreId ? { choreId } : {} });
}

const TABLES = ['assignments', 'plans', 'swap_requests', 'members', 'chores', 'streaks', 'activity'] as const;

/** One realtime channel per household; any change refetches the snapshot (debounced). */
export function useRealtime(householdId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!householdId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => qc.invalidateQueries({ queryKey: STATE_KEY }), 150);
    };
    const channel = supabase.channel(`household:${householdId}`);
    for (const table of TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `household_id=eq.${householdId}` }, refresh);
    }
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'households', filter: `id=eq.${householdId}` }, refresh);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'plan_approvals' }, refresh); // RLS scopes rows to this household
    channel.subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(channel); };
  }, [householdId, qc]);
}
