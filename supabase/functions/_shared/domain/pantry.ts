import type { Effort } from './types.ts';

export type StockLevel = 'in_stock' | 'low' | 'out';
export type PantryRule = 'ask_first' | 'do_not_touch';
export type ShelfTab = 'shared' | 'mine' | 'roommates';

/** owner_id null = shared (and rule null); otherwise personal with a rule. */
export interface PantryItem { id: string; owner_id: string | null; name: string; rule: PantryRule | null; stock: StockLevel; created_at: string; icon?: string | null }
export interface Restock {
  id: string; item_id: string | null; name: string; effort: Effort; requested_by: string; claimed_by: string | null;
  status: 'open' | 'done' | 'cancelled'; done_by: string | null;
  /** the household-local date it was done, for this week's totals */
  done_day: string | null; created_at: string;
}
export interface PantryAsk { id: string; item_id: string; from_user: string; to_user: string; status: 'pending' | 'yes' | 'no'; created_at: string }

/** Keys are lowercase, singular, letters and spaces only. Multi-word keys win over their last word ("olive oil" before "oil"). */
export const ICONS: Record<string, string> = {
  milk: '🥛', 'oat milk': '🥛', 'almond milk': '🥛', yogurt: '🥣', cereal: '🥣', butter: '🧈', cheese: '🧀', egg: '🥚',
  bread: '🍞', bagel: '🥯', rice: '🍚', pasta: '🍝', noodle: '🍜', flour: '🌾', sugar: '🍬', salt: '🧂',
  'olive oil': '🫒', olive: '🫒', oil: '🫗', pepper: '🌶️', chili: '🌶️', garlic: '🧄', onion: '🧅', ginger: '🫚',
  potato: '🥔', tomato: '🍅', carrot: '🥕', lettuce: '🥬', spinach: '🥬', broccoli: '🥦', cucumber: '🥒', corn: '🌽',
  mushroom: '🍄', avocado: '🥑', bean: '🫘', lentil: '🫘', apple: '🍎', banana: '🍌', orange: '🍊', lemon: '🍋',
  grape: '🍇', strawberry: '🍓', chicken: '🍗', meat: '🥩', fish: '🐟', coffee: '☕', tea: '🍵', juice: '🧃',
  water: '💧', soda: '🥤', 'protein shake': '🥤', 'energy drink': '⚡', beer: '🍺', wine: '🍷', honey: '🍯',
  'peanut butter': '🥜', nut: '🥜', jam: '🍓', ketchup: '🍅', chocolate: '🍫', cookie: '🍪', chip: '🥔', 'ice cream': '🍨',
  'paper towel': '🧻', 'toilet paper': '🧻', tissue: '🧻', soap: '🧼', 'dish soap': '🧼', sponge: '🧽',
  detergent: '🧴', shampoo: '🧴', toothpaste: '🪥', 'trash bag': '🗑️', 'bin bag': '🗑️',
};

const has = (key: string) => Object.hasOwn(ICONS, key); // never an inherited key like "constructor"
/** The word itself, then its singular guesses: berries → berry, tomatoes → tomato, towels → towel. */
const forms = (w: string) => [w, w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, '')];

export function iconFor(name: string): string {
  const words = name.toLowerCase().replace(/[^a-z ]/g, ' ').split(' ').filter(Boolean);
  if (!words.length) return '🛒';
  const last = words[words.length - 1];
  // longest tail first: "whole oat milk" tries "whole oat milk", then "oat milk", then "milk"
  for (let i = 0; i < words.length; i++) {
    const head = words.slice(i, -1).join(' ');
    for (const f of forms(last)) {
      const key = head ? `${head} ${f}` : f;
      if (has(key)) return ICONS[key];
    }
  }
  // then any single word, from the end: "milk (2l)", "eggs, free range", "chicken stock"
  for (const w of [...words].reverse()) for (const f of forms(w)) if (has(f)) return ICONS[f];
  return '🛒';
}

const TINTS = ['var(--light-bg)', 'var(--lav)', 'var(--peach-bg)', 'var(--pink-bg)', 'var(--medium-bg)', 'var(--sky-bg)'] as const;
/** The icon tile's pastel, derived from the icon so the same thing always gets the same colour. */
export function tintFor(icon: string): string {
  let h = 0;
  for (const ch of icon) h = (h * 31 + ch.codePointAt(0)!) % 9973;
  return TINTS[h % TINTS.length];
}

const RANK: Record<StockLevel, number> = { out: 0, low: 1, in_stock: 2 };
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });

/** Shared: out, then low, then in stock, alphabetical within each. Other tabs: alphabetical. */
export function sortShelf<T extends { name: string; stock: StockLevel }>(items: T[], tab: ShelfTab): T[] {
  return [...items].sort((a, b) => (tab === 'shared' ? RANK[a.stock] - RANK[b.stock] : 0) || byName(a, b));
}

/** Only on another member's ask-first item, and only when I have no pending ask on it. */
export function canAsk(
  item: Pick<PantryItem, 'id' | 'owner_id' | 'rule'>, me: string, asks: Pick<PantryAsk, 'item_id' | 'from_user' | 'status'>[],
): boolean {
  return item.owner_id !== null && item.owner_id !== me && item.rule === 'ask_first'
    && !asks.some((a) => a.item_id === item.id && a.from_user === me && a.status === 'pending');
}

/** My latest ask on an item (get_state sends pending asks and my asks answered in the last day). */
export const myAsk = (asks: PantryAsk[], itemId: string, me: string): PantryAsk | undefined =>
  asks.filter((a) => a.item_id === itemId && a.from_user === me).sort((x, y) => y.created_at.localeCompare(x.created_at))[0];

export const openRestocks = (restocks: Restock[]): Restock[] =>
  restocks.filter((r) => r.status === 'open').sort((x, y) => x.created_at.localeCompare(y.created_at));

export const openRestockFor = (restocks: Restock[], itemId: string): Restock | undefined =>
  restocks.find((r) => r.item_id === itemId && r.status === 'open');

export const STOCK_LABEL: Record<StockLevel, string> = { in_stock: 'In stock', low: 'Running low', out: 'Out' };
export const RULE_LABEL: Record<PantryRule, string> = { ask_first: 'Ask first', do_not_touch: 'Do not touch' };

export function requestedLine(r: Pick<Restock, 'claimed_by'>, names: Record<string, string>, me: string): string {
  if (!r.claimed_by) return 'Requested';
  return `Requested · ${r.claimed_by === me ? "You're" : `${names[r.claimed_by] ?? 'A roommate'}'s`} on it`;
}

export const BASICS = ['Olive oil', 'Rice', 'Salt', 'Milk', 'Bread', 'Paper towels'] as const;

/** The server stores names trimmed with inner spaces collapsed and compares them case-insensitively; so does the app. */
export const cleanName = (s: string) => s.trim().replace(/\s+/g, ' ');
export const sameName = (a: string, b: string) => cleanName(a).toLowerCase() === cleanName(b).toLowerCase();
