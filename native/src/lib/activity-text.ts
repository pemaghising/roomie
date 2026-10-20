// Mirrors web src/features/activity/text.ts.
import type { ActivityItem } from './types';

export function activityText(item: ActivityItem, names: Record<string, string>, me: string): string {
  const p = item.payload as Record<string, string | number | undefined>;
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
};

/** A small emoji badge for each kind of event; a cheer shows the emoji that was sent. */
export function activityIcon(item: ActivityItem): { emoji: string; bg: string } {
  if (item.kind === 'kudos') return { emoji: String((item.payload as { emoji?: string }).emoji ?? '🙌'), bg: '#FCE7F3' };
  return ICONS[item.kind] ?? { emoji: '🏠', bg: '#F3F4F6' };
}

/** Unseen events lead as "New"; everything else is grouped by day in the order it arrived (newest first). */
export function groupActivity(items: ActivityItem[], tz: string, today: string, isNew: (id: number) => boolean) {
  const groups = new Map<string, ActivityItem[]>();
  const add = (label: string, x: ActivityItem) => groups.set(label, [...(groups.get(label) ?? []), x]);
  for (const x of items) if (isNew(x.id)) add('New', x);
  for (const x of items) if (!isNew(x.id)) add(dayLabel(x.created_at, tz, today), x);
  return [...groups].map(([label, list]) => ({ label, items: list }));
}
