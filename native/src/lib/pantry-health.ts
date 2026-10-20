import type { PantryItem } from '@domain/pantry.ts';

const byName = (a: PantryItem, b: PantryItem) => a.name.localeCompare(b.name);

/** The shared shelf at a glance: what needs restocking (out first, then low) and what is fine. */
export function pantryHealth(items: PantryItem[]) {
  const out = items.filter((i) => i.stock === 'out').sort(byName);
  const low = items.filter((i) => i.stock === 'low').sort(byName);
  const ok = items.filter((i) => i.stock === 'in_stock').sort(byName);
  return { total: items.length, low: low.length, out: out.length, needs: [...out, ...low], ok };
}
