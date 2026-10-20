import { reasonText } from '@domain/copy.ts';
import type { Assignment } from './types';

/** Why this chore is on this person's list. Covering for someone speaks to the person covering: their own reason is private. */
export function whyText(a: Assignment, me: string, names: Record<string, string>): string {
  if (a.claimed_by === me && a.user_id !== me) return `You're covering for ${names[a.user_id] ?? 'a roommate'}. Thanks.`;
  // the shared copy names points for the web; the app never shows them
  if (a.reason?.code === 'balance') return 'Evens out effort across the house this week.';
  return a.reason ? reasonText(a.reason, names) : 'Shared out fairly by effort.';
}
