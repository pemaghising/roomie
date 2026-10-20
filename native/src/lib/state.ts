// Mirrors web src/lib/state.ts. Offline mutation persistence is not ported yet.
import { createElement, type ReactElement } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ERROR_CODES, errorText } from '@domain/copy.ts';
import { useToast } from '@/ui/toast';
import { useAuth } from './auth';
import { supabase } from './supabase';
import type { AppState } from './types';
import { localToday } from './local-today';
import { applyOptimistic } from './optimistic';

export const STATE_KEY = ['app-state'] as const;

export async function fetchState(): Promise<AppState> {
  const { data, error } = await supabase.rpc('get_state');
  if (error) throw error;
  return { members: [], chores: [], plans: [], assignments: [], swaps: [], streak: null, balance: 0, activity: [], pantry: [], restocks: [], asks: [], today: localToday(new Date(), data?.household?.tz), ...data } as AppState;
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

/** Wraps a screen that needs the household, so a cold open (a link, a refresh) waits for it instead of crashing. */
export function withHousehold<P extends object>(Screen: (props: P) => ReactElement | null) {
  return function Ready(props: P) {
    const { data } = useAppState();
    return data?.household ? createElement(Screen, props) : null;
  };
}

export class RpcError extends Error {
  constructor(public code: string) { super(code); }
}

const codeOf = (message: string) => (ERROR_CODES as readonly string[]).find((c) => message.includes(c)) ?? 'unknown';

export async function rpc<T = unknown>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new RpcError(codeOf(error.message));
  return data as T;
}

export const messageOf = (err: unknown) => errorText(err instanceof RpcError ? err.code : 'unknown');

/** Only `p_` keys go to the server; the rest (e.g. `me`) feed the optimistic update. */
const pickP = (args: Record<string, unknown>) => Object.fromEntries(Object.entries(args).filter(([k]) => k.startsWith('p_')));

/** Optimistic RPC: apply the change to the cached state instantly, roll back with a friendly toast on error. */
export function useAction<A extends Record<string, unknown>>(
  fn: string,
  opts: { optimistic?: (s: AppState, args: A) => AppState; onSuccess?: (data: unknown, args: A) => void } = {},
) {
  const qc = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    mutationFn: (args: A) => rpc(fn, pickP(args)),
    onMutate: async (args: A) => {
      await qc.cancelQueries({ queryKey: STATE_KEY });
      const cached = qc.getQueryData<AppState>(STATE_KEY);
      if (!cached || !opts.optimistic) return { prev: cached };
      const { next, snapshot } = applyOptimistic(cached, (s) => opts.optimistic!(s, args));
      qc.setQueryData(STATE_KEY, next);
      return { prev: snapshot };
    },
    onError: (err, args, ctx) => {
      if (ctx?.prev) qc.setQueryData(STATE_KEY, ctx.prev);
      const code = err instanceof RpcError ? err.code : 'unknown';
      toast.show(errorText(code), code === 'unknown' ? { action: { label: 'Try again', onPress: () => mutation.mutate(args) } } : undefined);
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

const TABLES = ['assignments', 'plans', 'swap_requests', 'members', 'chores', 'streaks', 'activity', 'pantry_items', 'restock_requests'] as const;

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
    channel.subscribe();
    return () => { clearTimeout(timer); supabase.removeChannel(channel); };
  }, [householdId, qc]);
}
