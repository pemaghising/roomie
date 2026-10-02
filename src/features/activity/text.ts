import type { ActivityItem } from '../../lib/types';

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
    default: return 'Something happened at home';
  }
}
