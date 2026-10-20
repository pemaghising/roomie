import * as Haptics from 'expo-haptics';
import type { PantryAsk, PantryItem, PantryRule, Restock, StockLevel } from '@domain/pantry.ts';
import { useToast } from '@/ui/toast';
import { useAction } from './state';
import type { AppState } from './types';

/** `tintFor` returns the web's CSS variables; these are the same brand pastels as hex. */
const TINT_HEX: Record<string, string> = {
  'var(--light-bg)': '#D1FAE5', 'var(--lav)': '#F3E8FF', 'var(--peach-bg)': '#FFEDD5',
  'var(--pink-bg)': '#FEE2E2', 'var(--medium-bg)': '#FEF3C7', 'var(--sky-bg)': '#DBEAFE',
};
export const tintHex = (cssVar: string) => TINT_HEX[cssVar] ?? '#F3F4F6';

export const TAG = {
  low: { bg: '#FEF3C7', fg: '#92400E' },
  out: { bg: '#FFEDD5', fg: '#9A3412' },
  ask_first: { bg: '#FFEDD5', fg: '#9A3412' },
  do_not_touch: { bg: '#FEE2E2', fg: '#991B1B' },
} as const;

const patchRestock = (s: AppState, id: string, patch: Partial<Restock>): AppState =>
  ({ ...s, restocks: s.restocks.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

/** Every pantry write, optimistic where the result is predictable; the server's answer replaces it. */
export function usePantryActions() {
  const toast = useToast();
  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const stock = useAction<{ p_id: string; p_stock: StockLevel }>('set_item_stock', {
    optimistic: (s, { p_id, p_stock }) => ({
      ...s,
      pantry: s.pantry.map((i) => (i.id === p_id ? { ...i, stock: p_stock } : i)),
      restocks: p_stock === 'in_stock'
        ? s.restocks.map((r) => (r.item_id === p_id && r.status === 'open' ? { ...r, status: 'cancelled' as const } : r))
        : s.restocks,
    }),
  });
  const rule = useAction<{ p_id: string; p_rule: PantryRule }>('set_item_rule', {
    optimistic: (s, { p_id, p_rule }) => ({ ...s, pantry: s.pantry.map((i) => (i.id === p_id ? { ...i, rule: p_rule } : i)) }),
  });
  const remove = useAction<{ p_id: string }>('remove_pantry_item', {
    optimistic: (s, { p_id }) => ({ ...s, pantry: s.pantry.filter((i) => i.id !== p_id) }),
  });
  const claim = useAction<{ p_id: string; me: string }>('claim_restock', {
    optimistic: (s, { p_id, me }) => patchRestock(s, p_id, { claimed_by: me }),
    onSuccess: () => toast.show("It's yours — thanks for covering."),
  });
  const unclaim = useAction<{ p_id: string }>('unclaim_restock', { optimistic: (s, { p_id }) => patchRestock(s, p_id, { claimed_by: null }) });
  const complete = useAction<{ p_id: string; me: string }>('complete_restock', {
    optimistic: (s, { p_id, me }) => {
      const r = s.restocks.find((x) => x.id === p_id);
      const next = patchRestock(s, p_id, { status: 'done', done_by: me });
      return r?.item_id ? { ...next, pantry: next.pantry.map((i) => (i.id === r.item_id ? { ...i, stock: 'in_stock' as const } : i)) } : next;
    },
    onSuccess: () => toast.show('Done. Nice one.'),
  });
  const cancel = useAction<{ p_id: string }>('cancel_restock', {
    optimistic: (s, { p_id }) => patchRestock(s, p_id, { status: 'cancelled' }),
  });
  const ask = useAction<{ p_item: string; name: string }>('ask_to_use', {
    onSuccess: (_d, { name }) => toast.show(`Asked ${name}. You'll hear back.`),
  });
  const answer = useAction<{ p_ask: string; p_yes: boolean }>('answer_ask', {
    optimistic: (s, { p_ask, p_yes }) => ({ ...s, asks: s.asks.map((a): PantryAsk => (a.id === p_ask ? { ...a, status: p_yes ? 'yes' : 'no' } : a)) }),
  });

  return {
    setStock: (i: PantryItem, p_stock: StockLevel) => { tap(); stock.mutate({ p_id: i.id, p_stock }); },
    setRule: (i: PantryItem, p_rule: PantryRule) => { tap(); rule.mutate({ p_id: i.id, p_rule }); },
    remove: (i: PantryItem) => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); remove.mutate({ p_id: i.id }); },
    claim: (r: Restock, me: string) => { tap(); claim.mutate({ p_id: r.id, me }); },
    unclaim: (r: Restock) => { tap(); unclaim.mutate({ p_id: r.id }); },
    complete: (r: Restock, me: string) => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); complete.mutate({ p_id: r.id, me }); },
    cancel: (r: Restock) => { tap(); cancel.mutate({ p_id: r.id }); },
    ask: (i: PantryItem, name: string) => { tap(); ask.mutate({ p_item: i.id, name }); },
    answer: (a: PantryAsk, p_yes: boolean) => { tap(); answer.mutate({ p_ask: a.id, p_yes }); },
  };
}
