// Mirrors web src/features/activity/text.ts.
import type { ActivityItem } from './types';

export function activityText(item: ActivityItem, names: Record<string, string>, me: string): string {
  const p = item.payload as Record<string, string | number | boolean | undefined>;
  const who = item.actor === me ? 'You' : (item.actor && names[item.actor]) || (p.actor as string) || 'A roommate';
  switch (item.kind) {
    case 'created': return `${who} created the home`;
    case 'joined': return `${who} joined the home`;
    case 'left': return `${who} left the home`;
    case 'completed': return `${who} finished ${p.chore}`;
    case 'claimed': return `${who} grabbed ${p.chore}`;
    case 'covered': return `${who} covered ${p.chore}`;
    case 'chore_added': return `${who} added ${p.chore}`;
    case 'swapped': return `${who} swapped a chore with ${p.with}`;
    case 'pool': return 'Some chores are up for grabs';
    case 'plan_ready': return "Next week's plan is ready to review";
    case 'plan_locked': return 'The weekly plan is locked in';
    case 'day_kept': return `${p.streak}-day streak — house peace secured`;
    case 'chore_edited': return `${who} edited ${p.chore}`;
    case 'chore_removed': return `${who} removed ${p.chore}`;
    case 'item_added': return p.shared === false ? `${who} added ${p.item} to ${item.actor === me ? 'your' : 'their'} shelf` : `${who} added ${p.item} to the shared shelf`;
    case 'item_flagged': return `${who} flagged ${p.item} as ${p.stock === 'out' ? 'out' : 'running low'}`;
    case 'item_back': return `${who} marked ${p.item} back in stock`;
    case 'item_removed': return `${who} removed ${p.item}${p.shared === false ? '' : ' from the shared shelf'}`;
    case 'restock_requested': return `${who} asked the house for ${p.item}`;
    case 'restock_claimed': return `${who} ${item.actor === me ? 'are' : 'is'} getting ${p.item}`;
    case 'restock_unclaimed': return `${who} can’t get ${p.item} after all`;
    case 'restock_cancelled': return `${who} called off the request for ${p.item}`;
    case 'restocked': return `${who} bought ${p.item}`;
    case 'kudos': {
      const to = p.to === me ? 'you' : names[p.to as string] ?? 'a roommate';
      return `${who} sent ${to} a ${p.emoji}`;
    }
    default: return 'Something happened at home';
  }
}

export const dayLabel = (iso: string, tz: string, today: string) => {
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(iso));
  if (d === today) return 'Today';
  const y = new Date(Date.parse(`${today}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  if (d === y) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: tz });
};

const ICONS: Record<string, { emoji: string; bg: string }> = {
  completed: { emoji: '✅', bg: '#DCFCE7' }, claimed: { emoji: '🙌', bg: '#FFEDD5' }, covered: { emoji: '🤝', bg: '#FEF3C7' },
  joined: { emoji: '🏠', bg: '#DBEAFE' }, left: { emoji: '👋', bg: '#F3F4F6' }, created: { emoji: '🏡', bg: '#DBEAFE' },
  chore_added: { emoji: '➕', bg: '#F3E8FF' }, swapped: { emoji: '🔄', bg: '#F3E8FF' }, pool: { emoji: '🙌', bg: '#FFEDD5' },
  plan_ready: { emoji: '📋', bg: '#EDE9FE' }, plan_locked: { emoji: '🔒', bg: '#EDE9FE' }, day_kept: { emoji: '🌱', bg: '#DCFCE7' },
  chore_edited: { emoji: '✏️', bg: '#F3E8FF' }, chore_removed: { emoji: '🗑️', bg: '#F3F4F6' },
  item_added: { emoji: '🛒', bg: '#F3E8FF' }, item_flagged: { emoji: '⚠️', bg: '#FFF1D6' }, item_back: { emoji: '✅', bg: '#DCFCE7' },
  item_removed: { emoji: '🗑️', bg: '#F3F4F6' }, restock_requested: { emoji: '🛒', bg: '#FFEDD5' }, restock_claimed: { emoji: '🙋', bg: '#FFEDD5' },
  restock_unclaimed: { emoji: '↩️', bg: '#F3F4F6' }, restock_cancelled: { emoji: '✖️', bg: '#F3F4F6' }, restocked: { emoji: '🛍️', bg: '#DCFCE7' },
};

/** A small emoji badge for each kind of event; a cheer shows the emoji that was sent. */
export function activityIcon(item: ActivityItem): { emoji: string; bg: string } {
  if (item.kind === 'kudos') return { emoji: String((item.payload as { emoji?: string }).emoji ?? '🙌'), bg: '#FCE7F3' };
  return ICONS[item.kind] ?? { emoji: '🏠', bg: '#F3F4F6' };
}

type Ask = { id: string; item_id: string; from_user: string; to_user: string; status: 'pending' | 'yes' | 'no'; created_at: string };

/**
 * "Can I use your …?" asks, only ever seen by the two people involved (get_state sends nobody else's).
 * `answer` is true when it's waiting on me, so the row shows Approve / Not now.
 */
export function askLines(asks: Ask[], pantry: { id: string; name: string }[], names: Record<string, string>, me: string) {
  const first = (id: string) => (names[id] ?? 'A roommate').split(' ')[0];
  return asks.map((a) => {
    const item = pantry.find((i) => i.id === a.item_id)?.name ?? 'something';
    const text = a.to_user === me
      ? a.status === 'pending' ? `${first(a.from_user)} asked to use your ${item}`
        : `You ${a.status === 'yes' ? 'said yes to' : 'said no to'} ${first(a.from_user)} for ${item}`
      : a.status === 'pending' ? `You asked ${first(a.to_user)} for ${item} · waiting`
        : a.status === 'yes' ? `${first(a.to_user)} approved your ask for ${item}` : `${first(a.to_user)} said not this time for ${item}`;
    return { ask: a, text, answer: a.to_user === me && a.status === 'pending', other: a.to_user === me ? a.from_user : a.to_user };
  });
}

/** Unseen events lead as "New"; everything else is grouped by day in the order it arrived (newest first). */
export function groupActivity(items: ActivityItem[], tz: string, today: string, isNew: (id: number) => boolean) {
  const groups = new Map<string, ActivityItem[]>();
  const add = (label: string, x: ActivityItem) => groups.set(label, [...(groups.get(label) ?? []), x]);
  for (const x of items) if (isNew(x.id)) add('New', x);
  for (const x of items) if (!isNew(x.id)) add(dayLabel(x.created_at, tz, today), x);
  return [...groups].map(([label, list]) => ({ label, items: list }));
}
