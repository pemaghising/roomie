// Pantry lines (P1, W3): who's getting a low item, and who last restocked something on the shelf.
import { openRestockFor, type PantryItem, type Restock } from '@domain/pantry.ts';

const first = (names: Record<string, string>, id: string) => (names[id] ?? 'A roommate').split(' ')[0];
const days = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / 86_400_000);

export function ago(n: number): string {
  if (n <= 0) return 'today';
  if (n === 1) return 'yesterday';
  if (n < 7) return `${n} days ago`;
  if (n < 14) return 'last week';
  return `${Math.floor(n / 7)} weeks ago`;
}

export type LowRow = { kind: 'claim' } | { kind: 'mine' | 'theirs'; label: string };

export function lowRow(item: PantryItem, restocks: Restock[], me: string, names: Record<string, string>): LowRow {
  const r = openRestockFor(restocks, item.id);
  if (!r?.claimed_by) return { kind: 'claim' };
  return r.claimed_by === me ? { kind: 'mine', label: 'You’re getting it' } : { kind: 'theirs', label: `${first(names, r.claimed_by)}’s getting it` };
}

export function shelfMeta(item: PantryItem, restocks: Restock[], me: string, names: Record<string, string>, today: string): string {
  const last = restocks.filter((r) => r.item_id === item.id && r.status === 'done' && r.done_day)
    .sort((x, y) => y.done_day!.localeCompare(x.done_day!))[0];
  if (!last) {
    const when = ago(days(item.created_at, today));
    return `Added ${when}`;
  }
  return `${last.done_by === me ? 'You' : first(names, last.done_by ?? '')} · ${ago(days(last.done_day!, today))}`;
}
